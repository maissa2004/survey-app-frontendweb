// src/app/features/session/session-form/session-form.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Survey {
  id: number;
  code: string;
  libelle: string;
}

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './session-form.component.html',
  styleUrls: ['./session-form.component.css']
})
export class SessionFormComponent implements OnInit {
  sessionForm: FormGroup;
  surveys: Survey[] = [];
  isEditMode = false;
  sessionId: number | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  alertService: any;
  loadingSurveys = true;
  // 🔥 Pour les checkboxes
  selectedSurveyIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.sessionForm = this.fb.group({
      intitule: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      idSurveys: [[], [Validators.required, Validators.minLength(1)]],
      status: ['planifiee', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSurveys();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.sessionId = +params['id'];
        this.loadSessionData();
      }
    });
  }

  loadSurveys(): void {
    this.loadingSurveys = true;
    console.log('🔃 Chargement des surveys...');
    
    this.http.get<Survey[]>('/api/survey').subscribe({
      next: (data) => {
        this.surveys = data;
        this.loadingSurveys = false;
        console.log('✅ Surveys chargés:', this.surveys.length);
        this.cdr.detectChanges();  // 🔥 Forcer l'affichage
      },
      error: (err) => {
        console.error('❌ Erreur chargement surveys:', err);
        this.loadingSurveys = false;
        this.cdr.detectChanges();  // 🔥 Forcer l'affichage
      }
    });
  }

  // 🔥 Vérifier si un survey est sélectionné
  isSurveySelected(surveyId: number): boolean {
    return this.selectedSurveyIds.includes(surveyId);
  }

  // 🔥 Obtenir le nombre de surveys sélectionnés
  getSelectedSurveyCount(): number {
    return this.selectedSurveyIds.length;
  }

  // 🔥 Gérer le changement d'une checkbox
  onSurveyCheckboxChange(event: any, surveyId: number): void {
    if (event.target.checked) {
      if (!this.selectedSurveyIds.includes(surveyId)) {
        this.selectedSurveyIds.push(surveyId);
      }
    } else {
      const index = this.selectedSurveyIds.indexOf(surveyId);
      if (index !== -1) {
        this.selectedSurveyIds.splice(index, 1);
      }
    }
    // Mettre à jour le FormControl
    this.sessionForm.patchValue({
      idSurveys: [...this.selectedSurveyIds]
    });
    this.sessionForm.get('idSurveys')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  loadSessionData(): void {
    this.loading = true;
    this.http.get<any>(`/api/sessions/${this.sessionId}`).subscribe({
      next: (data) => {
        // 🔥 Récupérer les IDs des surveys déjà sélectionnés
        const surveyIds = data.surveys?.map((s: any) => s.id) || [];
        this.selectedSurveyIds = [...surveyIds];
        
        this.sessionForm.patchValue({
          intitule: data.intitule,
          dateDebut: data.dateDebut?.slice(0, 16),
          dateFin: data.dateFin?.slice(0, 16),
          idSurveys: surveyIds,
          status: data.status?.toLowerCase() || 'planifiee'
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = 'Erreur lors du chargement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      console.log('Formulaire invalide');
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;
    
    const formValue = this.sessionForm.value;
    
    // Formater les dates correctement (ajouter les secondes)
    const sessionData = {
      intitule: formValue.intitule,
      dateDebut: formValue.dateDebut + ':00',
      dateFin: formValue.dateFin + ':00',
      idSurveys: this.selectedSurveyIds,  // 🔥 Utiliser la liste des checkboxes
      status: formValue.status
    };
    
    console.log('📤 Envoi session:', sessionData);
    console.log('📤 Surveys sélectionnés:', this.selectedSurveyIds);
    console.log('📤 JSON:', JSON.stringify(sessionData));

    if (this.isEditMode && this.sessionId) {
      this.http.put(`/api/sessions/${this.sessionId}`, sessionData).subscribe({
        next: (response) => {
          console.log('✅ Session mise à jour:', response);
          this.successMessage = 'Session modifiée avec succès !';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/sessions']);
          }, 1500);
        },
        error: (err) => {
          console.error('❌ Erreur mise à jour:', err);
          console.error('❌ Détail:', err.error);
          this.error = err.error || 'Erreur lors de la mise à jour';
          this.loading = false;
        }
      });
    } else {
      this.http.post('/api/sessions', sessionData).subscribe({
        next: (response) => {
          console.log('✅ Session créée:', response);
          this.successMessage = 'Session créée avec succès !';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/sessions']);
          }, 1500);
        },
        error: (err) => {
          // Création / mise à jour session
          this.alertService.showError('Erreur', err.error || 'Erreur lors de la création', err.error?.message);
          console.error('❌ Erreur création:', err);
          console.error('❌ Détail:', err.error);
          this.error = err.error || 'Erreur lors de la création';
          this.loading = false;
        }
      });
    }
  }
}