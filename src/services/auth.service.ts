import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Métodos auxiliares para localStorage
  private getFromStorage(key: string): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  private setInStorage(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private removeFromStorage(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  // BehaviorSubject inicializado de forma segura
  private nomeUsuarioSubject = new BehaviorSubject<string>(
    this.getFromStorage('nomeUsuario') || 'Usuário'
  );
  nomeUsuario$ = this.nomeUsuarioSubject.asObservable();

  getCurrentUser() {
    throw new Error('Method not implemented.');
  }

  login(usernameOrEmail: string, password: string): Observable<any> {
    const body = { usernameOrEmail, password };
    return this.http.post(`${this.config.apiUrl}/auth/login`, body).pipe(
      tap((response: any) => {
        this.setInStorage('authToken', response.token);
        this.setInStorage('currentUser', JSON.stringify(response.user));
      })
    );
  }

  setNomeUsuario(fullName: string) {
    this.setInStorage('nomeUsuario', fullName);
    this.nomeUsuarioSubject.next(fullName);
  }

  getNomeUsuario(): string {
    return this.getFromStorage('nomeUsuario') || 'Usuário';
  }

  logout(): void {
    this.removeFromStorage('authToken');
    this.removeFromStorage('currentUser');
    this.removeFromStorage('nomeUsuario');
    this.nomeUsuarioSubject.next('Usuário');
  }

  isLoggedIn(): boolean {
    return !!this.getFromStorage('authToken');
  }

  getToken(): string | null {
    return this.getFromStorage('authToken');
  }

  signup(userData: any) {
    return this.http.post(`${this.config.apiUrl}/auth/signup`, userData);
  }
}
