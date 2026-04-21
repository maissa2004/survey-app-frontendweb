// src/app/features/survey/survey-list/survey-list.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';  

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './survey-list.component.html',
  styleUrls: ['./survey-list.component.css']
})
export class SurveyListComponent implements OnInit {
  surveys: any[] = [];
  filteredSurveys: any[] = [];
  loading = false;
  error: string | null = null;
  lastUpdate: Date = new Date();

  // 🔥 Variables TEMPORAIRES pour la saisie
  tempSearchTerm: string = '';
  tempFilterStatus: string = 'all';
  tempFilterDateFrom: string = '';
  tempFilterDateTo: string = '';
  
  // 🔥 Variables ACTIVES pour le filtrage
  activeSearchTerm: string = '';
  activeFilterStatus: string = 'all';
  activeFilterDateFrom: string = '';
  activeFilterDateTo: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('SurveyListComponent chargé !');
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading = true;
    this.http.get<any[]>('/api/survey').subscribe({
      next: (data) => {
        console.log('Surveys chargés:', data);
        this.surveys = data;
        this.applyFilters();
        this.loading = false;
        this.lastUpdate = new Date();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = 'Erreur lors du chargement des surveys';
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
    this.applyFilters();
  }

  // 🔥 Méthode de filtrage principale (utilise les valeurs actives)
  applyFilters(): void {
    this.filteredSurveys = this.surveys.filter(survey => {
      // Filtre recherche
      let matchesSearch = true;
      if (this.activeSearchTerm && this.activeSearchTerm.trim() !== '') {
        const term = this.activeSearchTerm.toLowerCase().trim();
        matchesSearch = 
          survey.code?.toLowerCase().includes(term) ||
          survey.libelle?.toLowerCase().includes(term) ||
          (survey.libelleEn?.toLowerCase().includes(term)) ||
          survey.id?.toString().includes(term);
      }
      
      // Filtre statut
      let matchesStatus = true;
      if (this.activeFilterStatus === 'active') {
        matchesStatus = survey.idEtatSurvey === 1;
      } else if (this.activeFilterStatus === 'inactive') {
        matchesStatus = survey.idEtatSurvey !== 1;
      }
      
      // Filtre date
      let matchesDate = true;
      if (this.activeFilterDateFrom && this.activeFilterDateFrom !== '') {
        matchesDate = survey.dtAdd >= this.activeFilterDateFrom;
      }
      if (this.activeFilterDateTo && this.activeFilterDateTo !== '' && matchesDate) {
        matchesDate = survey.dtAdd <= this.activeFilterDateTo;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    console.log('📊 Résultats:', this.filteredSurveys.length, 'sur', this.surveys.length);
    this.cdr.detectChanges();
  }
  
  // 🔥 Réinitialiser tous les filtres
  resetFilters(): void {
    this.tempSearchTerm = '';
    this.tempFilterStatus = 'all';
    this.tempFilterDateFrom = '';
    this.tempFilterDateTo = '';
    this.activeSearchTerm = '';
    this.activeFilterStatus = 'all';
    this.activeFilterDateFrom = '';
    this.activeFilterDateTo = '';
    this.applyFilters();
  }
  
  // 🔥 Vérifier si des filtres sont actifs
  hasActiveFilters(): boolean {
    return this.activeSearchTerm !== '' ||
           this.activeFilterStatus !== 'all' ||
           this.activeFilterDateFrom !== '' ||
           this.activeFilterDateTo !== '';
  }
  
  getFilteredCount(): number {
    return this.filteredSurveys.length;
  }

  getActiveSurveysCount(): number {
    return this.surveys.filter(s => s.idEtatSurvey === 1).length;
  }

  getReferenceSurveysCount(): number {
    return this.surveys.filter(s => s.formReference === true).length;
  }

  deleteSurvey(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce survey ?')) {
      this.http.delete(`/api/survey/${id}`).subscribe({
        next: () => {
          console.log('Survey supprimé:', id);
          this.loadSurveys();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }
}