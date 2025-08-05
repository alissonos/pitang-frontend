import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthGuard } from './guards/auth.guard';
import { RedirectGuard } from './guards/redirect.guard';
import { UsersComponent } from './users/users.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { UserEditComponent } from './users/user-edit/user-edit.component';
import { ChatComponent } from './chat/chat.component';
import { LoginGuard } from './guards/login.guard';
import { LoadingComponent } from './shared/loading/loading.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
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
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [LoginGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
