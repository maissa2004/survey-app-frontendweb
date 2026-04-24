// src/app/features/auth/login/login.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    
    this.loading = true;
    this.error = null;
    
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login réussi:', response);
        
        // 🔥 Vérifier le type d'utilisateur
        if (this.authService.isSuperAdmin()) {
          // Super admin (admin/admin123) -> interface gestion users
          this.router.navigate(['/user-management']);
        } 
        else if (this.authService.isNormalAdmin()) {
          // Admins normaux -> interface surveys/sessions
          this.router.navigate(['/surveys']);
        } 
        else if (this.authService.isEnqueteur()) {
          // 🔥 ENQUÊTEUR - ACCÈS REFUSÉ
          this.error = '❌ Accès refusé : Les enquêteurs ne peuvent pas accéder à l\'application web.';
          this.authService.logout();
          this.loading = false;
        } 
        else {
          this.error = 'Rôle non autorisé';
          this.authService.logout();
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error || 'Identifiants incorrects';
        this.loading = false;
      }
    });
  }
}