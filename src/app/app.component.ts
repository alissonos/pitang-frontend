import { Component, OnInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  template: ``,
})
export class AppComponent implements OnInit {
  loading = true;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService
      .isLoggedIn$()
      .pipe(take(1))
      .subscribe(() => {
        this.loading = false;
      });
  }
}
