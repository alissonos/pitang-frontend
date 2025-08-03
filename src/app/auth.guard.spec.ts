import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authGuard: AuthGuard;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: {} },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    authGuard = new AuthGuard(authService, router);
  });

  const executeGuard: CanActivateFn = (routeOrState) =>
    authGuard.canActivate(routeOrState);

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
