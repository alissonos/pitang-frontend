import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    // Como a auth já foi carregada, podemos usar diretamente
    return this.authService.loggedIn$.pipe(
      map((loggedIn) => {
        if (loggedIn) {
          return this.router.createUrlTree(['/dashboard']);
        } else {
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
