import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ObservableInput, Subject } from 'rxjs';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-menu-panel',
  standalone: true,
  imports: [MatIcon, MatDividerModule, MatMenuModule, MatListModule],
  templateUrl: './menu-panel.component.html',
  styleUrl: './menu-panel.component.css',
})
export class MenuPanelComponent {
  user: string = 'Usuário';
  users: User[] = [];
  email: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

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
