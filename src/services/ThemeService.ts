import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();

  toggleDarkMode() {
    const newValue = !this.darkMode.value;
    this.darkMode.next(newValue);

    document.body.classList.toggle('dark-mode', newValue);
  }

  isDarkMode(): boolean {
    return this.darkMode.value;
  }
}
