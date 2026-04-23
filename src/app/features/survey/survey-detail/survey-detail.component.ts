import { ChangeDetectorRef, Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Survey, Section, Question, Answer, NmTypeQuest } from '../../../core/models/survey';
import { getIconForType } from '../../../core/utils/question-type-icons';
import { QuestionService } from '../../../core/services';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './survey-detail.component.html',
  styleUrls: ['./survey-detail.component.css']
})
export class SurveyDetailComponent implements OnInit {
  survey: Survey | null = null;
  sections: Section[] = [];
  questionTypes: NmTypeQuest[] = [];
  loading = false;
  error: string | null = null;
  typesLoaded = false;
  sectionForm: FormGroup;
  subSectionForm: FormGroup;
  questionForm: FormGroup;
  
  showSectionForm = false;
  showSubSectionForm = false;
  showQuestionForm = false;
  selectedSection: Section | null = null;
  selectedParentSection: Section | null = null;
  editingSection: Section | null = null;
  editingQuestion: Question | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.sectionForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      titleEn: [''],
      conditionnel: [false],
      ordre: [1]
    });

    this.subSectionForm = this.fb.group({
      code: ['', Validators.required],
      title: ['', Validators.required],
      titleEn: [''],
      conditionnel: [false],
      ordre: [1]
    });

    this.questionForm = this.fb.group({
      code: ['', Validators.required],
      titleFr: ['', Validators.required],
      titleEn: [''],
      required: [false],
      conditionnel: [false],
      id_nm_type_quest: ['', Validators.required],
      answers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadQuestionTypes();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadSurvey(params['id']);
      }
    });
  }

  loadQuestionTypes(): void {
    this.questionService.getQuestionTypes().subscribe({
      next: (types) => {
        this.questionTypes = types;
        this.typesLoaded = true;
        console.log('Types chargés:', types);
        console.log('IDs des types:', types.map(t => t.id));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement types:', err)
    });
  }

  organizeSectionsByOrder(sections: Section[]): Section[] {
  if (!sections || sections.length === 0) return [];
  
  const sorted = [...sections].sort((a, b) => a.ordre - b.ordre);
  const result: Section[] = [];
  let currentParent: Section | null = null;
  
  for (const section of sorted) {
    if (section.ordre === 1) {
      // Nouvelle section parente
      currentParent = { ...section, children: [] };
      result.push(currentParent);
    } else if (currentParent) {
      // Sous-section
      if (!currentParent.children) currentParent.children = [];
      currentParent.children.push(section);
    } else {
      // Fallback
      result.push({ ...section, children: [] });
    }
  }
  
  return result;
}

  loadSurvey(id: number): void {
  this.loading = true;
  this.error = null;
  console.log('🔄 Chargement du survey', id);
  
  this.http.get<Survey>(`/api/survey/full/${id}`).subscribe({
    next: (data) => {
      console.log('✅ Données reçues du backend');
      this.ngZone.run(() => {
        this.survey = data;
        const allSections = data.sections || [];
        this.sections = this.organizeSectionsByOrder(allSections);
        console.log('✅ Sections organisées:', this.sections.length);
        this.loading = false;
        this.cdr.detectChanges();
      });
    },
    error: (err) => {
      console.error('❌ Erreur chargement:', err);
      this.error = 'Erreur lors du chargement du survey';
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

  openSectionForm(): void {
    this.showSectionForm = true;
    this.editingSection = null;
    this.sectionForm.reset();
    this.sectionForm.patchValue({ conditionnel: false, ordre: 1 });
    this.cdr.detectChanges();
  }

  openSubSectionForm(parentSection: Section): void {
    this.selectedParentSection = parentSection;
    this.showSubSectionForm = true;
    this.subSectionForm.reset();
    this.subSectionForm.patchValue({ 
      conditionnel: false, 
      ordre: parentSection.children ? parentSection.children.length + 1 : 1 
    });
    this.cdr.detectChanges();
  }

  addSection(): void {
    if (this.sectionForm.valid && this.survey) {
      const today = new Date().toISOString().split('T')[0];
      const sectionData = {
        code: this.sectionForm.value.code,
        title: this.sectionForm.value.title,
        titleEn: this.sectionForm.value.titleEn || '',
        isConditionnel: this.sectionForm.value.conditionnel === true ,
        ordre: Number(this.sectionForm.value.ordre) || 1,
        dtUpdate: today,
        idReferencedForm: 0,
idSurvey: this.survey.id  
      };
      
      console.log('Envoi avec survey.id:', this.survey.id);
      console.log('Données complètes:', JSON.stringify(sectionData));
      
      this.http.post('/api/section', sectionData).subscribe({
        next: () => {
          this.loadSurvey(this.survey!.id!);
          this.showSectionForm = false;
          this.sectionForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur:', err)
      });
    }
  }

  addSubSection(): void {
  if (this.subSectionForm.valid && this.survey && this.selectedParentSection) {
    const today = new Date().toISOString().split('T')[0];
    
    const sectionData = {
      code: this.subSectionForm.value.code,
      title: this.subSectionForm.value.title,
      titleEn: this.subSectionForm.value.titleEn || '',
      isConditionnel: this.subSectionForm.value.conditionnel === true,  
      ordre: Number(this.subSectionForm.value.ordre) || 1,
      dtUpdate: today,
      idReferencedForm: 0,
      idSurvey: this.survey.id  
    };
    
    console.log('📤 Envoi sous-section:', JSON.stringify(sectionData));
    
    this.http.post('/api/section', sectionData).subscribe({
      next: (newSection: any) => {
        console.log('✅ Sous-section créée:', newSection);
        this.loadSurvey(this.survey!.id!);
        this.subSectionForm.reset();
        this.showSubSectionForm = false;
        this.selectedParentSection = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur création sous-section:', err);
        console.error('❌ Détails:', err.error);
        alert('Erreur lors de la création de la sous-section');
      }
    });
  } else {
    console.log('❌ Formulaire invalide ou paramètres manquants');
    console.log('subSectionForm.valid:', this.subSectionForm.valid);
    console.log('survey:', this.survey);
    console.log('selectedParentSection:', this.selectedParentSection);
  }
}

  editSection(section: Section): void {
    this.editingSection = section;
    const isConditionnel = section.conditionnel === 1 || section.conditionnel === true;
    this.sectionForm.patchValue({
      code: section.code,
      title: section.title,
      titleEn: section.titleEn,
      conditionnel: isConditionnel,
      ordre: section.ordre
    });
    this.showSectionForm = true;
    this.cdr.detectChanges();
  }

  updateSection(): void {
    if (this.sectionForm.valid && this.editingSection) {
      const updatedSection = { 
        ...this.editingSection, 
        ...this.sectionForm.value,
        conditionnel: this.sectionForm.value.conditionnel ? 1 : 0
      };
      this.http.put<Section>(`/api/section/${this.editingSection.id}`, updatedSection).subscribe({
        next: () => {
          this.loadSurvey(this.survey!.id!);
          this.sectionForm.reset();
          this.showSectionForm = false;
          this.editingSection = null;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur mise à jour section:', err)
      });
    }
  }

  deleteSection(id: number): void {
    if (confirm('Supprimer cette section ?')) {
      this.http.delete(`/api/section/${id}`).subscribe({
        next: () => {
          this.loadSurvey(this.survey!.id!);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur suppression section:', err)
      });
    }
  }

  cancelSectionForm(): void {
    this.showSectionForm = false;
    this.editingSection = null;
    this.sectionForm.reset();
    this.cdr.detectChanges();
  }

  cancelSubSectionForm(): void {
    this.showSubSectionForm = false;
    this.selectedParentSection = null;
    this.subSectionForm.reset();
    this.cdr.detectChanges();
  }

  openQuestionForm(section: Section): void {
    this.selectedSection = section;
    this.showQuestionForm = true;
    this.editingQuestion = null;
    
    // Réinitialiser le formulaire
    this.questionForm.reset({
      code: '',
      titleFr: '',
      titleEn: '',
      required: false,
      conditionnel: false,
      id_nm_type_quest: '',
      answers: []
    });
    
    // Vider le FormArray des réponses
    const answersArray = this.getAnswersArray();
    while (answersArray.length) {
      answersArray.removeAt(0);
    }
    this.cdr.detectChanges();
  }

  editQuestion(question: Question, section: Section): void {
  console.log('📝 Édition de la question:', question);
  
  this.selectedSection = section;
  this.editingQuestion = question;
  
  // Réinitialiser complètement le formulaire
  this.questionForm.reset({
    code: question.code,
    titleFr: question.titleFr,
    titleEn: question.titleEn || '',
    required: question.required,
    conditionnel: question.conditionnel,
    id_nm_type_quest: question.id_nm_type_quest,
    answers: []
  });
  
  // Vider le FormArray des réponses
  const answersArray = this.getAnswersArray();
  while (answersArray.length) {
    answersArray.removeAt(0);
  }
  
  // Recharger les réponses existantes
  if (question.answers && question.answers.length > 0) {
    question.answers.forEach((answer: Answer) => {
      answersArray.push(this.fb.group({
        id: [answer.id],
        code: [answer.code],
        libelle: [answer.libelle, Validators.required],
        libelleEn: [answer.libelleEn],
        reference: [answer.reference]
      }));
    });
  }
  
  // S'assurer que le modal est affiché
  this.showQuestionForm = true;
  this.cdr.detectChanges();
}

  getAnswersArray(): FormArray {
    return this.questionForm.get('answers') as FormArray;
  }

  addAnswer(): void {
    this.getAnswersArray().push(this.fb.group({
      code: [''],
      libelle: ['', Validators.required],
      libelleEn: [''],
      reference: ['']
    }));
    this.cdr.detectChanges();
  }

  removeAnswer(index: number): void {
    this.getAnswersArray().removeAt(index);
    this.cdr.detectChanges();
  }

  saveQuestion(): void {
  console.log('💾 SAVE QUESTION CALLED');
  
  if (this.questionForm.valid && this.selectedSection && this.survey) {
    const idNmTypeQuest = Number(this.questionForm.value.id_nm_type_quest);
    const needsAnswers = this.requiresAnswers(idNmTypeQuest);
    const answers = this.questionForm.value.answers || [];
    
    if (needsAnswers && answers.length === 0) {
      alert('Ce type de question nécessite au moins une réponse.');
      return;
    }
    
    const questionData = {
      code: this.questionForm.value.code,
      titleFr: this.questionForm.value.titleFr,
      titleEn: this.questionForm.value.titleEn || '',
      id_nm_type_quest: idNmTypeQuest
    };
    
    if (this.editingQuestion) {
      // MODIFICATION - code existant
      const questionId = this.editingQuestion.id;
      if (!questionId) return;
      
      this.http.put(`/api/question/${questionId}`, questionData).subscribe({
        next: () => {
          // Gérer les réponses...
          this.loadSurvey(this.survey!.id!);
          this.cancelQuestionForm();
        },
        error: (err) => console.error('❌ Erreur mise à jour:', err)
      });
    } else {
      // 🔥 CRÉATION - AJOUTER CETTE PARTIE
      this.http.post('/api/question', questionData).subscribe({
        next: (newQuestion: any) => {
          console.log('✅ Question créée:', newQuestion);
          const questionId = newQuestion.id;
          
          // 1. Sauvegarder les réponses si nécessaire
          if (needsAnswers && answers.length > 0) {
            this.saveAnswersForQuestion(questionId, answers, () => {
              // 2. Créer la liaison section_question
              this.createSectionQuestion(questionId);
            });
          } else {
            // 2. Créer la liaison section_question
            this.createSectionQuestion(questionId);
          }
        },
        error: (err) => {
          console.error('❌ Erreur création question:', err);
          alert('Erreur lors de la création de la question');
        }
      });
    }
  } else {
    console.log('❌ Formulaire invalide ou section non sélectionnée');
    console.log('Form valid:', this.questionForm.valid);
    console.log('selectedSection:', this.selectedSection);
    console.log('survey:', this.survey);
  }
}


deleteAnswersForQuestion(questionId: number, callback: () => void): void {
  console.log('🔍 === SUPPRESSION DES ANCIENNES RÉPONSES ===');
  console.log('🔍 Question ID:', questionId);
  
  // Vérifier que l'URL est correcte
  const url = `/api/questionAnswers/question/${questionId}`;
  console.log('🔍 URL appelée:', url);
  
  this.http.delete(url).subscribe({
    next: () => {
      console.log('✅ Toutes les anciennes réponses supprimées');
      callback();
    },
    error: (err) => {
      console.error('❌ Erreur suppression des réponses:', err);
      console.error('❌ Statut:', err.status);
      console.error('❌ Message:', err.message);
      callback(); // Continuer même en cas d'erreur
    }
  });
}



saveAnswersForQuestion(questionId: number, answers: any[], callback: () => void): void {
  if (!questionId || answers.length === 0) {
    callback();
    return;
  }
  
  let completed = 0;
  const total = answers.length;
  const today = new Date().toISOString().split('T')[0];
  
  answers.forEach((answer, index) => {
    const nmAnswersData = {
      code: answer.code || '',
      libelle: answer.libelle,
      libelleEn: answer.libelleEn || '',
      reference: answer.reference || '',
      dtUpdate: today
    };
    
    this.http.post('/api/nmAnswers', nmAnswersData).subscribe({
      next: (nmAnswer: any) => {
        const nmAnswerId = nmAnswer.id;
        
        const questionAnswersData = {
          isConditionnel: false,
          dtUpdate: today,
          question: { id: questionId },
          nmAnswers: { id: nmAnswerId }
        };
        
        this.http.post('/api/questionAnswers', questionAnswersData).subscribe({
          next: () => {
            completed++;
            if (completed === total) callback();
          },
          error: () => {
            completed++;
            if (completed === total) callback();
          }
        });
      },
      error: () => {
        completed++;
        if (completed === total) callback();
      }
    });
  });
}

private createQuestionAnswer(questionId: number, nmAnswerId: number, today: string, completed: number, total: number, callback: () => void): void {
  const questionAnswersData = {
    isConditionnel: false,
    dtUpdate: today,
    question: { id: questionId },      // ← Objet Question avec ID
    nmAnswers: { id: nmAnswerId } ,   // ← Objet NmAnswers avec ID
    sectionQuestion: null            // ou { id: 0 } si NULL n'est pas accepté
  
  };
  
  console.log('📤 Création QuestionAnswers:', questionAnswersData);
  
  this.http.post('/api/questionAnswers', questionAnswersData).subscribe({
    next: () => {
      completed++;
      console.log(`✅ Réponse ${completed}/${total} sauvegardée`);
      if (completed === total) callback();
    },
    error: (err) => {
      console.error('❌ Erreur QuestionAnswers:', err);
      completed++;
      if (completed === total) callback();
    }
  });
}

  // ✅ NOUVELLE MÉTHODE : Créer la section_question
  createSectionQuestion(questionId: number): void {
  console.log('📤 Création section_question pour questionId:', questionId);
  
  const sectionQuestionData = {
    required: this.questionForm.value.required ? 1 : 0,
    conditionnel: this.questionForm.value.conditionnel ? 1 : 0,
    ordre: this.selectedSection!.questions ? this.selectedSection!.questions.length + 1 : 1,
    dtUpdate: new Date().toISOString().split('T')[0],
    idSection: this.selectedSection!.id,
    idQuestion: questionId
  };
  
  console.log('📤 Données section_question:', sectionQuestionData);
  
  this.http.post('/api/sectionQuestion', sectionQuestionData).subscribe({
    next: () => {
      console.log('✅ Section_question créée avec succès');
      this.loadSurvey(this.survey!.id!);
      this.showQuestionForm = false;
      this.cancelQuestionForm();
    },
    error: (err) => {
      console.error('❌ Erreur création section_question:', err);
      // Supprimer la question créée si la liaison échoue
      this.http.delete(`/api/question/${questionId}`).subscribe();
      alert('Erreur lors de la liaison de la question à la section');
    }
  });
}

  onTypeChange(event: any): void {
  const value = +event.target.value;  // Convertit en nombre
  this.questionForm.get('id_nm_type_quest')?.setValue(value);
  this.cdr.detectChanges();
}


  deleteQuestion(questionId: number): void {
    if (confirm('Supprimer cette question ?') && this.survey) {
      this.http.delete(`/api/question/${questionId}`).subscribe({
        next: () => {
          this.loadSurvey(this.survey!.id!);
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erreur suppression question:', err)
      });
    }
  }

  getQuestionTypeLabel(typeId: number): string {
    console.log('getQuestionTypeLabel called with typeId:', typeId);
    const type = this.questionTypes.find(t => t.id === typeId);
    return type ? type.libelle : 'Inconnu';
  }

  getQuestionTypeIcon(typeId: number): string {
    const type = this.questionTypes.find(t => t.id === typeId);
    return type ? getIconForType(type.code) : 'bi bi-question-circle';
  }

  requiresAnswers(typeId: number | string | null | undefined): boolean {
  // Vérifier si la valeur est vide
  if (typeId === null || typeId === undefined || typeId === '') {
    return false;
  }
  
  // Convertir en nombre si nécessaire
  const numericId = typeof typeId === 'string' ? Number(typeId) : typeId;
  
  // Vérifier si la conversion a réussi
  if (isNaN(numericId)) {
    return false;
  }
  
  const type = this.questionTypes.find(t => t.id === numericId);
  const codesWithAnswers = ['CHECKBOX', 'LIST', 'RADIO', 'MULTI_SELECT'];
  return type ? codesWithAnswers.includes(type.code) : false;
}

  cancelQuestionForm(): void {
  console.log('❌ Annulation édition');
  
  this.showQuestionForm = false;
  this.editingQuestion = null;
  this.selectedSection = null;
  
  // Réinitialiser le formulaire
  this.questionForm.reset({
    code: '',
    titleFr: '',
    titleEn: '',
    required: false,
    conditionnel: false,
    id_nm_type_quest: '',
    answers: []
  });
  
  // Vider le FormArray des réponses
  const answersArray = this.getAnswersArray();
  while (answersArray.length) {
    answersArray.removeAt(0);
  }
  
  this.cdr.detectChanges();
}
}