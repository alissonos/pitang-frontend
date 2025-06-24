import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  user: string = 'Usuário';
  darkMode = false;
  private isBrowser: boolean | undefined;
  routerOutlet: any;

  constructor(
    private userService: UserService,
    private authservice: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe((data) => (this.users = data));
    this.checkDarkModePreference();
    this.authservice.nomeUsuario$.subscribe((fullName) => {
      this.user = fullName;
    });
  }

  logout() {
    this.authservice.logout();
    this.router.navigate(['/login']);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    if (this.isBrowser) {
      localStorage.setItem('darkMode', this.darkMode ? 'enabled' : 'disabled');
    }
  }

  private checkDarkModePreference() {
    if (this.isBrowser) {
      const darkModePref = localStorage.getItem('darkMode');
      this.darkMode = darkModePref === 'enabled';
    }
  }
}
