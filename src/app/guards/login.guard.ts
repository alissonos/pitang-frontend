import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    console.log('[LoginGuard] canActivate iniciado');
    return this.authService.authLoaded$.pipe(
      filter((loaded) => loaded),
      take(1),
      switchMap(() => this.authService.loggedIn$),
      map((loggedIn) => {
        console.log('[LoginGuard] loggedIn:', loggedIn);
        if (loggedIn) {
          console.log('[LoginGuard] Redirecionando para /dashboard');
          return this.router.createUrlTree(['/dashboard']);
        }
        console.log('[LoginGuard] Acesso à tela de login permitido');
        return true;
      })
    );
  }
}
