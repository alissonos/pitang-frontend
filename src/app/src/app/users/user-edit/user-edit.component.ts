import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necessário para diretivas comuns do Angular
import { FormBuilder, FormsModule, Validators } from '@angular/forms'; // Necessário para two-way data binding com ngModel

import { UserService } from '../../../../../services/user.service';
import { User } from '../../../../../models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css',
})
export class UserEditComponent implements OnInit {
  @Input() userId: number | null = null;
  user: User | null = null;
  isLoading: boolean = true;
  userForm: any;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // pode ser opcional
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.userId === null) return;

    const userData = this.userForm.value;

    this.userService.updateUser(this.userId, userData).subscribe({
      next: (updatedUser) => {
        console.log('Usuário atualizado com sucesso:', updatedUser);
        // Aqui você pode emitir um evento para o pai recarregar a lista ou esconder o formulário
      },
      error: (err) => {
        console.error('Erro ao atualizar o usuário:', err);
      },
    });
  }

  ngOnInit(): void {
    if (this.userForm.invalid) return;

    if (this.userId === null) {
      console.error('userId is null. Cannot update user.');
      return;
    }

    const userData = this.userForm.value;

    this.userService.updateUser(this.userId, userData).subscribe({
      next: (updatedUser) => {
        console.log('Usuário atualizado com sucesso:', updatedUser);
        // ex: this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        console.error('Erro ao atualizar o usuário:', err);
      },
    });

    console.log('ID recebido:', this.userId);
  }
}
