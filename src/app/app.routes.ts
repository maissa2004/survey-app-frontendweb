import { Routes } from '@angular/router';
import { SurveyListComponent } from './features/survey/survey-list/survey-list.component';
import { SurveyFormComponent } from './features/survey/survey-form/survey-form.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: '/surveys', pathMatch: 'full' },
  
  // Routes publiques (authentification)
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  
  // Routes protégées (authentification requise)
  { 
    path: 'surveys', 
    component: SurveyListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'surveys/new', 
    component: SurveyFormComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'surveys/edit/:id', 
    component: SurveyFormComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'surveys/:id',
    loadComponent: () => import('./features/survey/survey-detail/survey-detail.component')
      .then(m => m.SurveyDetailComponent),
    canActivate: [AuthGuard]
  },
  
  // Routes admin uniquement (gestion des sessions)
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
    canActivate: [AuthGuard, AdminGuard],
    title: 'Nouvelle session'
  },
  { 
    path: 'sessions/edit/:id',
    loadComponent: () => import('./features/session/session-form/session-form.component')
      .then(m => m.SessionFormComponent),
    canActivate: [AuthGuard, AdminGuard],
    title: 'Modifier session'
  },
  
  // Redirection pour les routes non trouvées
  { path: '**', redirectTo: '/surveys' }
];