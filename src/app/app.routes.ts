import { Component } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { LoginComponent } from './src/app/login/login.component';
import { UserListComponent } from './src/app/user-list/user-list.component';
import { AuthGuard } from './auth.guard';
import { SignupComponent } from './src/app/signup/signup.component';

export const routes: Routes = [
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];

export const AppRoutes = provideRouter(routes);
