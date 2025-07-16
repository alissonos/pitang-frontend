import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn$().pipe(
      take(1), // pegar o primeiro valor e completar o observable
      map((loggedIn) => {
        if (loggedIn) {
          return true;
        }
        return this.router.parseUrl('/login');
      })
    );
  }
}
