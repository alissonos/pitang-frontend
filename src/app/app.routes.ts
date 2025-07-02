import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthGuard } from './auth.guard';
import { UsersComponent } from './users/users.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { UserEditComponent } from './users/user-edit/user-edit.component';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent, canActivate: [AuthGuard] }, // ROTA PADRÃO
      // Nova rota para editar usuário:
      { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
      {
        path: 'users/edit/:id',
        component: UserEditComponent,
        canActivate: [AuthGuard],
      }, //
      { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
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
