import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Answer } from '../../../core/models/survey';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.css']
})
export class QuestionFormComponent {
  @Input() sectionId?: number;
  @Output() questionCreated = new EventEmitter<any>();
  
  questionForm: FormGroup;
  questionTypes = [
    { code: 'TEXT', libelle: 'Texte' },
    { code: 'LIST', libelle: 'Liste' },
    { code: 'RADIO', libelle: 'Radio' },
    { code: 'CHECKBOX', libelle: 'Checkbox' }
  ];
  
  answersList: Answer[] = [];

  constructor(private fb: FormBuilder) {
    this.questionForm = this.fb.group({
      code: ['', Validators.required],
      titleFr: ['', Validators.required],
      titleEn: [''],
      required: [false],
      conditionnel: [false],
      codeTypeQues: ['', Validators.required]
    });
  }

  get requiresAnswers(): boolean {
    const type = this.questionForm.get('codeTypeQues')?.value;
    return type === 'LIST' || type === 'RADIO' || type === 'CHECKBOX';
  }

  onAnswerCreated(answer: Answer): void {
    this.answersList.push(answer);
    console.log('Réponse créée:', answer);
  }

  onAnswerUpdated(answer: Answer): void {
    const index = this.answersList.findIndex(a => a.id === answer.id);
    if (index !== -1) {
      this.answersList[index] = answer;
    }
    console.log('Réponse mise à jour:', answer);
  }

  onAnswerDeleted(id: number): void {
    this.answersList = this.answersList.filter(a => a.id !== id);
    console.log('Réponse supprimée:', id);
  }

  onSubmit(): void {
    if (this.questionForm.valid) {
      if (this.requiresAnswers && this.answersList.length === 0) {
        alert('Pour ce type de question, vous devez ajouter au moins une réponse.');
        return;
      }

      const questionData = {
        ...this.questionForm.value,
        answers: this.answersList
      };
      
      console.log('Question créée:', questionData);
      this.questionCreated.emit(questionData);
      
      this.questionForm.reset();
      this.answersList = [];
      
      this.questionForm.patchValue({
        required: false,
        conditionnel: false
      });
    }
  }
}