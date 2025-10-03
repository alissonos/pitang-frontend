import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { Subject, takeUntil } from 'rxjs';

interface User {
  id: number;
  nome: string;
  avatar?: string;
  status: 'online' | 'ausente' | 'ocupado';
}

@Component({
  selector: 'app-users-online',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-online.component.html',
  styleUrls: ['./users-online.component.css'],
})
export class UsersOnlineComponent implements OnInit {
  users: User[] = [];
  connectedUsers: number = 0;
  private destroy$ = new Subject<void>();
  lastError: string = '';

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Dados mockados - depois você substitui pela chamada real da API/WebSocket
    this.users = [
      { id: 1, nome: 'João Silva', status: 'online' },
      { id: 2, nome: 'Maria Santos', status: 'online' },
      { id: 3, nome: 'Pedro Costa', status: 'ausente' },
      { id: 4, nome: 'Ana Paula', status: 'online' },
      { id: 5, nome: 'Carlos Eduardo', status: 'ocupado' },
    ];

    this.connectToChat();
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
      online: '#10b981',
      ausente: '#f59e0b',
      ocupado: '#ef4444',
    };
    return colors[status] || '#6b7280';
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
