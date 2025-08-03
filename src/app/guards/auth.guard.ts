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
    console.log('[AuthGuard] canActivate iniciado');

    return this.authService.authLoaded$.pipe(
      filter((loaded) => {
        console.log('[AuthGuard] authLoaded$:', loaded);
        return loaded;
      }), // espera carregar
      take(1),
      switchMap(() => {
        console.log('[AuthGuard] authLoaded$ TRUE - verificando isLoggedIn$');
        return this.authService.isLoggedIn$();
      }), // só decide após carregado
      map((isLoggedIn) => {
        console.log('[AuthGuard] isLoggedIn:', isLoggedIn);
        if (!isLoggedIn) {
          console.log(
            '[AuthGuard] Usuário não logado, redirecionando para /login'
          );
          this.router.navigate(['/login']);
          return false;
        }
        console.log('[AuthGuard] Acesso permitido');
        return true;
      })
    );
  }
}
