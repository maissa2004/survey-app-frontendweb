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
  
  // 🔥 Variables TEMPORAIRES pour la saisie (liées aux champs HTML)
  tempSearchTerm: string = '';
  tempFilterStatus: string = 'all';
  tempFilterDateFrom: string = '';
  tempFilterDateTo: string = '';
  
  // 🔥 Variables ACTIVES pour le filtrage (utilisées après clic sur Rechercher)
  activeSearchTerm: string = '';
  activeFilterStatus: string = 'all';
  activeFilterDateFrom: string = '';
  activeFilterDateTo: string = '';
  
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

  loadSessions(): void {
    this.loading = true;
    this.http.get<Session[]>('/api/sessions').subscribe({
      next: (data) => {
        this.sessions = data;
        this.applyFilters();
        this.loading = false;
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
    // Copier les valeurs temporaires vers les valeurs actives
    this.activeSearchTerm = this.tempSearchTerm;
    this.activeFilterStatus = this.tempFilterStatus;
    this.activeFilterDateFrom = this.tempFilterDateFrom;
    this.activeFilterDateTo = this.tempFilterDateTo;
    
    // Appliquer les filtres
    this.applyFilters();
  }

  // 🔥 Méthode pour réinitialiser tous les filtres
  resetFilters(): void {
    // Réinitialiser les valeurs temporaires
    this.tempSearchTerm = '';
    this.tempFilterStatus = 'all';
    this.tempFilterDateFrom = '';
    this.tempFilterDateTo = '';
    
    // Réinitialiser les valeurs actives
    this.activeSearchTerm = '';
    this.activeFilterStatus = 'all';
    this.activeFilterDateFrom = '';
    this.activeFilterDateTo = '';
    
    // Appliquer les filtres
    this.applyFilters();
  }

  // 🔥 Méthode de filtrage principale (utilise les valeurs actives)
  applyFilters(): void {
    this.filteredSessions = this.sessions.filter(session => {
      // Filtre par terme de recherche (intitule, id, surveys)
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
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    console.log('🔍 Filtres sessions appliqués:', {
      searchTerm: this.activeSearchTerm,
      filterStatus: this.activeFilterStatus,
      filterDateFrom: this.activeFilterDateFrom,
      filterDateTo: this.activeFilterDateTo,
      results: this.filteredSessions.length
    });
    this.cdr.detectChanges();
  }
  
  // 🔥 Obtenir le nombre de résultats filtrés
  getFilteredCount(): number {
    return this.filteredSessions.length;
  }

  // 🔥 Vérifier si des filtres sont actifs
  hasActiveFilters(): boolean {
    return this.activeSearchTerm !== '' ||
           this.activeFilterStatus !== 'all' ||
           this.activeFilterDateFrom !== '' ||
           this.activeFilterDateTo !== '';
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
    if (confirm('Retirer cet enquêteur ?')) {
      this.sessionEnqueteurService.removeEnqueteur(sessionSurveyId, userId).subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (err) => console.error('Erreur suppression:', err)
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