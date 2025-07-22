import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthGuard } from './auth.guard';
import { RedirectGuard } from './redirect.guard';
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
      { path: '', component: DashboardHomeComponent },
      { path: 'users', component: UsersComponent },
      { path: 'users/edit/:id', component: UserEditComponent },
      { path: 'chat', component: ChatComponent },
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // Rota raiz que decide para onde ir
  {
    path: '',
    canActivate: [RedirectGuard],
    children: []
  },

  // Rotas inválidas vão para a raiz (que usará o RedirectGuard)
  {
    path: '**',
    redirectTo: ''
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Adicione estas opções para debug
    enableTracing: false, // mude para true se quiser ver logs de roteamento
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
