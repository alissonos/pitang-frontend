import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

export interface ChatMessage {
  userName: string;
  userId: string;
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type?: 'message' | 'system';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  currentUserName: string = '';
  isConnected: boolean = false;
  connectedUsers: number = 0;
  isTyping: boolean = false;
  typingUser: string = '';

  private typingTimer: any;
  private shouldScrollToBottom: boolean = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.connectToChat();
    this.loadChatHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
  }

  private initializeUser(): void {
    const user = this.authService.getCurrentUser() as unknown as {
      id: string;
      name?: string;
      username?: string;
    };
    if (user !== undefined && user !== null) {
      this.currentUserId = user.id;
      this.currentUserName = user.name || user.username || '';
    }
  }

  private connectToChat(): void {
    this.chatService.connect(this.currentUserId, this.currentUserName);

    // Escutar conexão estabelecida
    this.chatService.onConnect().subscribe(() => {
      this.isConnected = true;
      console.log('Conectado ao chat');
    });

    // Escutar desconexão
    this.chatService.onDisconnect().subscribe(() => {
      this.isConnected = false;
      console.log('Desconectado do chat');
    });

    // Escutar novas mensagens
    this.chatService.onMessage().subscribe((message: ChatMessage | null) => {
      if (message) {
        this.messages.push(message);
        this.shouldScrollToBottom = true;
      }
    });

    // Escutar usuários online
    this.chatService.onUserCount().subscribe((count: number) => {
      this.connectedUsers = count;
    });

    // Escutar indicador de digitação
    this.chatService
      .onTyping()
      .subscribe(
        (
          data: { userId: string; userName: string; isTyping: boolean } | null
        ) => {
          if (data && data.userId !== this.currentUserId) {
            this.isTyping = data.isTyping;
            this.typingUser = data.userName;
          }
        }
      );

    // Escutar erros
    this.chatService.onError().subscribe((error: any) => {
      console.error('Erro no chat:', error);
      this.isConnected = false;
    });
  }

  private loadChatHistory(): void {
    this.chatService.getChatHistory().subscribe({
      next: (messages: ChatMessage[]) => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      },
      error: (error: any) => {
        console.error('Erro ao carregar histórico:', error);
      },
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.isConnected) {
      return;
    }

    const message: ChatMessage = {
      content: this.newMessage.trim(),
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: new Date(),
      userId: '',
      userName: '',
    };

    this.chatService.sendMessage(message);
    this.newMessage = '';
    this.shouldScrollToBottom = true;
  }

  onTyping(): void {
    if (!this.isConnected) return;

    // Notificar que está digitando
    this.chatService.sendTyping(true);

    // Limpar timer anterior
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    // Parar de digitar após 2 segundos de inatividade
    this.typingTimer = setTimeout(() => {
      this.chatService.sendTyping(false);
    }, 2000);
  }

  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Erro ao rolar para o final:', err);
    }
  }
}
