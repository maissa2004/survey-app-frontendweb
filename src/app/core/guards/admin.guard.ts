// src/app/core/guards/admin.guard.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  private isBrowser: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  canActivate(): boolean {
    // En SSR, toujours autoriser ou rediriger
    if (!this.isBrowser) {
      return true;
    }
    
    if (this.authService.isAdmin()) {
      return true;
    }
    
    this.router.navigate(['/surveys']);
    return false;
  }
}