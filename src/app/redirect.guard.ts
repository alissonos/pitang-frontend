// redirect.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, filter, take, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.authLoaded$.pipe(
      filter((loaded: boolean) => loaded), // espera a inicialização do AuthService
      take(1),
      switchMap(() => {
        // Agora verifica o status usando o Observable em vez do método síncrono
        return this.auth.isLoggedIn$().pipe(
          take(1),
          map((isLoggedIn: boolean) => {
            if (isLoggedIn) {
              return this.router.createUrlTree(['/dashboard']);
            } else {
              return this.router.createUrlTree(['/login']);
            }
          })
        );
      })
    );
  }
}
