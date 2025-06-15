import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { UserService } from '../../../../services/user.service';
import { User } from '../../../../models/user.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
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
      '.user-list-container'
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
      '.user-list-container'
    );
    if (darkModePref === 'enabled' && container) {
      this.darkMode = true;
      this.renderer.addClass(container, 'dark-mode');
    }
  }
}
