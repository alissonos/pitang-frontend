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

  // BehaviorSubject para nome do usuário
  private nomeUsuarioSubject = new BehaviorSubject<string>('Usuário');
  nomeUsuario$ = this.nomeUsuarioSubject.asObservable();

  // BehaviorSubject para estado de login
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  loggedIn$ = this.loggedInSubject.asObservable();

  // ADICIONE ESTA LINHA - BehaviorSubject para controlar quando a auth foi carregada
  private authLoadedSubject = new BehaviorSubject<boolean>(false);
  authLoaded$ = this.authLoadedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private config: ConfigService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // MODIFIQUE ESTA PARTE - Adicione initializeAuth()
    this.initializeAuth();
  }

  // ADICIONE ESTE MÉTODO
  private initializeAuth(): void {
    if (this.isBrowser) {
      // Pequeno delay para garantir que o localStorage seja acessível
      setTimeout(() => {
        const nomeSalvo = localStorage.getItem('nomeUsuario');
        if (nomeSalvo) {
          this.nomeUsuarioSubject.next(nomeSalvo);
        }

        // Atualiza loggedInSubject com base no token ao iniciar
        const token = localStorage.getItem('authToken');
        this.loggedInSubject.next(!!token);

        // IMPORTANTE: Marca que a autenticação foi carregada
        this.authLoadedSubject.next(true);
      }, 0);
    } else {
      // No servidor, marca como carregado imediatamente
      this.authLoadedSubject.next(true);
    }
  }

  // O resto dos seus métodos permanecem iguais...
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

  getCurrentUser(): { id: string; name?: string; username?: string } | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  login(usernameOrEmail: string, password: string): Observable<any> {
    const body = { usernameOrEmail, password };
    return this.http.post(`${this.config.apiUrl}/auth/login`, body).pipe(
      tap((response: any) => {
        this.setInStorage('authToken', response.token);

        const user = {
          id: response.id,
          name: response.fullName, // renomeado para consistência
          username: response.username || response.email || '',
        };

        this.setInStorage('currentUser', JSON.stringify(user));

        // Salva o nome para mostrar corretamente no reload
        this.setNomeUsuario(response.fullName);

        // Atualiza estado de login
        this.loggedInSubject.next(true);
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

    // Atualiza estado de login
    this.loggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return !!this.getFromStorage('authToken');
  }

  // Novo método assíncrono para usar no guard
  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$;
  }

  getToken(): string | null {
    return this.getFromStorage('authToken');
  }

  signup(userData: any) {
    return this.http.post(`${this.config.apiUrl}/auth/signup`, userData);
  }
}
