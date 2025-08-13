import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthService } from '../services/auth.service';
import { filter, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './shared/loading/loading.component';
import { LoginComponent } from './login/login.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { f } from '../../node_modules/@angular/material/icon-module.d-COXCrhrh';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterOutlet, LoadingComponent, MatIconModule],
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  darkMode = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.authLoaded$.pipe(
      filter((v) => v),
      take(1)
    );
  }

  // toggleDarkMode(): void {
  //   document.body.classList.toggle('dark-theme');

  //   this.darkMode = !this.darkMode;

  //   const body = document.body;
  //   if (this.darkMode) {
  //     body.classList.add('dark-mode');
  //   } else {
  //     body.classList.remove('dark-mode');
  //   }
  // }
}
