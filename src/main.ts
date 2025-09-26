import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch, // 👈 Importar withFetch
  withInterceptorsFromDi, // 👈 Importar withInterceptorsFromDi para interceptors de Classe
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_INITIALIZER } from '@angular/core';

import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/auth.interceptor';
import { AuthService } from './services/auth.service';

// Factory function para o APP_INITIALIZER
export function initializeAuth(authService: AuthService) {
  return (): Promise<void> => {
    return authService.initializeAuth();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // 💡 MUDANÇA AQUI:
    provideHttpClient(
      withFetch(), // 👈 Adicionado para resolver o NG02801 (melhor performance/SSR)
      withInterceptorsFromDi() // 👈 Adicionado para garantir que o interceptor de classe funcione corretamente
    ),
    {
      // Seu interceptor de classe (mantém o uso do AuthInterceptor)
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      // Seu APP_INITIALIZER (está correto)
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
