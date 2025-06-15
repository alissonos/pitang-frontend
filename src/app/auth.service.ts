import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/v1/auth';

  constructor(private http: HttpClient) {}

  /* login(username: string, password: string): boolean {
    if (username === 'admin' && password === '1234') {
      localStorage.setItem('isLoggedIn', 'true');
      return true;
    }
    return false;
  }*/

  login(usernameOrEmail: string, password: string): Observable<any> {
    const body = { usernameOrEmail, password };
    return this.http.post(`${this.apiUrl}/login`, body).pipe(
      tap((response: any) => {
        localStorage.setItem('authToken', response.token); // Armazena o token
        localStorage.setItem('currentUser', JSON.stringify(response.user)); // Dados do usuário
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  signup(userData: any) {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }
}
