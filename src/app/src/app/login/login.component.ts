import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string | undefined;
  loading: boolean = false;
  darkMode: boolean = false;
  showValidation: any;

  constructor(private router: Router, private authService: AuthService) {
    this.checkDarkModePreference();
  }

  onSubmit(): void {
    if (!this.usernameOrEmail.trim() || !this.password.trim()) {
      this.errorMessage = 'Preencha as credenciais';
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;

    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro no login:', err);
        this.errorMessage = err.error?.message || 'Credenciais inválidas';
        this.loading = false;
      },
    });
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode ? 'enabled' : 'disabled');
  }

  private checkDarkModePreference() {
    const darkModePref = localStorage.getItem('darkMode');
    this.darkMode = darkModePref === 'enabled';
  }

  validateFields(): void {
    const userFilled = this.usernameOrEmail.trim().length > 0;
    const passFilled = this.password.trim().length > 0;

    if (userFilled && passFilled) {
      this.showValidation = false;
      this.errorMessage = undefined;
    }
  }
}
