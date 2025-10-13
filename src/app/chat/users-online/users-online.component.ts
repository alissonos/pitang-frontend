import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users-online',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-online.component.html',
  styleUrls: ['./users-online.component.css'],
})
export class UsersOnlineComponent implements OnInit, OnDestroy {
  users: User[] = [];
  connectedUsers: number = 0;
  private destroy$ = new Subject<void>();
  lastError: string = '';
  @Output() userSelected = new EventEmitter<any>(); // Emite o usuário clicado

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.connectToChat();
    this.loadUsers();
  }

  selectUser(user: any) {
    // Aqui você pode adicionar lógica para destacar o usuário selecionado
    this.userSelected.emit(user);
  }

  loadUsers(): void {
    const currentUser = this.authService.getCurrentUser();

    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Usuários recebidos:', data);
          console.log('Usuário atual:', currentUser);
          // Filtra *apenas* os usuários que têm status 'online'
          // Se a API retornar todos os usuários, esta é a forma correta de filtrar.
          this.users = data.filter(
            (user) =>
              user.status === 'ONLINE' &&
              Number(user.id) !== Number(currentUser?.id)
          );
          this.cdr.detectChanges(); // Garante que a view é atualizada
        },
        error: (err) => {
          this.handleError('Erro ao carregar usuários.');
          console.error('Erro ao carregar usuários:', err);
        },
      });
  }

  getInitials(nome: string): string {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      ONLINE: '#10b981',
      AWAY: '#f59e0b',
      BUSY: '#ef4444',
      OFFLINE: '#6b7280',
    };
    return colors[status.toUpperCase()] || '#6b7280';
  }

  private connectToChat(): void {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
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
  }

  private handleError(message: string): void {
    this.lastError = message;
    console.error('Chat Error:', message);
    this.cdr.detectChanges();
  }
}
