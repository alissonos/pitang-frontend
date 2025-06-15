import { User } from './../../../../models/user.model';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string | undefined;

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/users']);
    } else {
      this.error = 'Usuário ou senha inválidos';
    }
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}
