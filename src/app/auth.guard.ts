import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take, filter, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Primeiro, aguarda até que a autenticação seja carregada
    return this.authService.authLoaded$.pipe(
      filter((loaded) => loaded), // Só prossegue quando a auth foi carregada
      take(1), // Pega o primeiro valor onde loaded = true
      switchMap(() => {
        // Agora verifica o status de login
        return this.authService.isLoggedIn$().pipe(
          take(1),
          map((loggedIn) => {
            if (loggedIn) {
              return true;
            }
            return this.router.parseUrl('/login');
          })
        );
      })
    );
  }
}
