import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { AuthService } from '../services/auth.service';

const serverConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthFactory,
      deps: [AuthService],  
      multi: true,
    },
  ],
};

export function initializeAuthFactory(authService: AuthService) {
  return () => authService.initializeAuth();
}
export const config = mergeApplicationConfig(appConfig, serverConfig);
