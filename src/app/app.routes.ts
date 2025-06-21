import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './src/app/dashboard/dashboard.component';
import { LoginComponent } from './src/app/login/login.component';
import { SignupComponent } from './src/app/signup/signup.component';
import { AuthGuard } from './auth.guard';
import { UsersComponent } from './src/app/users/users.component';
import { DashboardHomeComponent } from './src/app/dashboard/dashboard-home/dashboard-home.component';
import { UserEditComponent } from './src/app/users/user-edit/user-edit.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent, canActivate: [AuthGuard] }, // ROTA PADRÃO
      { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
       // Nova rota para editar usuário:
      { path: 'users/edit/:id', component: UserEditComponent, canActivate: [AuthGuard] }, //
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
