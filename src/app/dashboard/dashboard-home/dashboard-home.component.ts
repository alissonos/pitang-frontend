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
import {
  ChartConfiguration,
  ChartData,
  ChartOptions,
  ChartType,
} from 'chart.js';

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

  /* Gráfico de Rosca - Índice de Satisfação */
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
        data: [0, 0, 1, 1, 1], // Distribuição de notas (exemplo: 1 nota 5)
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
    cutout: '70%',
  };

  /* Gráficos de Baras - Comparativo de Resultados */

  // Labels (nomes no eixo X)
  barChartLabels: string[] = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
  ];

  // Dados do gráfico
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.barChartLabels,
    datasets: [
      {
        label: 'Vendas',
        data: [120, 150, 180, 90, 200, 170],
        backgroundColor: '#42A5F5',
      },
      {
        label: 'Despesas',
        data: [80, 100, 140, 70, 160, 150],
        backgroundColor: '#FF7043',
      },
    ],
  };

  // Opções visuais
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Comparativo Mensal' },
    },
  };

  /* Gráfico de Linhas - Chamados ao Longo do Dia */
  lineChartData: ChartData<'line'> = {
    labels: [
      '05/Ago 08:00',
      '05/Ago 09:00',
      '05/Ago 10:00',
      '05/Ago 11:00',
      '05/Ago 12:00',
    ],
    datasets: [
      {
        label: 'Iniciados',
        data: [0, 2, 0, 2, 0],
        fill: true,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Encerrados',
        data: [0, 1, 1, 0, 0],
        fill: true,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Transferidos',
        data: [0, 1, 1, 1, 0],
        fill: true,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
      },
    ],
  };

  lineChartLabels: string[] = [
    '05/Ago 08:00',
    '05/Ago 09:00',
    '05/Ago 10:00',
    '05/Ago 11:00',
    '05/Ago 12:00',
  ];

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  lineChartColors = [];

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
