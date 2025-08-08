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
import { Role, User } from '../../../models/user.model';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
    selector: 'app-user-edit',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatOptionModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
    ],
    templateUrl: './user-edit.component.html',
    styleUrl: './user-edit.component.css'
})
export class UserEditComponent implements OnInit {
  user: User | null = null;
  isLoading: boolean = true;
  successMessage: string = '';

  userForm: FormGroup;
  isModalOpen = false;

  // Lista de roles/permissões disponíveis
  availableRoles: Role[] = [
    { id: 1, name: 'ROLE_ADMIN', displayName: 'Super Administrador' },
    { id: 2, name: 'ROLE_USER', displayName: 'Administrador' },
    { id: 3, name: 'ROLE_ORGANIZER', displayName: 'Gerente' },
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

      this.userForm.get('password')?.setValidators([Validators.required]);
      this.userForm.get('password')?.updateValueAndValidity();
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
          role: user.roleId ? user.roleId.id : '', // Usar o ID da role
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
    if (this.userForm.invalid) {
      // Marcar todos os campos como touched para mostrar erros
      this.userForm.markAllAsTouched();
      return;
    }

    const userData = { ...this.userForm.value };

    // CORRIGIDO: Mapear 'role' para 'roleId' para o backend
    userData.roleId = userData.role;
    delete userData.role;

    // Se é edição e senha está vazia, remover do payload
    if (this.data.userId && !userData.password) {
      delete userData.password;
    }

    if (this.data.userId) {
      // Atualiza usuário existente
      this.userService.updateUser(this.data.userId, userData).subscribe({
        next: () => {
          this.successMessage = 'Usuário atualizado com sucesso!';
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err) => {
          console.error('Erro ao atualizar usuário:', err);
        },
      });
    } else {
      // Cria novo usuário
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.successMessage = 'Usuário criado com sucesso!';
          setTimeout(() => this.dialogRef.close(true), 1500);
        },
        error: (err) => {
          console.error('Erro ao criar usuário:', err);
        },
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
