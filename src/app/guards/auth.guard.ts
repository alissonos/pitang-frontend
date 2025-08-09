import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(p0: unknown): Observable<boolean> {

    return this.authService.authLoaded$.pipe(
      filter((loaded) => {
        return loaded;
      }), // espera carregar
      take(1),
      switchMap(() => {
        return this.authService.isLoggedIn$();
      }), // só decide após carregado
      map((isLoggedIn) => {
        if (!isLoggedIn) {
          console.log(
          );
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      })
    );
  }
}
