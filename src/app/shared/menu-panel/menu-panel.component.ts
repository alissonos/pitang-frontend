import { Component } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";

@Component({
  selector: 'app-menu-panel',
  standalone: true,
  imports: [MatIcon, MatDividerModule],
  templateUrl: './menu-panel.component.html',
  styleUrl: './menu-panel.component.css'
})
export class MenuPanelComponent {

}
