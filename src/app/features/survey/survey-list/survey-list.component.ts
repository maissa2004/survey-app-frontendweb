import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-list.component.html',
  styleUrls: ['./survey-list.component.css']
})
export class SurveyListComponent implements OnInit {
  surveys: any[] = [];
  loading = false;
  error: string | null = null;

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
        this.loading = false;

        this.cdr.detectChanges();//forcer la mise a jour de l'affichage.

      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = 'Erreur lors du chargement des surveys';
        this.loading = false;
        this.cdr.detectChanges();

      }
    });
  }

  deleteSurvey(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce survey ?')) {
      this.http.delete(`/api/survey/${id}`).subscribe({
        next: () => {
          console.log('Survey supprimé:', id);
          this.loadSurveys(); // Recharger la liste
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }
}