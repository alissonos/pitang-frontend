import { Component, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserListComponent } from './src/app/user-list/user-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, UserListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  template: ``,
})
export class AppComponent {}
