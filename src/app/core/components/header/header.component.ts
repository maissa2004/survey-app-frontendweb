// src/app/core/components/header/header.component.ts
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isBrowser: boolean;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

// 🔥 Redirection du logo en fonction du rôle
  getHomeLink(): string {
    if (this.authService.isSuperAdmin()) {
      return '/user-management';
    }
    if (this.authService.isNormalAdmin()) {
      return '/dashboard';
    }
    return '/login';
  }

  logout(): void {
    if (this.isBrowser) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }
}