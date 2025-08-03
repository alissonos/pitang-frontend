import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthService } from '../services/auth.service';
import { filter, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './shared/loading/loading.component';
import { LoginComponent } from './login/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, LoadingComponent, LoginComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  authReady = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.authLoaded$
      .pipe(
        filter((v) => v),
        take(1)
      )
      .subscribe(() => {
        this.authReady = true;
      });
  }
}
