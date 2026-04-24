
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  canActivate(): boolean {
    if (!this.isBrowser) {
      return true;
    }
    
    if (this.authService.isSuperAdmin()) {
      return true;
    }
    
    // Rediriger vers la page appropriée
    if (this.authService.isNormalAdmin()) {
      this.router.navigate(['/surveys']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}