import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EtatSurvey } from '../../../core/models';

@Component({
  selector: 'app-survey-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './survey-form.component.html',
  styleUrls: ['./survey-form.component.css']
})
export class SurveyFormComponent implements OnInit {
  surveyForm: FormGroup;
  isEditMode = false;
  surveyId: number | null = null;
  loading = false;
  error: string | null = null;
  etatsSurvey: EtatSurvey[] = [];  
  selectedEtatId: number = 1;  


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.surveyForm = this.fb.group({
      code: ['', [Validators.required]],
      libelle: ['', [Validators.required]],
      libelleEn: [''],
      isValid: [true],
      idEtatSurvey: [1, Validators.required],
      isFormReference: [false]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.surveyId = +params['id'];
        this.loadSurveyData();
      }
    });
  }

  loadSurveyData(): void {
    this.loading = true;
    console.log('Chargement du survey', this.surveyId);
    
    this.http.get<any>(`/api/survey/${this.surveyId}`).subscribe({
      next: (data) => {
        console.log('Survey chargé:', data);
        this.surveyForm.patchValue({
          code: data.code,
          libelle: data.libelle,
          libelleEn: data.libelleEn || '',
          idEtatSurvey: data.idEtatSurvey || 1,
          isFormReference: data.formReference
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.error = 'Erreur lors du chargement du survey';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.surveyForm.invalid) {
      console.log('Formulaire invalide');
      return;
    }

    const surveyData = {
      code: this.surveyForm.value.code,
      libelle: this.surveyForm.value.libelle,
      libelleEn: this.surveyForm.value.libelleEn,
      isFormReference: this.surveyForm.value.isFormReference,
      idEtatSurvey: Number(this.surveyForm.value.idEtatSurvey)  // 1 ou 2
     };

console.log('📤 Envoi survey (DÉTAIL):', JSON.stringify(surveyData, null, 2));

    if (this.isEditMode && this.surveyId) {
      // Mise à jour
      this.http.put(`/api/survey/${this.surveyId}`, surveyData).subscribe({
        next: () => {
          console.log('Survey mis à jour');
          this.router.navigate(['/surveys']);
        },
        error: (err) => {
          console.error('Erreur mise à jour:', err);
          alert('Erreur lors de la mise à jour');
        }
      });
    } else {
      // Création
      this.http.post('/api/survey', surveyData).subscribe({
        next: () => {
          console.log('Survey créé');
          this.router.navigate(['/surveys']);
        },
        error: (err) => {
          console.error('Erreur création:', err);
          alert('Erreur lors de la création');
        }
      });
    }
  }
}