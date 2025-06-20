import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../../config/config.service';

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
    CarouselModule,
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
  showPassword: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private config: ConfigService,
    private http: HttpClient
  ) {}

  fazerLogin(): void {
    if (!this.usernameOrEmail.trim() || !this.password.trim()) {
      this.errorMessage = 'Preencha as credenciais';
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;

    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (response) => {
        // Após login bem-sucedido, buscar dados do usuário
        this.http
          .get<any>(
            `${this.config.apiUrl}/users/username/${this.usernameOrEmail}`
          )
          .subscribe({
            next: (user) => {
              localStorage.setItem('nomeUsuario', user.fullName);
              this.authService.setNomeUsuario(user.fullName);

              this.router.navigate(['/dashboard']);
              this.loading = false;
            },
            error: () => {
              this.snackBar.open('Erro ao buscar usuário', 'Fechar', {
                duration: 3000,
                verticalPosition: 'top',
                panelClass: ['error-snackbar'],
              });
              this.loading = false;
            },
          });
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

  validateFields(): void {
    const userFilled = this.usernameOrEmail.trim().length > 0;
    const passFilled = this.password.trim().length > 0;

    if (userFilled && passFilled) {
      this.showValidation = false;
      this.errorMessage = undefined;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  customOptions = {
    loop: true,
    autoplay: true,
    dots: false,
    nav: false,
    items: 1,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
  };
}
