// users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { UserEditComponent } from './user-edit/user-edit.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UserEditComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedUserId: number | null = null;
  isLoading: boolean = true;

  constructor(private userService: UserService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar usuários:', err);
        this.isLoading = false;
      },
    });
  }

  selectUser(id: number): void {
    this.selectedUserId = this.selectedUserId === id ? null : id;
  }

  // Método unificado para abrir o diálogo (editar ou criar)
  openUserDialog(userId?: number) {
    console.log('Abrindo diálogo para userId:', userId);

    const dialogRef = this.dialog.open(UserEditComponent, {
      data: {
        userId: userId || null, // CORRIGIDO: Garantir que seja null se não definido
      },
      width: '600px',
      disableClose: true, // Opcional: impede fechar clicando fora
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Diálogo fechado com resultado:', result);
      // result será true se salvou com sucesso
      if (result === true) {
        this.loadUsers(); // Recarregar a lista de usuários
      }
    });
  }

  deleteUser(userId: number): void {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        console.log('Usuário deletado com sucesso');
        this.users = this.users.filter((user) => user.id !== userId); // Atualiza a lista localmente
      },
      error: (err) => {
        console.error('Erro ao deletar o usuário:', err);
      },
    });
  }

  // REMOVIDO: Método createUser duplicado, já que openUserDialog() faz tudo
}
