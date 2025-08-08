import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

@Component({
    selector: 'app-signup',
    imports: [FormsModule, CommonModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupData = {
    username: '',
    email: '',
    password: '',
  };

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.http
      .post('http://localhost:8080/api/v1/auth/signup', this.signupData)
      .subscribe({
        next: (response) => {
          console.log('Cadastro realizado!', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Erro no cadastro:', error);
        },
      });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
