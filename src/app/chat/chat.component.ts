import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

export interface ChatMessage {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type?: 'MESSAGE' | 'SYSTEM';
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

  // Propriedades do componente
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUserId: string = '';
  currentUserName: string = '';
  isConnected: boolean = false;
  connectedUsers: number = 0;
  isTyping: boolean = false;
  typingUser: string = '';
  connectionStatus: string = 'Desconectado';
  lastError: string = '';

  // Controle de componente
  private destroy$ = new Subject<void>();
  private typingTimer: any;
  private shouldScrollToBottom: boolean = false;
  private userScrolledUp: boolean = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.connectToChat();
    this.loadChatHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && !this.userScrolledUp) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
    this.clearTypingTimer();
  }

  private initializeUser(): void {
    try {
      const user = this.authService.getCurrentUser() as unknown as {
        id: string;
        name?: string;
        username?: string;
      };

      // Logs para depuração
      console.log(
        'Usuario do localStorage:',
        this.authService.getCurrentUser()
      );
      console.log(
        'Nome vindo de getNomeUsuario():',
        this.authService.getNomeUsuario()
      );

      if (user?.id) {
        this.currentUserId = user.id;
        this.currentUserName = user.name || user.username || 'Usuário';
      } else {
        this.handleError('Usuário não autenticado');
      }
    } catch (error) {
      this.handleError('Erro ao obter dados do usuário');
    }
  }

  private connectToChat(): void {
    if (!this.currentUserId) {
      this.handleError('Não é possível conectar sem ID de usuário');
      return;
    }

    this.chatService.connect(this.currentUserId, this.currentUserName);
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    // Conexão estabelecida
    this.chatService
      .onConnect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (connected) => {
          this.isConnected = connected;
          this.connectionStatus = connected ? 'Conectado' : 'Desconectado';
          if (connected) {
            this.lastError = '';
          }
          this.cdr.detectChanges();
        },
        error: (error) => this.handleError('Erro na conexão'),
      });

    // Novas mensagens
    this.chatService
      .onMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          if (message) {
            this.messages.push(message);
            this.shouldScrollToBottom = true;
            this.cdr.detectChanges();
          }
        },
        error: (error) => this.handleError('Erro ao receber mensagem'),
      });

    // Contagem de usuários
    this.chatService
      .onUserCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.connectedUsers = count;
          this.cdr.detectChanges();
        },
        error: (error) =>
          this.handleError('Erro ao obter contagem de usuários'),
      });

    // Indicador de digitação
    this.chatService
      .onTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && data.userId !== this.currentUserId) {
            this.isTyping = data.isTyping;
            this.typingUser = data.userName;
            this.cdr.detectChanges();
          }
        },
        error: (error) => this.handleError('Erro no indicador de digitação'),
      });

    // Erros
    this.chatService
      .onError()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (error) => {
          if (error) {
            this.handleError(error.message || 'Erro desconhecido no chat');
          }
        },
      });
  }

  private loadChatHistory(): void {
    this.chatService
      .getChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.handleError('Erro ao carregar histórico do chat');
        },
      });
  }

  sendMessage(): void {
    const messageContent = this.newMessage.trim();

    if (!messageContent || !this.isConnected) {
      return;
    }

    const message: ChatMessage = {
      content: messageContent,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      timestamp: new Date(),
      type: 'MESSAGE',
    };

    try {
      this.chatService.sendMessage(message);
      this.newMessage = '';
      this.shouldScrollToBottom = true;
      this.clearTypingTimer();
    } catch (error) {
      this.handleError('Erro ao enviar mensagem');
    }
  }

  onTyping(): void {
    if (!this.isConnected) return;

    try {
      this.chatService.sendTyping(true);
      this.clearTypingTimer();

      this.typingTimer = setTimeout(() => {
        this.chatService.sendTyping(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar indicador de digitação:', error);
    }
  }

  onScroll(): void {
    if (!this.messagesContainer) return;

    const container = this.messagesContainer.nativeElement;
    const threshold = 100; // pixels do fundo

    this.userScrolledUp =
      container.scrollTop + container.clientHeight + threshold <
      container.scrollHeight;
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
        this.userScrolledUp = false;
      }
    } catch (error) {
      console.error('Erro ao rolar para o final:', error);
    }
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

  reconnect(): void {
    this.chatService.forceReconnect();
  }

  clearError(): void {
    this.lastError = '';
  }

  private handleError(message: string): void {
    this.lastError = message;
    console.error('Chat Error:', message);
    this.cdr.detectChanges();
  }

  private clearTypingTimer(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  // Getters para template
  get canSendMessage(): boolean {
    return this.newMessage.trim().length > 0 && this.isConnected;
  }

  get statusClass(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  get hasError(): boolean {
    return this.lastError.length > 0;
  }
}
