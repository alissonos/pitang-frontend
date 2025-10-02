import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface User {
  id: number;
  nome: string;
  avatar?: string;
  status: 'online' | 'ausente' | 'ocupado';
}

@Component({
  selector: 'app-users-online',
  standalone: true, // ← Tem que ter isso
  imports: [CommonModule], // ← E isso
  templateUrl: './users-online.component.html',
  styleUrls: ['./users-online.component.css'],
})
export class UsersOnlineComponent implements OnInit {
  users: User[] = [];

  ngOnInit(): void {
    // Dados mockados - depois você substitui pela chamada real da API/WebSocket
    this.users = [
      { id: 1, nome: 'João Silva', status: 'online' },
      { id: 2, nome: 'Maria Santos', status: 'online' },
      { id: 3, nome: 'Pedro Costa', status: 'ausente' },
      { id: 4, nome: 'Ana Paula', status: 'online' },
      { id: 5, nome: 'Carlos Eduardo', status: 'ocupado' },
    ];
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
}
