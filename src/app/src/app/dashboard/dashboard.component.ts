import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router'; // Adicione esta linha

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  darkMode = false;

  constructor(
    private userService: UserService,
    private authservice: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private elementRef: ElementRef
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
    const container = this.elementRef.nativeElement.querySelector(
      '.dashboard-container'
    );
    if (container) {
      if (this.darkMode) {
        this.renderer.addClass(container, 'dark-mode');
        localStorage.setItem('userListDarkMode', 'enabled');
      } else {
        this.renderer.removeClass(container, 'dark-mode');
        localStorage.setItem('userListDarkMode', 'disabled');
      }
    }
  }

  private checkDarkModePreference() {
    const darkModePref = localStorage.getItem('userListDarkMode');
    const container = this.elementRef.nativeElement.querySelector(
      '.dashboard-container'
    );
    if (darkModePref === 'enabled' && container) {
      this.darkMode = true;
      this.renderer.addClass(container, 'dark-mode');
    }
  }
}
