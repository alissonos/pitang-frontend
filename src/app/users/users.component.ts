// users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { UserEditComponent } from './user-edit/user-edit.component';
import { MatDialog } from '@angular/material/dialog';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatToolbar } from '@angular/material/toolbar';
import { MatCardContent } from '../../../node_modules/@angular/material/card/index';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedUserId: number | null = null;
  isLoading: boolean = true;
  filteredOptions: any;
  searchControl: any;

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

  displayedColumns: string[] = ['fullName', 'email', 'role', 'actions'];
}
