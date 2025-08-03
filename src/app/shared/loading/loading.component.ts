import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.authLoaded$.pipe(take(1)).subscribe(() => {
      this.authService
        .isLoggedIn$()
        .pipe(take(1))
        .subscribe((loggedIn) => {
          if (loggedIn) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/login']);
          }
        });
    });
  }
}
