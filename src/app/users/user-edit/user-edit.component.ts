import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { userId: number },
    private dialogRef: MatDialogRef<UserEditComponent>
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
    });

    this.data.userId = data.userId;
  }

  ngOnInit(): void {
    console.log(
      'UserEditComponent ngOnInit - userId recebido:',
      this.data.userId
    );
    // IMPORTANTE: Chamar loadUserData aqui, pois o userId já está disponível do MAT_DIALOG_DATA
    if (this.data.userId) {
      this.loadUserData(this.data.userId);
    } else {
      console.warn(
        'UserEditComponent: userId não fornecido via MAT_DIALOG_DATA.'
      );
      this.isLoading = false; // Parar o carregamento se não houver userId
    }
  }

  loadUserData(userId: number): void {
    this.isLoading = true;
    console.log('UserEditComponent: Carregando dados para userId:', userId);
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          password: '', // Importante: não preencher a senha existente
        });
        this.isLoading = false;
        console.log(
          'UserEditComponent: Dados do usuário carregados e form preenchido.',
          user
        );
      },
      error: (err) => {
        console.error('UserEditComponent: Erro ao carregar usuário:', err);
        this.isLoading = false;
        // Opcional: Exibir uma mensagem de erro ou fechar o modal em caso de falha no carregamento
      },
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.data.userId === null) {
      console.warn('Formulário inválido ou userId nulo.');
      return;
    }

    const userData = this.userForm.value;

    this.userService.updateUser(this.data.userId, userData).subscribe({
      next: (updatedUser) => {
        console.log('Usuário atualizado com sucesso:', updatedUser);
        // Aqui você pode emitir um evento para o pai ou fechar o modal
        this.successMessage = 'Usuário atualizado com sucesso!';
        setTimeout(() => {
          this.dialogRef.close();
        }, 2000);
      },
      error: (err) => {
        console.error('Erro ao atualizar o usuário:', err);
      },
    });
  }

  closeModal() {
    // Lógica para fechar a modal, por exemplo:
    this.dialogRef.close();
  }
}
