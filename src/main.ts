import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
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
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    // ADICIONE ESTE PROVIDER:
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
