import { MatSnackBar } from '@angular/material/snack-bar';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../config/config.service';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

interface CarouselSlide {
  background?: string;
  image?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    CarouselModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form variables
  usernameOrEmail: string = '';
  password: string = '';
  errorMessage: string | undefined;
  loading: boolean = false;
  showValidation: boolean = false;
  showPassword: boolean = false;

  // Carousel variables
  currentSlide: number = 0;
  carouselSlides: CarouselSlide[] = [
    {
      image: 'assets/carousel/image1.png', // ou URL completa
    },
    {
      image: 'assets/carousel/image2.png', // ou URL completa
    },
    {
      image: 'assets/carousel/image3.png', // ou URL completa
    },
  ];
  private carouselInterval: any;

  // Theme variables
  isDarkMode: boolean = false;
  darkMode: boolean = false; // Mantendo compatibilidade com código existente

  // Owl Carousel options
  customOptions = {
    loop: true,
    autoplay: true,
    dots: false,
    nav: false,
    items: 1,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private config: ConfigService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('[LoginComponent] ngOnInit chamado');

    if (isPlatformBrowser(this.platformId)) {
      this.loadTheme();
      this.startCarousel();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopCarousel();
    }
  }

  // Login method (mantendo sua implementação original)
  fazerLogin(): void {
    if (!this.usernameOrEmail.trim() || !this.password.trim()) {
      this.errorMessage = 'Preencha as credenciais';
      return;
    }

    this.loading = true;
    this.errorMessage = undefined;

    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (response) => {
        // Após login bem-sucedido, buscar dados do usuário
        this.http
          .get<any>(
            `${this.config.apiUrl}/users/username/${this.usernameOrEmail}`
          )
          .subscribe({
            next: (user) => {
              localStorage.setItem('nomeUsuario', user.fullName);
              this.authService.setNomeUsuario(user.fullName);

              this.router.navigate(['/dashboard']);
              this.loading = false;
            },
            error: () => {
              this.snackBar.open('Erro ao buscar usuário', 'Fechar', {
                duration: 3000,
                verticalPosition: 'top',
                panelClass: ['error-snackbar'],
              });
              this.loading = false;
            },
          });
      },
      error: (err) => {
        console.error('Erro no login:', err);
        this.errorMessage = err.error?.message || 'Credenciais inválidas';
        this.loading = false;
      },
    });
  }

  // Navigation method (mantendo sua implementação original)
  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }

  // Validation method (mantendo sua implementação original)
  validateFields(): void {
    const userFilled = this.usernameOrEmail.trim().length > 0;
    const passFilled = this.password.trim().length > 0;

    if (userFilled && passFilled) {
      this.showValidation = false;
      this.errorMessage = undefined;
    } else {
      this.showValidation = true;
    }
  }

  // Password visibility toggle (mantendo sua implementação original)
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Carousel methods
  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 4000);
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextSlide(): void {
    const nextIndex = (this.currentSlide + 1) % this.carouselSlides.length;
    this.goToSlide(nextIndex);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.carouselSlides.length) {
      this.currentSlide = index;
    }
  }

  // Theme methods
  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode = !this.isDarkMode;
      this.darkMode = this.isDarkMode;

      if (this.isDarkMode) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  private loadTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        this.darkMode = true;
        document.body.classList.add('dark-mode');
      } else {
        this.isDarkMode = false;
        this.darkMode = false;
        document.body.classList.remove('dark-mode');
      }
    }
  }

  // Utility methods
  clearError(): void {
    this.errorMessage = undefined;
  }

  resetForm(): void {
    this.usernameOrEmail = '';
    this.password = '';
    this.showPassword = false;
    this.showValidation = false;
    this.errorMessage = undefined;
    this.loading = false;
  }
}
