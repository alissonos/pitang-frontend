import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes'; // Importe suas rotas
import { AuthInterceptor } from './app/auth.interceptor'; // Ajuste o caminho conforme sua estrutura

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    provideAnimations(),
    // Remova o provider manual de HTTP_INTERCEPTORS se estiver usando withInterceptors
  ],
}).catch((err) => console.error(err));
