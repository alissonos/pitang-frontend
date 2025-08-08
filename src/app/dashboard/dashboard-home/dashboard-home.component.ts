import { CommonModule } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard-home',
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
    NgChartsModule,
  ],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent {
  users: User[] = [];
  darkMode = false;
  private isBrowser: boolean | undefined;
  routerOutlet: any;
  doughnut: 'doughnut' | undefined;

  constructor(
    private userService: UserService,
    private authservice: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public doughnutChartLabels: string[] = [
    'Nota 1',
    'Nota 2',
    'Nota 3',
    'Nota 4',
    'Nota 5',
  ];
  public doughnutChartData = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [0, 0, 0, 0, 1], // Distribuição de notas (exemplo: 1 nota 5)
        backgroundColor: [
          '#ff3e3e',
          '#ff8c00',
          '#ffd700',
          '#87ceeb',
          '#28a745',
        ],
        borderWidth: 0,
      },
    ],
  };
  public doughnutChartType: ChartType = 'doughnut';

  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    cutout: '70%', // <-- isso só funciona com ChartOptions<'doughnut'>
  };

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
