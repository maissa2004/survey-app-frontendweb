import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Answer } from '../../../core/models/survey';

@Component({
  selector: 'app-answer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './answer-form.component.html',
  styleUrls: ['./answer-form.component.css']
})
export class AnswerFormComponent implements OnInit {
  @Input() questionId?: number;
  @Input() existingAnswers: Answer[] = [];
  @Input() editingAnswer: Answer | null = null;
  @Output() answerCreated = new EventEmitter<Answer>();
  @Output() answerUpdated = new EventEmitter<Answer>();
  @Output() answerDeleted = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  answerForm: FormGroup;
  isEditing = false;
  editingAnswerId: number | null = null;

  constructor(private fb: FormBuilder) {
    this.answerForm = this.fb.group({
      code: [''],
      libelle: ['', Validators.required],
      libelleEn: [''],
      reference: ['']
    });
  }

  ngOnInit(): void {
    if (this.editingAnswer) {
      this.isEditing = true;
      this.editingAnswerId = this.editingAnswer.id || null;
      this.answerForm.patchValue({
        code: this.editingAnswer.code,
        libelle: this.editingAnswer.libelle,
        libelleEn: this.editingAnswer.libelleEn,
        reference: this.editingAnswer.reference
      });
    }
  }

  onSubmit(): void {
    if (this.answerForm.valid) {
      const answerData: Answer = this.answerForm.value;
      
      if (this.isEditing && this.editingAnswerId) {
        answerData.id = this.editingAnswerId;
        this.answerUpdated.emit(answerData);
        this.resetForm();
      } else {
        this.answerCreated.emit(answerData);
        this.answerForm.reset();
      }
    }
  }

  // ✅ Ajouter cette méthode pour éditer une réponse
  onEditAnswer(answer: Answer): void {
    this.isEditing = true;
    this.editingAnswerId = answer.id || null;
    this.answerForm.patchValue({
      code: answer.code,
      libelle: answer.libelle,
      libelleEn: answer.libelleEn,
      reference: answer.reference
    });
  }

  // ✅ Ajouter cette méthode pour supprimer une réponse
  onDeleteAnswer(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      this.answerDeleted.emit(id);
    }
  }

  onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingAnswerId = null;
    this.answerForm.reset();
  }
}