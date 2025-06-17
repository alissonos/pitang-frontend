import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';
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
  darkMode = false;

  constructor(
    private userService: UserService,
    private authservice: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe((data) => (this.users = data));
    this.checkDarkModePreference();
  }

  logout() {
    this.authservice.logout();
    this.router.navigate(['/login']);
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode ? 'enabled' : 'disabled');
  }

  private checkDarkModePreference() {
    const darkModePref = localStorage.getItem('darkMode');
    this.darkMode = darkModePref === 'enabled';
  }
}
