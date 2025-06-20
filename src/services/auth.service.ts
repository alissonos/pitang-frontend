import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  login(usernameOrEmail: string, password: string): Observable<any> {
    const body = { usernameOrEmail, password };
    return this.http.post(`${this.config.apiUrl}/auth/login`, body).pipe(
      tap((response: any) => {
        localStorage.setItem('authToken', response.token); // Armazena o token
        localStorage.setItem('currentUser', JSON.stringify(response.user)); // Dados do usuário
      })
    );
  }

  private nomeUsuarioSubject = new BehaviorSubject<string>(
    localStorage.getItem('nomeUsuario') || 'Usuário'
  );
  nomeUsuario$ = this.nomeUsuarioSubject.asObservable();

  setNomeUsuario(fullName: string) {
    localStorage.setItem('nomeUsuario', fullName);
    this.nomeUsuarioSubject.next(fullName);
  }

  getNomeUsuario() {
    return localStorage.getItem('nomeUsuario') || 'Usuário';
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('nomeUsuario');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  signup(userData: any) {
    return this.http.post(`${this.config.apiUrl}/auth/signup`, userData);
  }
}
