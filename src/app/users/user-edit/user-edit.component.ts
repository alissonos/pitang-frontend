// user-edit.component.ts
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';

import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

// Definir as roles/permissões disponíveis
export interface Role {
  id: number;
  name: string;
  displayName: string;
}

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
})
export class UserEditComponent implements OnInit {
  user: User | null = null;
  isLoading: boolean = true;
  successMessage: string = '';

  userForm: FormGroup;
  isModalOpen = false;

  // Lista de roles/permissões disponíveis
  availableRoles: Role[] = [
    { id: 1, name: 'SUPER_ADMIN', displayName: 'Super Administrador' },
    { id: 2, name: 'ADMIN', displayName: 'Administrador' },
    { id: 3, name: 'MANAGER', displayName: 'Gerente' },
    { id: 4, name: 'EMPLOYEE', displayName: 'Funcionário' },
    { id: 5, name: 'USER', displayName: 'Usuário' },
    { id: 6, name: 'GUEST', displayName: 'Visitante' },
  ];

  @Output() save = new EventEmitter<any>();
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number },
    private dialogRef: MatDialogRef<UserEditComponent>
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required], // Corrigido: usar 'role' em vez de 'permissao'
      password: [''],
    });

    this.data.userId = data.userId;
  }

  ngOnInit(): void {
    console.log(
      'UserEditComponent ngOnInit - userId recebido:',
      this.data.userId
    );

    // Carregar as roles do backend (opcional)
    this.loadRoles();

    if (this.data.userId) {
      this.loadUserData(this.data.userId);
    } else {
      console.warn(
        'UserEditComponent: userId não fornecido via MAT_DIALOG_DATA.'
      );
      this.isLoading = false;
    }
  }

  // Método para carregar roles do backend (opcional)
  loadRoles(): void {
    // Se você tiver um serviço para buscar roles do backend:
    // this.userService.getRoles().subscribe({
    //   next: (roles) => {
    //     this.availableRoles = roles;
    //   },
    //   error: (err) => console.error('Erro ao carregar roles:', err)
    // });
  }

  loadUserData(userId: number): void {
    this.isLoading = true;
    console.log('UserEditComponent: Carregando dados para userId:', userId);

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role ? user.role.id : '', // Usar o ID da role
          password: '', // Não preencher senha existente
        });
        this.isLoading = false;
        console.log('UserEditComponent: Dados do usuário carregados:', user);
      },
      error: (err) => {
        console.error('UserEditComponent: Erro ao carregar usuário:', err);
        this.isLoading = false;
      },
    });
  }

  saveUser() {
    if (this.userForm.invalid) return;

    const userData = this.userForm.value;
    this.save.emit(userData);
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    const userData = this.userForm.value;

    if (this.data.userId) {
      // Atualiza usuário existente
      this.userService.updateUser(this.data.userId, userData).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error(err),
      });
    } else {
      // Cria novo usuário
      this.userService.createUser(userData).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error(err),
      });
    }
  }

  closeModal() {
    this.dialogRef.close();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
