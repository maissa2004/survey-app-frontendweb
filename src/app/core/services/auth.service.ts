// src/app/core/services/auth.service.ts

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  userId: number;
  email?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('📤 Envoi de la requête:', credentials);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Réponse reçue:', response);
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }),
        catchError(error => {
          console.error('❌ Erreur:', error);
          throw error;
        })
      );
  }

  // 🔥 NOUVEAU : Vérifier si c'est le super admin
  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.username === 'admin' && user?.role === 'admin';
  }

  // 🔥 NOUVEAU : Vérifier si c'est un admin normal
  isNormalAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' && user?.username !== 'admin';
  }

  // 🔥 NOUVEAU : Vérifier si c'est un enquêteur
  isEnqueteur(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'enqueteur';
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    if (this.isBrowser) {
      return !!this.getToken();
    }
    return false;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // 🔥 NOUVEAU : Redirection en fonction du rôle
  getRedirectUrl(): string {
    if (this.isSuperAdmin()) {
      return '/user-management';
    }
    if (this.isNormalAdmin()) {
      return '/surveys';
    }
    return '/login';
  }
}