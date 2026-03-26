import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-section-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './section-form.component.html',
  styleUrls: ['./section-form.component.css']
})
export class SectionFormComponent {
  @Input() surveyId?: number;
  @Output() sectionCreated = new EventEmitter<any>();
  
  sectionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.sectionForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      titleEn: [''],
      conditionnel: [false],
      ordre: [1]
    });
  }

  onSubmit(): void {
    if (this.sectionForm.valid) {
      this.sectionCreated.emit(this.sectionForm.value);
      this.sectionForm.reset();
    }
  }
}