import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './src/app/dashboard/dashboard.component';
import { LoginComponent } from './src/app/login/login.component';
import { SignupComponent } from './src/app/signup/signup.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: '',
    redirectTo: '/login', // Redireciona para login como página inicial
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login', // Páginas não encontradas vão para login
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
