import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ChatMessage } from '../app/chat/chat.component';
import { Client } from '@stomp/stompjs';

// Declare SockJS para usar sem import específico
declare const SockJS: any;

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private stompClient: Client | null = null;
  private apiUrl = 'http://localhost:8081/api';
  private socketUrl = 'http://localhost:8081/ws';

  // Subjects para observables
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<ChatMessage | null>(null);
  private userCountSubject = new BehaviorSubject<number>(0);
  private typingSubject = new BehaviorSubject<{
    userId: string;
    userName: string;
    isTyping: boolean;
  } | null>(null);
  private errorSubject = new BehaviorSubject<any>(null);

  private currentUserId: string = '';
  private currentUserName: string = '';
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor(private http: HttpClient) {
    console.log('ChatService initialized');
  }

  // Conectar ao WebSocket via STOMP
  connect(userId: string, userName: string): void {
    console.log('Connect called with:', userId, userName);

    if (this.stompClient?.connected) {
      console.log('Already connected');
      return;
    }

    this.currentUserId = userId;
    this.currentUserName = userName;
    this.connectionAttempts = 0;

    this.attemptConnection();
  }

  private attemptConnection(): void {
    this.connectionAttempts++;
    console.log(`Attempting connection #${this.connectionAttempts}`);

    try {
      // Configurar cliente STOMP
      this.stompClient = new Client({
        // Usar WebSocket nativo primeiro, fallback para SockJS
        webSocketFactory: () => {
          try {
            // Tentar WebSocket nativo primeiro
            return new WebSocket(this.socketUrl.replace('http', 'ws'));
          } catch (error) {
            console.log('WebSocket nativo falhou, tentando SockJS');
            // Fallback para SockJS
            return new SockJS(this.socketUrl);
          }
        },

        // Headers de conexão
        connectHeaders: {
          userId: this.currentUserId,
          userName: this.currentUserName,
        },

        // Configurações de debug - só em desenvolvimento
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },

        // Configurações de reconexão
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // Configurações de timeout
        connectionTimeout: 10000,
      });

      // Callback de conexão bem-sucedida
      this.stompClient.onConnect = (frame) => {
        console.log('✅ Conectado ao STOMP:', frame);
        this.connectedSubject.next(true);
        this.connectionAttempts = 0;
        this.errorSubject.next(null);

        // Subscrever aos tópicos
        this.subscribeToTopics();
      };

      // Callback de erro STOMP
      this.stompClient.onStompError = (frame) => {
        console.error('❌ Erro STOMP:', frame.headers['message']);
        console.error('Detalhes:', frame.body);
        this.handleConnectionError(frame);
      };

      // Callback de desconexão
      this.stompClient.onDisconnect = (frame) => {
        console.log('🔌 Desconectado do STOMP');
        this.connectedSubject.next(false);
      };

      // Callback de erro de WebSocket
      this.stompClient.onWebSocketError = (error) => {
        console.error('❌ Erro WebSocket:', error);
        this.handleConnectionError(error);
      };

      // Ativar cliente STOMP
      this.stompClient.activate();
    } catch (error) {
      console.error('❌ Erro ao criar cliente STOMP:', error);
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any): void {
    console.error('Erro no chat:', error);
    this.errorSubject.next(error);

    if (this.connectionAttempts < this.maxConnectionAttempts) {
      console.log(
        `Tentando reconectar em 5 segundos... (${this.connectionAttempts}/${this.maxConnectionAttempts})`
      );
      setTimeout(() => {
        this.attemptConnection();
      }, 5000);
    } else {
      console.error('❌ Máximo de tentativas de conexão excedido');
      this.connectedSubject.next(false);
    }
  }

  // Subscrever aos tópicos STOMP
  private subscribeToTopics(): void {
    if (!this.stompClient?.connected) {
      console.error('Cliente STOMP não conectado para subscrições');
      return;
    }

    console.log('📡 Subscrevendo aos tópicos...');

    try {
      // Subscrever ao tópico de mensagens públicas
      this.stompClient.subscribe('/topic/public', (message) => {
        console.log('📨 Mensagem recebida:', message.body);
        const chatMessage: ChatMessage = JSON.parse(message.body);
        this.messageSubject.next(chatMessage);
      });

      // Subscrever ao tópico de contagem de usuários
      this.stompClient.subscribe('/topic/userCount', (message) => {
        console.log('👥 Contagem de usuários:', message.body);
        const count: number = JSON.parse(message.body);
        this.userCountSubject.next(count);
      });

      // Subscrever ao tópico de digitação
      this.stompClient.subscribe('/topic/typing', (message) => {
        console.log('⌨️ Indicador de digitação:', message.body);
        const typingData: {
          userId: string;
          userName: string;
          isTyping: boolean;
        } = JSON.parse(message.body);
        this.typingSubject.next(typingData);
      });

      // Subscrever a mensagens privadas (opcional)
      this.stompClient.subscribe(
        `/user/${this.currentUserId}/queue/private`,
        (message) => {
          console.log('🔒 Mensagem privada:', message.body);
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageSubject.next(chatMessage);
        }
      );

      console.log('✅ Subscrito a todos os tópicos');
    } catch (error) {
      console.error('❌ Erro ao subscrever aos tópicos:', error);
      this.errorSubject.next(error);
    }
  }

  // Desconectar
  disconnect(): void {
    console.log('🔌 Desconectando...');
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectedSubject.next(false);
      console.log('✅ Desconectado');
    }
  }

  // Enviar mensagem
  sendMessage(message: ChatMessage): void {
    if (!this.stompClient?.connected) {
      console.error('❌ Cliente STOMP não conectado para enviar mensagem');
      return;
    }

    try {
      // Adicionar informações do usuário se não estiverem presentes
      const messageWithUser = {
        ...message,
        userId: message.userId || this.currentUserId,
        userName: message.userName || this.currentUserName,
        timestamp: new Date().toISOString(),
      };

      console.log('📤 Enviando mensagem:', messageWithUser);

      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messageWithUser),
      });

      console.log('✅ Mensagem enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      this.errorSubject.next(error);
    }
  }

  // Enviar indicador de digitação
  sendTyping(isTyping: boolean): void {
    if (!this.stompClient?.connected) {
      return;
    }

    try {
      const typingData = {
        userId: this.currentUserId,
        userName: this.currentUserName,
        isTyping: isTyping,
      };

      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(typingData),
      });
    } catch (error) {
      console.error('❌ Erro ao enviar indicador de digitação:', error);
    }
  }

  // Buscar histórico de mensagens via HTTP
  getChatHistory(): Observable<ChatMessage[]> {
    console.log('📚 Buscando histórico de mensagens...');
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/messages`);
  }

  // Observables para componentes
  onConnect(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  onDisconnect(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  onMessage(): Observable<ChatMessage | null> {
    return this.messageSubject.asObservable();
  }

  onUserCount(): Observable<number> {
    return this.userCountSubject.asObservable();
  }

  onTyping(): Observable<{
    userId: string;
    userName: string;
    isTyping: boolean;
  } | null> {
    return this.typingSubject.asObservable();
  }

  onError(): Observable<any> {
    return this.errorSubject.asObservable();
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  // Enviar mensagem via REST (fallback)
  sendMessageViaRest(message: ChatMessage): Observable<ChatMessage> {
    console.log('📤 Enviando mensagem via REST:', message);
    return this.http.post<ChatMessage>(`${this.apiUrl}/chat/send`, message);
  }

  // Método para obter status da conexão
  getConnectionStatus(): string {
    if (!this.stompClient) return 'Não inicializado';
    if (this.stompClient.connected) return 'Conectado';
    if (this.connectionAttempts > 0) return 'Conectando...';
    return 'Desconectado';
  }

  // Método para forçar reconexão
  forceReconnect(): void {
    console.log('🔄 Forçando reconexão...');
    this.disconnect();
    setTimeout(() => {
      if (this.currentUserId && this.currentUserName) {
        this.connect(this.currentUserId, this.currentUserName);
      }
    }, 1000);
  }
}
