// services/websocket.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Client, StompConfig, StompHeaders } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private client: Client | null = null;
  private isBrowser: boolean;

  // ✅ Estado de conexão observável
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  // ✅ Usuários online observável
  private onlineUsersSubject = new BehaviorSubject<number>(0);
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  // ✅ Mensagens do chat
  private messagesSubject = new BehaviorSubject<any[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // ✅ Usuários digitando
  private typingUsersSubject = new BehaviorSubject<string[]>([]);
  public typingUsers$ = this.typingUsersSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ✅ Conectar ao WebSocket usando STOMP
  connect(token: string, user: any): void {
    // 1. Condição de SAÍDA: Se não for o browser OU se o cliente existir E estiver conectado, retorne.
    //    (Isso evita reconexões desnecessárias quando o usuário já está ativo.)
    if (!this.isBrowser || (this.client && this.client.connected)) {
      return;
    }

    // 2. 🎯 CORREÇÃO CRÍTICA: Se a instância for nula (após o logout), RECRIA.
    if (!this.client) {
      // Configuração do cliente STOMP é movida aqui para ser executada apenas na criação.
      const stompConfig: StompConfig = {
        // ✅ Usando SockJS para melhor compatibilidade
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

        // ✅ Configurações de reconexão (mantenha)
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // ✅ Callbacks (mantenha)
        onConnect: (frame) => {
          this.isConnectedSubject.next(true);
          this.setupSubscriptions(user);
        },
        onStompError: (frame) => {
          this.isConnectedSubject.next(false);
        },
        onDisconnect: (frame) => {},
        onWebSocketError: (error) => {
          this.isConnectedSubject.next(false);
        },
      };

      this.client = new Client(stompConfig); // Cria a instância somente se for a primeira vez ou após o logout.
    }

    // 3. 🎯 AÇÃO CHAVE: Headers de autenticação (sempre atualiza antes de ativar!)
    //    Isso garante que o token mais recente seja usado para conexão/reativação.
    this.client!.connectHeaders = {
      Authorization: `Bearer ${token}`,
      'X-User-ID': user?.id?.toString() || '',
      'X-User-Name': user?.fullName || user?.username || 'Usuário',
    };

    // 4. Ativa a conexão (funciona tanto para a nova instância quanto para a reativação)
    this.client!.activate();
  }

  // ✅ Configurar subscrições após conectar
  private setupSubscriptions(user: any): void {
    if (!this.client || !this.client.connected) return;

    // ✅ Subscrever ao contador de usuários online
    this.client.subscribe('/topic/users/online', (message) => {
      const count = parseInt(message.body);
      this.onlineUsersSubject.next(count);
    });

    // ✅ Subscrever às mensagens do chat público
    this.client.subscribe('/topic/chat/messages', (message) => {
      const messageData = JSON.parse(message.body);
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, messageData]);
    });

    // ✅ Subscrever ao histórico de mensagens
    this.client.subscribe('/topic/chat/history', (message) => {
      const messages = JSON.parse(message.body);
      this.messagesSubject.next(messages);
    });

    // ✅ Subscrever a mensagens privadas para o usuário
    if (user?.id) {
      this.client.subscribe(`/queue/user/${user.id}/messages`, (message) => {
        const messageData = JSON.parse(message.body);
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, messageData]);
      });
    }

    // ✅ Subscrever a usuários digitando
    this.client.subscribe('/topic/chat/typing', (message) => {
      const typingData = JSON.parse(message.body);
      this.updateTypingUsers(typingData);
    });

    // ✅ Notificar que o usuário está online
    this.client.publish({
      destination: '/app/user/online',
      body: JSON.stringify({
        userId: user?.id,
        userName: user?.fullName || user?.username || 'Usuário',
        timestamp: new Date().toISOString(),
      }),
    });

    // ✅ Solicitar histórico de mensagens
    this.client.publish({
      destination: '/app/chat/history',
      body: JSON.stringify({ userId: user?.id }),
    });
  }

  // ✅ Atualizar lista de usuários digitando
  private updateTypingUsers(typingData: any): void {
    let currentTyping = this.typingUsersSubject.value;

    if (typingData.typing) {
      // Adicionar usuário à lista se não estiver presente
      if (!currentTyping.includes(typingData.userName)) {
        currentTyping = [...currentTyping, typingData.userName];
      }
    } else {
      // Remover usuário da lista
      currentTyping = currentTyping.filter(
        (name) => name !== typingData.userName
      );
    }

    this.typingUsersSubject.next(currentTyping);
  }

  // ✅ Desconectar
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.isConnectedSubject.next(false);
      this.onlineUsersSubject.next(0);
      this.messagesSubject.next([]);
      this.typingUsersSubject.next([]);
      this.client = null;
    }
  }

  // ✅ Verificar se está conectado
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  // ✅ Enviar mensagem
  sendMessage(message: string, user: any): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat/send',
        body: JSON.stringify({
          message: message,
          userId: user?.id,
          userName: user?.fullName || user?.username || 'Usuário',
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
    }
  }

  // ✅ Enviar mensagem privada
  sendPrivateMessage(message: string, recipientId: string, user: any): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat/private',
        body: JSON.stringify({
          message: message,
          recipientId: recipientId,
          senderId: user?.id,
          senderName: user?.fullName || user?.username || 'Usuário',
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
    }
  }

  // ✅ Publicar evento genérico
  publish(destination: string, data: any, headers?: StompHeaders): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(data),
        headers: headers,
      });
    } else {
    }
  }

  // ✅ Subscrever a um tópico
  subscribe(destination: string, callback: (message: any) => void): any {
    if (this.client?.connected) {
      return this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          callback(message.body);
        }
      });
    } else {
      return null;
    }
  }

  // ✅ Cancelar subscrição
  unsubscribe(subscription: any): void {
    if (subscription && subscription.unsubscribe) {
      subscription.unsubscribe();
    }
  }

  // ✅ Marcar usuário como digitando
  startTyping(user: any): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat/typing',
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.fullName || user?.username || 'Usuário',
          typing: true,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }

  // ✅ Parar de digitar
  stopTyping(user: any): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat/typing',
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.fullName || user?.username || 'Usuário',
          typing: false,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }

  // ✅ Obter status atual
  getConnectionStatus(): {
    connected: boolean;
    onlineUsers: number;
    typingUsers: string[];
  } {
    return {
      connected: this.isConnectedSubject.value,
      onlineUsers: this.onlineUsersSubject.value,
      typingUsers: this.typingUsersSubject.value,
    };
  }

  // ✅ Limpar mensagens
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  // ✅ Reconectar manualmente
  reconnect(token: string, user: any): void {
    this.disconnect();
    setTimeout(() => {
      this.connect(token, user);
    }, 1000);
  }

  // ✅ Entrar em uma sala/canal específico
  joinRoom(roomId: string, user: any): Observable<any> {
    return new Observable((observer) => {
      if (this.client?.connected) {
        // Subscrever às mensagens da sala
        const subscription = this.client.subscribe(
          `/topic/room/${roomId}`,
          (message) => {
            try {
              const data = JSON.parse(message.body);
              observer.next(data);
            } catch (error) {
              observer.error(error);
            }
          }
        );

        // Notificar entrada na sala
        this.client.publish({
          destination: '/app/room/join',
          body: JSON.stringify({
            roomId: roomId,
            userId: user?.id,
            userName: user?.fullName || user?.username || 'Usuário',
            timestamp: new Date().toISOString(),
          }),
        });

        // Retornar função para cancelar subscrição
        return () => {
          subscription.unsubscribe();
          if (this.client?.connected) {
            this.client.publish({
              destination: '/app/room/leave',
              body: JSON.stringify({
                roomId: roomId,
                userId: user?.id,
                timestamp: new Date().toISOString(),
              }),
            });
          }
        };
      } else {
        observer.error('WebSocket não conectado');
        // Retornar função de teardown vazia para garantir retorno em todos os caminhos
        return () => {};
      }
    });
  }

  // ✅ Enviar mensagem para uma sala específica
  sendRoomMessage(roomId: string, message: string, user: any): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/room/message',
        body: JSON.stringify({
          roomId: roomId,
          message: message,
          userId: user?.id,
          userName: user?.fullName || user?.username || 'Usuário',
          timestamp: new Date().toISOString(),
        }),
      });
    }
  }
}
