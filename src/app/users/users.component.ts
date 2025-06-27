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

  openUserDialog(userId?: number) {
    const dialogRef = this.dialog.open(UserEditComponent, {
      data: { userId: userId ?? null },
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.loadUsers();
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

  createUser() {
    const dialogRef = this.dialog.open(UserEditComponent, {
      data: { userId: null },
      width: '600px',
    });

    dialogRef.componentInstance.save.subscribe((userData: any) => {
      this.userService.createUser(userData).subscribe({
        next: (createdUser) => {
          console.log('Usuário criado:', createdUser);
          this.loadUsers(); // Atualiza a lista
          dialogRef.close(); // (opcional, já fecha no filho)
        },
        error: (err) => {
          console.error('Erro ao criar usuário:', err);
        },
      });
    });
  }
}
