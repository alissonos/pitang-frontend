import { Component, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './src/app/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, DashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  template: ``,
})
export class AppComponent {}
