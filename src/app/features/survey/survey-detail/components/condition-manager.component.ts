// condition-manager.component.ts - VERSION CORRIGÉE
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Answer, Question, Section } from '../../../../core/models/survey';

@Component({
  selector: 'app-condition-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="condition-manager mt-2 p-2 bg-light rounded" *ngIf="isConditionalType">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small class="fw-bold text-orange">
          <i class="bi bi-diagram-3 me-1"></i>
          Conditions associées à cette réponse
        </small>
      </div>
      
      <!-- Questions conditionnelles existantes -->
      <div *ngIf="answer && answer.condiQuestion && answer.condiQuestion.length > 0" class="mb-2">
        <small class="text-muted">Questions déclenchées :</small>
        <div class="d-flex flex-wrap gap-1 mt-1">
          <span *ngFor="let q of answer.condiQuestion" class="badge bg-info text-white">
            {{ q.titleFr }}
            <i class="bi bi-x-circle ms-1" style="cursor: pointer;" 
               (click)="removeCondition('question', q.id!)"></i>
          </span>
        </div>
      </div>
      
      <!-- Sections conditionnelles existantes -->
      <div *ngIf="answer && answer.condiSections && answer.condiSections.length > 0" class="mb-2">
        <small class="text-muted">Sections déclenchées :</small>
        <div class="d-flex flex-wrap gap-1 mt-1">
          <span *ngFor="let s of answer.condiSections" class="badge bg-warning text-dark">
            {{ s.title }}
            <i class="bi bi-x-circle ms-1" style="cursor: pointer;" 
               (click)="removeCondition('section', s.id!)"></i>
          </span>
        </div>
      </div>
      
      <!-- Ajouter une nouvelle condition -->
      <div class="row g-2 mt-1">
        <div class="col-5">
          <select class="form-select form-select-sm" [(ngModel)]="selectedType">
            <option value="question">Question</option>
            <option value="section">Section</option>
          </select>
        </div>
        <div class="col-5">
          <select class="form-select form-select-sm" [(ngModel)]="selectedItemId">
            <option [ngValue]="null">-- Sélectionner --</option>
            <option *ngFor="let q of availableQuestions" [ngValue]="q.id">
              📄 {{ q.titleFr }} ({{ q.code }})
            </option>
            <option *ngFor="let s of availableSections" [ngValue]="s.id">
              📁 {{ s.title }} ({{ s.code }})
            </option>
          </select>
        </div>
        <div class="col-2">
          <button class="btn btn-sm btn-orange w-100" 
                  (click)="addCondition()" 
                  [disabled]="!selectedItemId">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      </div>
    </div>
    <div *ngIf="!isConditionalType" class="text-muted small mt-1">
      <i class="bi bi-info-circle"></i>
      Ce type de question ne peut pas déclencher de conditions.
    </div>
  `,
  styles: [`
    .btn-orange {
      background-color: #ff6b35;
      border: none;
      color: white;
    }
    .btn-orange:hover {
      background-color: #e55a2b;
    }
    .badge {
      cursor: default;
    }
  `]
})
export class ConditionManagerComponent implements OnInit {
  @Input() answer?: Answer;
  @Input() questionTypeCode?: string;
  @Input() availableQuestions: Question[] = [];
  @Input() availableSections: Section[] = [];
  @Output() conditionAdded = new EventEmitter<void>();
  @Output() conditionRemoved = new EventEmitter<void>();

  selectedType: 'question' | 'section' = 'question';
  selectedItemId: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('ConditionManager initialized for answer:', this.answer);
  }

  get isConditionalType(): boolean {
    const codes = ['RADIO', 'CHECKBOX', 'LIST', 'MULTI_SELECT'];
    return codes.includes(this.questionTypeCode || '');
  }

  addCondition(): void {
    if (!this.answer?.id || !this.selectedItemId) return;

    const url = this.selectedType === 'question'
      ? `/api/questionAnswers/${this.answer.id}/add-condi-question/${this.selectedItemId}`
      : `/api/questionAnswers/${this.answer.id}/add-condi-section/${this.selectedItemId}`;

    this.http.put(url, {}).subscribe({
      next: () => {
        console.log('Condition ajoutée');
        this.selectedItemId = null;
        this.conditionAdded.emit();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  removeCondition(type: 'question' | 'section', id: number): void {
    if (!this.answer?.id) return;

    const url = type === 'question'
      ? `/api/questionAnswers/${this.answer.id}/remove-condi-question/${id}`
      : `/api/questionAnswers/${this.answer.id}/remove-condi-section/${id}`;

    this.http.delete(url).subscribe({
      next: () => {
        console.log('Condition supprimée');
        this.conditionRemoved.emit();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
}