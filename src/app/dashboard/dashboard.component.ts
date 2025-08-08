// dashboard.component.ts
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil } from 'rxjs';
import { MenuPanelComponent } from '../shared/menu-panel/menu-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatCardModule,
    MenuPanelComponent
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  users: User[] = [];
  user: string = 'Usuário';
  darkMode = false;
  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadUsers();
    this.checkDarkModePreference();
    this.subscribeToUserName();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => (this.users = data),
        error: (error) => console.error('Erro ao carregar usuários:', error),
      });
  }

  private subscribeToUserName(): void {
    this.authService.nomeUsuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe((fullName) => {
        this.user = fullName || 'Usuário';
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    this.saveDarkModePreference();
    // Aplicar classe ao documento para afetar toda a aplicação
    if (this.isBrowser) {
      document.body.classList.toggle('dark-theme', this.darkMode);
    }
  }

  private checkDarkModePreference(): void {
    if (this.isBrowser) {
      const darkModePref = localStorage.getItem('darkMode');
      this.darkMode = darkModePref === 'enabled';
      document.body.classList.toggle('dark-theme', this.darkMode);
    }
  }

  private saveDarkModePreference(): void {
    if (this.isBrowser) {
      localStorage.setItem('darkMode', this.darkMode ? 'enabled' : 'disabled');
    }
  }
}
