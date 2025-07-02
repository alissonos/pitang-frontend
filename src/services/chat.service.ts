import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ChatMessage } from '../app/chat/chat.component';
import io, { Socket } from 'socket.io-client'; // Importa io como default e Socket como tipo
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: ReturnType<typeof io> | null = null;
  private apiUrl = 'http://localhost:8080/api'; // URL do seu backend
  private socketUrl = 'http://localhost:8080'; // URL do WebSocket

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

  constructor(private http: HttpClient) {}

  // Conectar ao WebSocket
  connect(userId: string, userName: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.socketUrl, {
      auth: {
        userId: userId,
        userName: userName,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Conectado ao WebSocket');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado do WebSocket');
      this.connectedSubject.next(false);
    });

    this.socket.on('message', (message: ChatMessage) => {
      this.messageSubject.next(message);
    });

    this.socket.on('userCount', (count: number) => {
      this.userCountSubject.next(count);
    });

    this.socket.on(
      'typing',
      (data: { userId: string; userName: string; isTyping: boolean }) => {
        this.typingSubject.next(data);
      }
    );

    this.socket.on('error', (error: any) => {
      console.error('Erro no WebSocket:', error);
      this.errorSubject.next(error);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão:', error);
      this.errorSubject.next(error);
    });
  }

  // Desconectar
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Enviar mensagem
  sendMessage(message: ChatMessage): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', message);
    }
  }

  // Enviar indicador de digitação
  sendTyping(isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { isTyping });
    }
  }

  // Buscar histórico de mensagens via HTTP
  getChatHistory(): Observable<ChatMessage[]> {
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
    return this.socket?.connected || false;
  }
}
