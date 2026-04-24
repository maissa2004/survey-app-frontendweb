// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { SurveyListComponent } from './features/survey/survey-list/survey-list.component';
import { SurveyFormComponent } from './features/survey/survey-form/survey-form.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { SuperAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Routes publiques
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  
  // 🔥 Routes Super Admin uniquement
  { 
    path: 'user-management', 
    loadComponent: () => import('./features/user-management/user-management.component')
      .then(m => m.UserManagementComponent),
    canActivate: [AuthGuard, SuperAdminGuard]
  },
  
  // Routes Admin normal
  { 
    path: 'surveys', 
    component: SurveyListComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'surveys/new', 
    component: SurveyFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'surveys/edit/:id', 
    component: SurveyFormComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'surveys/:id',
    loadComponent: () => import('./features/survey/survey-detail/survey-detail.component')
      .then(m => m.SurveyDetailComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  
  // Routes sessions (Admin uniquement)
  { 
    path: 'sessions',
    loadComponent: () => import('./features/session/session-list/session-list.component')
      .then(m => m.SessionListComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'sessions/new',
    loadComponent: () => import('./features/session/session-form/session-form.component')
      .then(m => m.SessionFormComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  { 
    path: 'sessions/edit/:id',
    loadComponent: () => import('./features/session/session-form/session-form.component')
      .then(m => m.SessionFormComponent),
    canActivate: [AuthGuard, AdminGuard]
  },
  
  { path: '**', redirectTo: '/login' }
];