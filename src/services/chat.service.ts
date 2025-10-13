import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, map, catchError, of, timer } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChatMessage } from '../app/chat/chat.component'; // Garante que a interface ChatMessage está importada
import { Client } from '@stomp/stompjs';

interface ConnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  private stompClient: Client | null = null;
  private readonly config: ConnectionConfig = {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    heartbeatInterval: 10000,
    connectionTimeout: 15000,
  };

  // URLs configuráveis
  private readonly apiUrl = 'http://localhost:8081/api';
  private readonly socketUrl = 'http://localhost:8081/ws';

  // Subjects para comunicação
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly messageSubject = new BehaviorSubject<ChatMessage | null>(
    null
  );
  private readonly userCountSubject = new BehaviorSubject<number>(0);
  private readonly typingSubject = new BehaviorSubject<{
    userId: string;
    userName: string;
    isTyping: boolean;
    // Adicionado receiverId para identificar quem está digitando em um chat privado
    receiverId?: string;
  } | null>(null);
  private readonly errorSubject = new BehaviorSubject<Error | null>(null);

  // Estado da conexão
  private currentUserId: string = '';
  private currentUserName: string = '';
  private retryCount: number = 0;
  private reconnectTimer: any = null;
  private isDestroyed: boolean = false;
  handleError: any;

  constructor(private http: HttpClient) {
    this.setupErrorHandling();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.completeSubjects();
  }

  // Conectar ao WebSocket
  connect(userId: string, userName: string): void {
    this.isDestroyed = false; // <- importante
    if (this.stompClient?.connected) {
      console.log('Já conectado');
      return;
    }

    this.currentUserId = userId;
    this.currentUserName = userName;
    this.retryCount = 0;
    this.clearReconnectTimer();

    this.attemptConnection();
  }

  private attemptConnection(): void {
    if (this.isDestroyed) return;

    this.retryCount++;
    console.log(`Tentativa de conexão #${this.retryCount}`);

    this.cleanup();
    this.createStompClient();
    this.activateClient();
  }

  private createStompClient(): void {
    this.stompClient = new Client({
      webSocketFactory: () => this.createWebSocket(),
      connectHeaders: {
        userId: this.currentUserId,
        userName: this.currentUserName,
      },
      debug: (str) => this.debugLog(str),
      reconnectDelay: 0, // Controlamos a reconexão manualmente
      heartbeatIncoming: this.config.heartbeatInterval,
      heartbeatOutgoing: this.config.heartbeatInterval,
      connectionTimeout: this.config.connectionTimeout,
    });

    this.setupClientCallbacks();
  }

  private createWebSocket(): WebSocket {
    try {
      // Tentar usar SockJS se disponível
      if (typeof (window as any).SockJS !== 'undefined') {
        console.log('Usando SockJS');
        return new (window as any).SockJS(this.socketUrl);
      }

      // Fallback para WebSocket nativo
      console.log('Usando WebSocket nativo');
      const wsUrl = this.socketUrl
        .replace('http://', 'ws://')
        .replace('https://', 'wss://');
      return new WebSocket(wsUrl);
    } catch (error) {
      console.error('Erro ao criar WebSocket:', error);
      throw new Error('Falha ao criar conexão WebSocket');
    }
  }

  private setupClientCallbacks(): void {
    if (!this.stompClient) return;

    this.stompClient.onConnect = (frame) => {
      console.log('✅ Conectado:', frame);
      this.connectedSubject.next(true);
      this.retryCount = 0;
      this.errorSubject.next(null);
      this.subscribeToTopics();
      this.requestUserCount();
    };

    this.stompClient.onStompError = (frame) => {
      const error = new Error(`STOMP: ${frame.headers['message']}`);
      console.error('❌ Erro STOMP:', error);
      this.handleConnectionError(error);
    };

    this.stompClient.onDisconnect = (frame) => {
      console.log('🔌 Desconectado');
      this.connectedSubject.next(false);
      this.scheduleReconnect();
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('❌ Erro WebSocket:', error);
      this.handleConnectionError(new Error('Erro de WebSocket'));
    };

    this.stompClient.onWebSocketClose = (event) => {
      console.log('🔌 WebSocket fechado:', event.code);
      this.connectedSubject.next(false);

      if (event.code !== 1000) {
        // Não foi fechamento normal
        this.scheduleReconnect();
      }
    };
  }

  private activateClient(): void {
    if (!this.stompClient || this.isDestroyed) return;

    try {
      this.stompClient.activate();
    } catch (error) {
      console.error('❌ Erro ao ativar cliente:', error);
      this.handleConnectionError(error);
    }
  }

  private subscribeToTopics(): void {
    if (!this.stompClient?.connected || this.isDestroyed) return;

    console.log('📡 Subscrevendo aos tópicos...');

    try {
      // Mensagens públicas
      this.stompClient.subscribe('/topic/public', (message) => {
        this.handleMessage(message, 'public');
      });

      // Contagem de usuários
      this.stompClient.subscribe('/topic/userCount', (message) => {
        const count = JSON.parse(message.body);
        console.log('🧮 Contagem de usuários recebida:', count);
        this.userCountSubject.next(count); // ou qualquer lógica sua
      });

      // Indicador de digitação GERAL (Fallback)
      this.stompClient.subscribe('/topic/typing', (message) => {
        this.handleTyping(message);
      });

      // Mensagens e indicadores de digitação privados
      // Este é o tópico CHAVE para receber mensagens PRIVADAS.
      this.stompClient.subscribe(
        `/user/${this.currentUserId}/queue/private`,
        (message) => {
          this.handleMessage(message, 'private');
        }
      );

      // Indicador de digitação PRIVADO
      this.stompClient.subscribe(
        `/user/${this.currentUserId}/queue/typing`,
        (message) => {
          this.handleTyping(message);
        }
      );

      console.log('✅ Subscrito a todos os tópicos');
    } catch (error) {
      console.error('❌ Erro ao subscrever:', error);
      this.errorSubject.next(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private handleMessage(message: any, type: string): void {
    try {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      console.log(`📨 Mensagem ${type} recebida:`, chatMessage);
      this.messageSubject.next(chatMessage);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  private handleUserCount(message: any): void {
    try {
      const count: number = JSON.parse(message.body);
      console.log('👥 Usuários online:', count);
      this.userCountSubject.next(count);
    } catch (error) {
      console.error('Erro ao processar contagem:', error);
    }
  }

  private handleTyping(message: any): void {
    try {
      const typingData = JSON.parse(message.body);
      console.log('⌨️ Digitação:', typingData);
      this.typingSubject.next(typingData);
    } catch (error) {
      console.error('Erro ao processar digitação:', error);
    }
  }

  private handleConnectionError(error: any): void {
    console.error('Erro na conexão:', error);
    this.errorSubject.next(
      error instanceof Error ? error : new Error(String(error))
    );
    this.connectedSubject.next(false);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.retryCount >= this.config.maxRetries) {
      if (this.retryCount >= this.config.maxRetries) {
        const maxError = new Error('Máximo de tentativas excedido');
        this.errorSubject.next(maxError);
      }
      return;
    }

    this.clearReconnectTimer();
    const delay = this.calculateDelay();

    console.log(
      `🔄 Reconectando em ${delay / 1000}s... (${this.retryCount}/${
        this.config.maxRetries
      })`
    );

    this.reconnectTimer = setTimeout(() => {
      this.attemptConnection();
    }, delay);
  }

  private calculateDelay(): number {
    const exponentialDelay =
      this.config.baseDelay * Math.pow(2, this.retryCount - 1);
    return Math.min(exponentialDelay, this.config.maxDelay);
  }

  disconnect(): void {
    console.log('🔌 Desconectando...');
    this.isDestroyed = true;
    this.clearReconnectTimer();
    this.cleanup();
    this.connectedSubject.next(false);
  }

  private cleanup(): void {
    if (this.stompClient) {
      try {
        if (this.stompClient.connected) {
          this.stompClient.deactivate();
        }
      } catch (error) {
        console.warn('Erro durante cleanup:', error);
      }
      this.stompClient = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private completeSubjects(): void {
    this.connectedSubject.complete();
    this.messageSubject.complete();
    this.userCountSubject.complete();
    this.typingSubject.complete();
    this.errorSubject.complete();
  }

  // Métodos públicos

  // ALTERADO: sendMessage agora verifica se a mensagem é pública ou privada
  sendMessage(message: ChatMessage): void {
    // Tenta enviar via WebSocket primeiro
    if (!this.stompClient?.connected) {
      console.error(
        '❌ Não conectado para enviar mensagem. Tentando REST fallback...'
      );
      this.sendMessageViaRest(message).subscribe({
        next: () => console.log('✅ Mensagem enviada via REST'),
        error: (error) => this.errorSubject.next(error),
      });
      return;
    }

    try {
      const messagePayload = {
        ...message,
        senderId: message.senderId || this.currentUserId,
        senderName: message.senderName || this.currentUserName,
        timestamp: new Date().toISOString(),
      };

      // CHAVE: Se houver receiverId, usa o destino privado
      const destination = message.receiverId
        ? `/app/chat.sendPrivateMessage/${message.receiverId}`
        : '/app/chat.sendMessage';

      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(messagePayload),
      });

      console.log(`✅ Mensagem enviada via WebSocket para: ${destination}`);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      this.errorSubject.next(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // ALTERADO: sendTyping agora aceita o receiverId opcional (string)
  sendTyping(isTyping: boolean, receiverId?: string | number): void {
    if (!this.stompClient?.connected) return;

    try {
      const typingData = {
        userId: this.currentUserId,
        userName: this.currentUserName,
        isTyping,
        receiverId, // Inclui o receiverId no payload, se existir
      };

      // CHAVE: Define o destino. Se houver receiverId, envia para o tópico privado.
      const destination = receiverId
        ? `/app/chat.typing.private/${receiverId}`
        : '/app/chat.typing'; // Fallback para tópico público

      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(typingData),
      });

      console.log(`✅ Indicador de digitação enviado para: ${destination}`);
    } catch (error) {
      console.error('❌ Erro ao enviar indicador de digitação:', error);
    }
  }

  // Métodos HTTP
  getChatHistory(): Observable<ChatMessage[]> {
    return this.http
      .get<ChatMessage[]>(`${this.apiUrl}/chat/messages`)
      .pipe(
        catchError(this.handleHttpError<ChatMessage[]>('getChatHistory', []))
      );
  }

  // NOVO: Implementação do método para buscar o histórico de mensagens privadas
  getMessagesHistory(receiverId: string): Observable<ChatMessage[]> {
    const url = `${this.apiUrl}/chat/history/private/${receiverId}`; // Endpoint REST para histórico privado
    console.log(`📡 Solicitando histórico privado: ${url}`);

    return this.http
      .get<ChatMessage[]>(url)
      .pipe(
        catchError(
          this.handleHttpError<ChatMessage[]>('getMessagesHistory', [])
        )
      );
  }

  sendMessageViaRest(message: ChatMessage): Observable<ChatMessage> {
    const messagePayload = {
      ...message,
      senderId: message.senderId || this.currentUserId,
      senderName: message.senderName || this.currentUserName,
      timestamp: new Date().toISOString(),
    };

    return this.http
      .post<ChatMessage>(`${this.apiUrl}/chat/send`, messagePayload)
      .pipe(
        catchError(this.handleHttpError<ChatMessage>('sendMessageViaRest'))
      );
  }

  testConnection(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/health`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Observables
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
    receiverId?: string; // Incluído para refletir o payload completo
  } | null> {
    return this.typingSubject.asObservable();
  }

  onError(): Observable<Error | null> {
    return this.errorSubject.asObservable();
  }

  // Utilitários
  isConnected(): boolean {
    return this.stompClient?.connected || false;
  }

  getConnectionStatus(): string {
    if (!this.stompClient) return 'Não inicializado';
    if (this.stompClient.connected) return 'Conectado';
    if (this.retryCount > 0)
      return `Conectando... (${this.retryCount}/${this.config.maxRetries})`;
    return 'Desconectado';
  }

  /**
   * Solicita a contagem atual de usuários online
   */
  requestUserCount(): void {
    if (!this.stompClient?.connected) {
      console.warn(
        '⚠️ WebSocket desconectado, não é possível solicitar contagem de usuários'
      );
      return;
    }

    try {
      console.log('👥 Solicitando contagem de usuários...');
      this.stompClient.publish({
        destination: '/app/chat.getUserCount',
        body: JSON.stringify({
          userId: this.currentUserId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('❌ Erro ao solicitar contagem de usuários:', error);
      this.handleError('Erro ao solicitar contagem', error);
    }
  }

  forceReconnect(): void {
    console.log('🔄 Forçando reconexão...');
    this.disconnect();
    this.isDestroyed = false;
    this.retryCount = 0;

    setTimeout(() => {
      if (this.currentUserId && this.currentUserName) {
        this.connect(this.currentUserId, this.currentUserName);
      }
    }, 1000);
  }

  // Utilitários privados
  private handleHttpError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} falhou:`, error);
      this.errorSubject.next(new Error(`${operation}: ${error.message}`));
      return of(result as T);
    };
  }

  private debugLog(str: string): void {
    if (!str.includes('PING') && !str.includes('PONG')) {
      console.log('STOMP:', str);
    }
  }

  private setupErrorHandling(): void {
    // Tratar erros globais não capturados
    window.addEventListener('error', (event) => {
      if (
        event.error?.message?.includes('WebSocket') ||
        event.error?.message?.includes('STOMP')
      ) {
        console.error('Erro global de WebSocket:', event.error);
        this.handleConnectionError(event.error);
      }
    });
  }
}
