import { User } from './../../../../models/user.model';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string | undefined;
  http: any;
  private apiUrl = 'http://localhost:8081/api/v1/auth';

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit(): void {
    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (response) => {
        console.log('Redirecionando para /dashboard...', response);
        this.router.navigate(['/dashboard']); // Redireciona explicitamente
      },
      error: (err) => {
        console.error('Erro no login:', err);
        this.errorMessage = 'Credenciais inválidas';
      },
    });
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
