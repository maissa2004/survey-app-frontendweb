// src/app/features/session/session-list/session-list.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SessionEnqueteurService, SessionEnqueteur, User } from '../../../core/services/session-enqueteur.service';

interface SurveyInfo {
  id: number;
  sessionSurveyId: number;  
  code: string;
  libelle: string;
  enqueteurs?: SessionEnqueteur[];
}

interface Session {
  id: number;
  intitule: string;
  dateDebut: string;
  dateFin: string;
  status: 'active' | 'inactive' | 'planifiee' | 'terminee';
  dtCreate: string;
  dtUpdate: string;
  idSurvey: number;
  surveyCode: string;
  surveyLibelle: string;
  surveys?: SurveyInfo[];
}

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css']
})
export class SessionListComponent implements OnInit {
  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  loading = true;
  error: string | null = null;
  lastUpdate: Date = new Date();
  
  // 🔥 Variables TEMPORAIRES pour la saisie
  tempSearchTerm: string = '';
  tempFilterStatus: string = 'all';
  tempFilterDateFrom: string = '';
  tempFilterDateTo: string = '';
  tempFilterEnqueteur: string = '';

  // 🔥 Variables ACTIVES pour le filtrage
  activeSearchTerm: string = '';
  activeFilterStatus: string = 'all';
  activeFilterDateFrom: string = '';
  activeFilterDateTo: string = '';
  activeFilterEnqueteur: string = '';

  // Liste des enquêteurs pour l'autocomplete
  allEnqueteurs: string[] = [];
  
  // Gestion des enquêteurs
  selectedSessionSurveyId: number | null = null;
  selectedSurveyName: string = '';
  availableEnqueteurs: User[] = [];
  showEnqueteurModal = false;

  constructor(
    private http: HttpClient, 
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private sessionEnqueteurService: SessionEnqueteurService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  
// Ajouter cette propriété
sessionSurveyMap: Map<string, number> = new Map();

loadSessionSurveyMapping(): void {
  this.http.get<any[]>('/api/session-survey').subscribe({
    next: (data) => {
      console.log('SessionSurvey data:', data);
      
      // Créer le mapping
      const sessionSurveyMap = new Map();
      data.forEach(ss => {
        const key = `${ss.id_session}_${ss.id_survey}`;
        sessionSurveyMap.set(key, ss.id);
      });
      
      // Mettre à jour les surveys
      this.sessions.forEach(session => {
        if (session.surveys) {
          session.surveys.forEach(survey => {
            const key = `${session.id}_${survey.id}`;
            const correctId = sessionSurveyMap.get(key);
            if (correctId) {
              survey.sessionSurveyId = correctId;
            }
          });
        }
      });
      
      // 🔥 Extraire les enquêteurs et appliquer les filtres APRÈS le mapping
      this.extractEnqueteurs();
      this.applyFilters();
      
      // 🔥 Fin du chargement
      this.loading = false;
      this.lastUpdate = new Date();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur chargement session-survey:', err);
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

// Dans session-list.component.ts

// 🔥 Charger les enquêteurs pour toutes les sessions
loadEnqueteursForAllSessions(): void {
  let totalRequests = 0;
  let completedRequests = 0;
  
  // Compter le nombre total de surveys
  this.sessions.forEach(session => {
    if (session.surveys) {
      totalRequests += session.surveys.length;
    }
  });
  
  if (totalRequests === 0) {
    this.extractEnqueteurs();
    this.applyFilters();
    this.loading = false;
    return;
  }
  
  // Charger les enquêteurs pour chaque survey
  this.sessions.forEach(session => {
    if (session.surveys) {
      session.surveys.forEach(survey => {
        const sessionSurveyId = survey.sessionSurveyId;
        if (sessionSurveyId) {
          this.sessionEnqueteurService.getEnqueteursBySessionSurvey(sessionSurveyId).subscribe({
            next: (enqueteurs) => {
              survey.enqueteurs = enqueteurs;
              completedRequests++;
              console.log(`Enquêteurs chargés pour survey ${survey.code}:`, enqueteurs);
              
              if (completedRequests === totalRequests) {
                this.extractEnqueteurs();
                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();
              }
            },
            error: (err) => {
              console.error(`Erreur chargement enquêteurs pour survey ${survey.code}:`, err);
              completedRequests++;
              if (completedRequests === totalRequests) {
                this.extractEnqueteurs();
                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();
              }
            }
          });
        } else {
          completedRequests++;
          if (completedRequests === totalRequests) {
            this.extractEnqueteurs();
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          }
        }
      });
    }
  });
}

// Modifier loadSessions()
loadSessions(): void {
  this.loading = true;
  this.http.get<Session[]>('/api/sessions').subscribe({
    next: (data) => {
      this.sessions = data;
      // 🔥 Charger les enquêteurs après avoir reçu les sessions
      this.loadEnqueteursForAllSessions();
      this.lastUpdate = new Date();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.error = 'Erreur lors du chargement des sessions';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  // 🔥 Méthode appelée lors du clic sur le bouton Rechercher
  search(): void {
    this.activeSearchTerm = this.tempSearchTerm;
    this.activeFilterStatus = this.tempFilterStatus;
    this.activeFilterDateFrom = this.tempFilterDateFrom;
    this.activeFilterDateTo = this.tempFilterDateTo;
    this.activeFilterEnqueteur = this.tempFilterEnqueteur;  
    this.applyFilters();
  }

  // 🔥 Méthode pour réinitialiser tous les filtres
  resetFilters(): void {
    this.tempSearchTerm = '';
    this.tempFilterStatus = 'all';
    this.tempFilterDateFrom = '';
    this.tempFilterDateTo = '';
    this.tempFilterEnqueteur = '';
    
    this.activeSearchTerm = '';
    this.activeFilterStatus = 'all';
    this.activeFilterDateFrom = '';
    this.activeFilterDateTo = '';
    this.activeFilterEnqueteur = '';
    
    this.applyFilters();
  }

  // 🔥 Méthode pour debugger les données des sessions
debugSessionsData(): void {
  console.log('=== DEBUG SESSIONS ===');
  console.log('Nombre de sessions:', this.sessions.length);
  
  this.sessions.forEach((session, index) => {
    console.log(`Session ${index + 1}:`, {
      id: session.id,
      intitule: session.intitule,
      surveysCount: session.surveys?.length || 0,
      surveys: session.surveys?.map(s => ({
        code: s.code,
        libelle: s.libelle,
        enqueteursCount: s.enqueteurs?.length || 0,
        enqueteurs: s.enqueteurs?.map(e => e.username)
      }))
    });
  });
}

// 🔥 Extraire tous les noms d'enquêteurs uniques (version améliorée)
extractEnqueteurs(): void {
  console.log('=== EXTRACTION DES ENQUÊTEURS ===');
  const enqueteursSet = new Set<string>();
  
  this.sessions.forEach(session => {
    if (session.surveys && session.surveys.length > 0) {
      session.surveys.forEach(survey => {
        if (survey.enqueteurs && survey.enqueteurs.length > 0) {
          survey.enqueteurs.forEach(enqueteur => {
            if (enqueteur && enqueteur.username) {
              enqueteursSet.add(enqueteur.username);
              console.log('Enquêteur trouvé:', enqueteur.username);
            }
          });
        }
      });
    }
  });
  
  this.allEnqueteurs = Array.from(enqueteursSet).sort();
  console.log('Liste des enquêteurs uniques:', this.allEnqueteurs);
}

  // 🔥 Méthode de filtrage principale
  applyFilters(): void {
    this.filteredSessions = this.sessions.filter(session => {
      // Filtre par terme de recherche
      let matchesSearch = true;
      if (this.activeSearchTerm && this.activeSearchTerm.trim() !== '') {
        const term = this.activeSearchTerm.toLowerCase().trim();
        matchesSearch = 
          session.intitule?.toLowerCase().includes(term) ||
          session.id?.toString().includes(term) ||
          (session.surveys?.some(s => 
            s.code?.toLowerCase().includes(term) || 
            s.libelle?.toLowerCase().includes(term)
          ) ?? false);
      }
      
      // Filtre par statut
      let matchesStatus = true;
      if (this.activeFilterStatus !== 'all') {
        matchesStatus = session.status === this.activeFilterStatus;
      }
      
      // Filtre par date
      let matchesDate = true;
      const sessionDate = session.dateDebut ? session.dateDebut.split('T')[0] : '';
      
      if (this.activeFilterDateFrom && this.activeFilterDateFrom !== '') {
        matchesDate = sessionDate >= this.activeFilterDateFrom;
      }
      
      if (this.activeFilterDateTo && this.activeFilterDateTo !== '' && matchesDate) {
        matchesDate = sessionDate <= this.activeFilterDateTo;
      }
      
      // 🔥 FILTRE PAR ENQUÊTEUR
      let matchesEnqueteur = true;
      if (this.activeFilterEnqueteur && this.activeFilterEnqueteur.trim() !== '') {
        const enqueteurTerm = this.activeFilterEnqueteur.toLowerCase().trim();
        matchesEnqueteur = session.surveys?.some(survey =>
          survey.enqueteurs?.some(enqueteur =>
            enqueteur.username?.toLowerCase().includes(enqueteurTerm)
          )
        ) ?? false;
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesEnqueteur;
    });
    
    console.log('🔍 Filtres sessions appliqués:', {
      searchTerm: this.activeSearchTerm,
      filterStatus: this.activeFilterStatus,
      filterDateFrom: this.activeFilterDateFrom,
      filterDateTo: this.activeFilterDateTo,
      filterEnqueteur: this.activeFilterEnqueteur,
      results: this.filteredSessions.length
    });
    this.cdr.detectChanges();
  }
  
  getFilteredCount(): number {
    return this.filteredSessions.length;
  }

  hasActiveFilters(): boolean {
    return this.activeSearchTerm !== '' ||
           this.activeFilterStatus !== 'all' ||
           this.activeFilterDateFrom !== '' ||
           this.activeFilterDateTo !== '' ||
           this.activeFilterEnqueteur !== '';
  }

  getSessionsByStatus(status: string): Session[] {
    return this.sessions.filter(s => s.status === status);
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'planifiee': return 'Planifiée';
      case 'terminee': return 'Terminée';
      default: return status;
    }
  }

  activateSession(id: number): void {
    this.http.post(`/api/sessions/${id}/activate`, {}).subscribe({
      next: () => this.loadSessions(),
      error: (err) => console.error('Erreur activation:', err)
    });
  }

  deactivateSession(id: number): void {
    this.http.post(`/api/sessions/${id}/deactivate`, {}).subscribe({
      next: () => this.loadSessions(),
      error: (err) => console.error('Erreur désactivation:', err)
    });
  }

  deleteSession(id: number): void {
    if (confirm('Supprimer cette session ?')) {
      this.http.delete(`/api/sessions/${id}`).subscribe({
        next: () => this.loadSessions(),
        error: (err) => console.error('Erreur suppression:', err)
      });
    }
  }

  openEnqueteurModal(sessionSurveyId: number, surveyName: string): void {
    this.selectedSessionSurveyId = sessionSurveyId;
    this.selectedSurveyName = surveyName;
    this.loadAvailableEnqueteurs(sessionSurveyId);
    this.showEnqueteurModal = true;
  }

  loadAvailableEnqueteurs(sessionSurveyId: number): void {
    this.sessionEnqueteurService.getAvailableEnqueteurs(sessionSurveyId).subscribe({
      next: (data) => {
        this.availableEnqueteurs = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement enquêteurs disponibles:', err)
    });
  }

  assignEnqueteur(userId: number): void {
    if (this.selectedSessionSurveyId) {
      this.sessionEnqueteurService.assignEnqueteur(this.selectedSessionSurveyId, userId).subscribe({
        next: () => {
          this.loadSessions();
          this.closeEnqueteurModal();
        },
        error: (err) => console.error('Erreur affectation:', err)
      });
    }
  }

  removeEnqueteur(sessionSurveyId: number, userId: number, event: Event): void {
  event.stopPropagation();
  event.preventDefault();
  
  console.log('=== REMOVE ENQUETEUR ===');
  console.log('sessionSurveyId:', sessionSurveyId);
  console.log('userId:', userId);
  
  if (confirm('Retirer cet enquêteur ?')) {
    this.sessionEnqueteurService.removeEnqueteur(sessionSurveyId, userId).subscribe({
      next: () => {
        console.log('✅ Enquêteur retiré avec succès');
        // Recharger les sessions pour mettre à jour l'affichage
        this.loadSessions();
      },
      error: (err) => {
        console.error('❌ Erreur suppression:', err);
        if (err.error) {
          console.error('Détail erreur:', err.error);
        }
        alert('Erreur lors du retrait de l\'enquêteur');
      }
    });
  }
}

  closeEnqueteurModal(): void {
    this.showEnqueteurModal = false;
    this.selectedSessionSurveyId = null;
    this.selectedSurveyName = '';
    this.availableEnqueteurs = [];
  }
}