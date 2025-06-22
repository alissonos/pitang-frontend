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

import { UserService } from '../../../../../services/user.service';
import { User } from '../../../../../models/user.model';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
})
export class UserEditComponent implements OnInit, OnChanges {
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
    console.log('ngOnInit - userId:', this.data.userId);
    // IMPORTANTE: não faz nada aqui porque userId pode ser null no início
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && changes['userId'].currentValue !== null) {
      const newUserId = changes['userId'].currentValue;
      console.log('ngOnChanges - Novo userId recebido:', newUserId);
      this.loadUserData(newUserId);
    }
  }

  loadUserData(userId: number): void {
    this.isLoading = true;
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.userForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          password: '',
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuário:', err);
        this.isLoading = false;
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
