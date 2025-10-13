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
import { UsersOnlineComponent } from './users-online/users-online.component';

// NOVO: Importe o modelo User
import { User } from '../../models/user.model'; // ASSUMIDO: Ajuste o caminho conforme sua estrutura

export interface ChatMessage {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  // NOVO: Adicionado receiverId para mensagens privadas
  receiverId?: string;
  timestamp: Date;
  type?: 'MESSAGE' | 'SYSTEM';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, UsersOnlineComponent],
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

  // MANTIDO: selectedUser, agora com o tipo User importado
  selectedUser: User | null = null;

  // Controle de componente
  private destroy$ = new Subject<void>();
  private typingTimer: any;
  private shouldScrollToBottom: boolean = false;
  private userScrolledUp: boolean = false;
  private userCountRefreshTimer: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.connectToChat();
    // REMOVIDO: this.loadChatHistory(); // Removido, pois o chat passa a ser privado por padrão
    this.startUserCountRefresh();
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
    this.clearUserCountRefreshTimer(); // NOVO: Limpar o timer de contagem
  }

  // NOVO: Método para lidar com a seleção do usuário (do UsersOnlineComponent)
  onUserSelected(user: User): void {
    if (this.selectedUser?.id === user.id) {
      // Já estamos na conversa com este usuário
      return;
    }

    // 1. Define o novo usuário selecionado
    this.selectedUser = user;

    // 2. Limpa o histórico de mensagens anterior
    this.messages = [];

    // 3. Carrega o histórico de conversa com o novo usuário
    this.loadConversationHistory(String(user.id));

    // 4. Se o chatService tiver um método para se inscrever no tópico privado, chame-o aqui.
    // Ex: this.chatService.subscribeToPrivateTopic(this.currentUserId, user.id);

    // Força atualização da view
    this.cdr.detectChanges();
  }

  private initializeUser(): void {
    try {
      // CORRIGIDO: Tipagem mais segura para evitar 'unknown as' se possível.
      // Manter a estrutura atual, mas usar o tipo User
      const user = this.authService.getCurrentUser() as unknown as User;

      // Logs para depuração
      console.log(
        'Usuario do localStorage:',
        this.authService.getCurrentUser()
      );
      console.log(
        'Nome vindo de getNomeUsuario():',
        this.authService.getNomeUsuario()
      );

      // CORRIGIDO: user.id deve ser verificado se existe antes de ser usado.
      if (user?.id) {
        // Garantindo que ID e nome são strings
        this.currentUserId = String(user.id);
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

  // ALTERADO: subscribeToEvents() ajustado para lidar com mensagens privadas
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
            this.requestUserCount();
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
            // LÓGICA CHAVE: Adicionar mensagem APENAS se for do chat GERAL (SEM receiverId)
            // OU se for uma mensagem privada entre o usuário atual e o usuário SELECIONADO.

            const isGeneralMessage = !message.receiverId && !this.selectedUser;

            // Verifica se a mensagem é para ou do usuário atualmente selecionado
            const isCurrentPrivateMessage =
              this.selectedUser &&
              ((message.senderId === String(this.selectedUser.id) &&
                message.receiverId === this.currentUserId) ||
                (message.senderId === this.currentUserId &&
                  message.receiverId === String(this.selectedUser.id)));

            if (isGeneralMessage || isCurrentPrivateMessage) {
              this.messages.push(message);
              this.shouldScrollToBottom = true;
              this.cdr.detectChanges();
            }
          }
        },
        error: (error) => this.handleError('Erro ao receber mensagem'),
      });

    // Contagem de usuários (Mantido)
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

    // Indicador de digitação (Mantido, mas considere escutar apenas o usuário selecionado)
    this.chatService
      .onTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // NOVO: Apenas mostra o indicador se a digitação for do usuário selecionado
          const isTypingForSelectedUser =
            this.selectedUser &&
            data &&
            data.userId === String(this.selectedUser.id);

          if (
            data &&
            data.userId !== this.currentUserId &&
            isTypingForSelectedUser
          ) {
            this.isTyping = data.isTyping;
            this.typingUser = data.userName;
            this.cdr.detectChanges();
          }
        },
        error: (error) => this.handleError('Erro no indicador de digitação'),
      });

    // Erros (Mantido)
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

  // NOVO: Método para carregar histórico de conversa privada
  loadConversationHistory(receiverId: string): void {
    if (!receiverId) return;

    this.chatService
      .getMessagesHistory(receiverId) // ASSUMIDO: Seu ChatService tem este método
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.handleError('Erro ao carregar histórico da conversa');
        },
      });
  }

  // REMOVIDO: loadChatHistory() se torna loadConversationHistory()

  // Método para solicitar contagem de usuários manualmente (Mantido)
  private requestUserCount(): void {
    if (this.isConnected) {
      this.chatService.requestUserCount();
    }
  }

  // Inicia refresh periódico da contagem de usuários (Mantido)
  private startUserCountRefresh(): void {
    this.userCountRefreshTimer = setInterval(() => {
      this.requestUserCount();
    }, 10000); // A cada 10 segundos
  }

  // Limpa o timer de refresh da contagem (Mantido)
  private clearUserCountRefreshTimer(): void {
    if (this.userCountRefreshTimer) {
      clearInterval(this.userCountRefreshTimer);
      this.userCountRefreshTimer = null;
    }
  }

  // ALTERADO: sendMessage() agora inclui o receiverId
  sendMessage(): void {
    const messageContent = this.newMessage.trim();

    // Requer que o chat esteja conectado E um usuário selecionado
    if (!messageContent || !this.isConnected || !this.selectedUser) {
      return;
    }

    const message: ChatMessage = {
      content: messageContent,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      receiverId: String(this.selectedUser.id), // CHAVE: ID do destinatário
      timestamp: new Date(),
      type: 'MESSAGE',
    };

    try {
      if (this.selectedUser && this.selectedUser.id) {
        this.chatService.sendTyping(false, this.selectedUser.id); // Envia o indicador de digitação
      }
      this.chatService.sendMessage(message);

      // Adiciona a mensagem imediatamente à lista local para visualização
      this.messages.push(message);

      this.newMessage = '';
      this.shouldScrollToBottom = true;
      this.clearTypingTimer();
    } catch (error) {
      this.handleError('Erro ao enviar mensagem');
    }
  }

  // ALTERADO: onTyping() agora deve enviar o ID do destinatário
  onTyping(): void {
    // Requer que o chat esteja conectado E UM usuário selecionado
    // O "!this.isConnected || !this.selectedUser" está correto para early return.
    if (!this.isConnected || !this.selectedUser) {
      return;
    }

    try {
      // 1. O TypeScript agora sabe que selectedUser NÃO É NULO aqui.
      // 2. Converta o ID para string, conforme necessário para o protocolo STOMP,
      //    e porque o ChatService aceita string | number.
      const receiverId = String(this.selectedUser.id);

      // Envia indicador para o usuário selecionado
      this.chatService.sendTyping(true, receiverId);

      this.clearTypingTimer();

      this.typingTimer = setTimeout(() => {
        // Para de digitar para o usuário selecionado
        this.chatService.sendTyping(false, receiverId);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar indicador de digitação:', error);
    }
  }

  onScroll(): void {
    if (!this.messagesContainer) return;

    const container = this.messagesContainer.nativeElement;
    const threshold = 100;

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
    // NOVO: Só permite enviar se houver um usuário selecionado
    return (
      this.newMessage.trim().length > 0 &&
      this.isConnected &&
      !!this.selectedUser
    );
  }

  get statusClass(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  get hasError(): boolean {
    return this.lastError.length > 0;
  }
}
