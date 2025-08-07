import { Component } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Router, RouterOutlet } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ObservableInput, Subject } from 'rxjs';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import {
  MatSidenavContent,
  MatSidenavContainer,
  MatSidenav,
} from '@angular/material/sidenav';

@Component({
  selector: 'app-menu-panel',
  standalone: true,
  imports: [
    MatIcon,
    MatDividerModule,
    MatMenuModule,
    MatListModule,
    MatExpansionModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './menu-panel.component.html',
  styleUrl: './menu-panel.component.css',
})
export class MenuPanelComponent {
  user: string = 'Usuário';
  users: User[] = [];
  email: string = '';
  showConfig = false;

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  toggleConfig() {
    this.showConfig = !this.showConfig;
  }

  onClickHandler(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  ngOnInit(): void {
    this.subscribeToUserName();
    this.getUserEmail();
  }

  private subscribeToUserName(): void {
    this.authService.nomeUsuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe((fullName) => {
        this.user = fullName || 'Usuário';
      });
  }

  private getUserEmail(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.username) {
      this.email = currentUser.username; // Aqui é o e-mail ou username
    }
  }
}
