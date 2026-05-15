import { ChangeDetectorRef, Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Survey, Section, Question, Answer, NmTypeQuest } from '../../../core/models/survey';
import { getIconForType } from '../../../core/utils/question-type-icons';
import { QuestionService } from '../../../core/services';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AlertService } from '../../../core/services/alert.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,FormsModule],
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
  tempConditionType: { [key: number]: 'question' | 'section' } = {};
tempConditionItemId: { [key: number]: number | null } = {};


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private questionService: QuestionService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private alertService: AlertService,
  private confirmService: ConfirmService
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
  
  const sectionMap = new Map<number, Section>();
  const rootSections: Section[] = [];
  
  // Créer un map de toutes les sections avec leurs enfants
  sections.forEach(section => {
    sectionMap.set(section.id!, { ...section, children: [] });
  });
  
  // Organiser l'arborescence
  sections.forEach(section => {
    const sectionWithChildren = sectionMap.get(section.id!);
    if (section.parentSectionId && sectionMap.has(section.parentSectionId)) {
      // C'est une sous-section - l'attacher à son parent
      const parent = sectionMap.get(section.parentSectionId!);
      if (parent && parent.children) {
        parent.children.push(sectionWithChildren!);
      }
    } else {
      // C'est une section racine
      rootSections.push(sectionWithChildren!);
    }
  });
  
  // Trier les sections racines par ordre
  rootSections.sort((a, b) => a.ordre - b.ordre);
  
  // Trier les sous-sections de chaque parent par ordre
  rootSections.forEach(section => {
    if (section.children && section.children.length > 0) {
      section.children.sort((a, b) => a.ordre - b.ordre);
    }
  });
  
  return rootSections;
}

  loadSurvey(id: number): void {
  this.loading = true;
  this.error = null;
  console.log('🔄 Chargement du survey', id);
  
  this.http.get<Survey>(`/api/survey/full/${id}`).subscribe({
    next: (data) => {
      console.log('✅ Données reçues du backend');
      console.log('📊 Sections reçues (brutes):', data.sections);
      // 🔥 Afficher les parentSectionId de chaque section
      data.sections?.forEach(s => {
        console.log(`Section: ${s.title}, parentSectionId: ${s.parentSectionId}`);
      });
      
      this.ngZone.run(() => {
        this.survey = data;
        const allSections = data.sections || [];
this.sections = this.buildSectionHierarchy(allSections);
console.log('✅ Hiérarchie construite:', this.sections);        console.log('✅ Sections organisées:', this.sections);
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

buildSectionHierarchy(sections: Section[]): Section[] {
  const sectionMap = new Map<number, Section>();
  const rootSections: Section[] = [];
  
  // 1. Créer une copie de toutes les sections avec un tableau children vide
  sections.forEach(section => {
    sectionMap.set(section.id!, {
      ...section,
      children: [],
      conditionnel: section.conditionnel === true || section.conditionnel === 1
    });
  });
  
  console.log('📊 Map créé, nombre de sections:', sectionMap.size);
  
  // 2. Construire l'arborescence
  sections.forEach(section => {
    const sectionWithChildren = sectionMap.get(section.id!);
    if (!sectionWithChildren) return;
    
    // Vérifier si c'est une sous-section
    if (section.parentSectionId && section.parentSectionId !== null && section.parentSectionId !== 0) {
      const parent = sectionMap.get(section.parentSectionId);
      if (parent) {
        // Ajouter comme enfant du parent
        if (!parent.children) parent.children = [];
        parent.children.push(sectionWithChildren);
        console.log(`🔗 "${section.title}" (id: ${section.id}) attaché à "${parent.title}" (id: ${parent.id})`);
      } else {
        console.warn(`⚠️ Parent non trouvé pour "${section.title}" (parentId: ${section.parentSectionId})`);
        rootSections.push(sectionWithChildren);
      }
    } else {
      // Section racine
      rootSections.push(sectionWithChildren);
      console.log(`📁 Section racine: "${section.title}" (id: ${section.id})`);
    }
  });
  
  // 3. Trier les sections racines par ordre
  rootSections.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  
  // 4. Trier les enfants de chaque parent par ordre
  rootSections.forEach(section => {
    if (section.children && section.children.length > 0) {
      section.children.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      console.log(`📂 "${section.title}" a ${section.children.length} enfant(s):`, section.children.map(c => c.title));
    }
  });
  
  return rootSections;
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
        ordre: 0,
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
    
    // 🔥 Calculer l'ordre automatiquement
    const existingChildren = this.selectedParentSection.children || [];
    const nextOrder = existingChildren.length + 1;
    
    const sectionData = {
      code: this.subSectionForm.value.code,
      title: this.subSectionForm.value.title,
      titleEn: this.subSectionForm.value.titleEn || '',
      isConditionnel: this.subSectionForm.value.conditionnel === true,  
      ordre: nextOrder,
      dtUpdate: today,
      idReferencedForm: 0,
      idSurvey: this.survey.id,
      parentSectionId: this.selectedParentSection.id  // 🔥 LIAISON AVEC LE PARENT
    };
    
    console.log('📤 Envoi sous-section:', JSON.stringify(sectionData));
    console.log('🔗 Parent section ID:', this.selectedParentSection.id);
    
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
  console.log('=== EDIT SECTION ===');
  console.log('Section reçue:', section);
  console.log('section.conditionnel valeur:', section.conditionnel);
  console.log('section.conditionnel type:', typeof section.conditionnel);

    this.editingSection = section;
    const isConditionnel = section.conditionnel === 1 || section.conditionnel === true;
    console.log('isConditionnel calculé:', isConditionnel);

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
    const today = new Date().toISOString().split('T')[0];
    
    // 🔥 Créer un objet propre avec seulement les champs attendus par le backend
    const sectionData = {
      code: this.sectionForm.value.code,
      title: this.sectionForm.value.title,
      titleEn: this.sectionForm.value.titleEn || '',
      isConditionnel: this.sectionForm.value.conditionnel === true,
      ordre: Number(this.sectionForm.value.ordre) || 1,
      dtUpdate: today,
      idReferencedForm: this.editingSection.idReferencedForm || 0,
      idSurvey: this.editingSection.idSurvey || this.survey?.id,
      parentSectionId: this.editingSection.parentSectionId
    };
    
    console.log('📤 Mise à jour section:', JSON.stringify(sectionData));
    
    this.http.put(`/api/section/${this.editingSection.id}`, sectionData).subscribe({
      next: () => {
        this.alertService.showSuccess('Section modifiée', `La section "${this.sectionForm.value.title}" a été modifiée avec succès.`);
        this.loadSurvey(this.survey!.id!);
        this.sectionForm.reset();
        this.showSectionForm = false;
        this.editingSection = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour section:', err);
        this.alertService.showError('Erreur', err.error?.message || 'Erreur lors de la mise à jour de la section', err.error?.details);
      }
    });
  }
}

  // survey-detail.component.ts

async deleteSection(id: number): Promise<void> {
  const section = this.sections.find(s => s.id === id);
  
  const confirmed = await this.confirmService.show({
    title: 'Confirmation de suppression',
    message: `Êtes-vous sûr de vouloir supprimer la section "${section?.title}" ? Toutes les questions associées seront également supprimées.`,
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    type: 'danger'
  });
  
  if (!confirmed) return;
  
  this.http.delete(`/api/section/${id}`).subscribe({
    next: () => {
      this.alertService.showSuccess('Section supprimée', `La section "${section?.title}" a été supprimée avec succès.`);
      this.loadSurvey(this.survey!.id!);
    },
    error: (err) => {
      this.alertService.showError('Erreur', 'Une erreur est survenue lors de la suppression', err.error?.details);
    }
  });
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
  
  // Réinitialiser le formulaire
  this.questionForm.reset({
    code: question.code,
    titleFr: question.titleFr,
    titleEn: question.titleEn || '',
    required: question.required,
    conditionnel: question.conditionnel,
    id_nm_type_quest: question.id_nm_type_quest,
    answers: []
  });
  
  // Vider le FormArray
  const answersArray = this.getAnswersArray();
  while (answersArray.length) {
    answersArray.removeAt(0);
  }
  
  // 🔥 Recharger UNIQUEMENT les réponses VALIDES (avec libellé non vide)
  if (question.answers && question.answers.length > 0) {
    const validAnswers = question.answers.filter((a: any) => 
      a.libelle && a.libelle.trim() !== ''
    );
    
    console.log(`📋 Chargement: ${question.answers.length} réponses trouvées, ${validAnswers.length} valides`);
    
    validAnswers.forEach((answer: Answer) => {
      const formGroup = this.fb.group({
        id: [answer.id],
        code: [answer.code || ''],
        libelle: [answer.libelle, Validators.required],
        libelleEn: [answer.libelleEn || ''],
        reference: [answer.reference || ''],
        condiQuestion: [answer.condiQuestion || []],
        condiSections: [answer.condiSections || []]
      });
      answersArray.push(formGroup);
    });
  }
  
  this.cdr.detectChanges();
  this.showQuestionForm = true;
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
    
    // 🔥 FILTRER LES RÉPONSES VIDES
    const validAnswers = answers.filter((a: any) => 
      a.libelle && a.libelle.trim() !== ''
    );
    
    console.log(`📊 Réponses: ${answers.length} total, ${validAnswers.length} valides`);
    
    if (needsAnswers && validAnswers.length === 0) {
      this.alertService.showWarning('Attention', 'Ce type de question nécessite au moins une réponse valide.');
      return;
    }
    
    if (!idNmTypeQuest || isNaN(idNmTypeQuest)) {
      this.alertService.showError('Erreur', 'Veuillez sélectionner un type de question valide.');
      return;
    }
    
    const questionData = {
      code: this.questionForm.value.code,
      titleFr: this.questionForm.value.titleFr,
      titleEn: this.questionForm.value.titleEn || '',
      id_nm_type_quest: idNmTypeQuest
    };
    
    if (this.editingQuestion) {
      const questionId = this.editingQuestion.id;
      if (!questionId) return;
      
      // 🔥 1. Mettre à jour la question
      this.http.put(`/api/question/${questionId}`, questionData).subscribe({
        next: () => {
          console.log('✅ Question mise à jour');
          
          // 🔥 2. Si besoin, remplacer les réponses AVEC LEURS CONDITIONS
          if (needsAnswers) {
            // 🔥 PRÉPARER LES RÉPONSES VALIDES AVEC LEURS CONDITIONS
            const answersForBackend = validAnswers.map((a: any) => {
              // Extraire les IDs des questions conditionnelles
              const condiQuestionIds = (a.condiQuestion || []).map((q: any) => q.id).filter((id: number) => id);
              // Extraire les IDs des sections conditionnelles
              const condiSectionIds = (a.condiSections || []).map((s: any) => s.id).filter((id: number) => id);
              
              return {
                code: a.code || '',
                libelle: a.libelle,
                libelleEn: a.libelleEn || '',
                reference: a.reference || '',
                isConditionnel: (condiQuestionIds.length > 0 || condiSectionIds.length > 0),
                condiQuestionIds: condiQuestionIds,
                condiSectionIds: condiSectionIds
              };
            });
            
            console.log('📤 Envoi des réponses avec conditions:', answersForBackend);
            
            // 🔥 3. Appeler replace-answers
            this.http.put(`/api/questionAnswers/question/${questionId}/replace-answers`, answersForBackend).subscribe({
              next: () => {
                console.log('✅ Réponses remplacées avec succès');
                this.loadSurvey(this.survey!.id!);
                this.cancelQuestionForm();
              },
              error: (err) => {
                console.error('❌ Erreur remplacement réponses:', err);
                this.alertService.showError('Erreur', err.error || 'Erreur lors du remplacement des réponses');
                this.loadSurvey(this.survey!.id!);
                this.cancelQuestionForm();
              }
            });
          } else {
            // 🔥 Pas de réponses attendues, supprimer les anciennes si elles existent
            this.http.delete(`/api/questionAnswers/question/${questionId}/full`).subscribe({
              next: () => {
                console.log('✅ Anciennes réponses supprimées');
                this.loadSurvey(this.survey!.id!);
                this.cancelQuestionForm();
              },
              error: () => {
                this.loadSurvey(this.survey!.id!);
                this.cancelQuestionForm();
              }
            });
          }
        },
        error: (err) => {
          console.error('❌ Erreur mise à jour:', err);
          this.alertService.showError('Erreur', 'Erreur lors de la mise à jour de la question', err.error?.message || err.message);

        }
      });
    } else {
      // 🔥 CRÉATION - Utiliser aussi validAnswers
      this.http.post('/api/question', questionData).subscribe({
        next: (newQuestion: any) => {
          const questionId = newQuestion.id;
          if (needsAnswers && validAnswers.length > 0) {
            this.saveAnswersForQuestion(questionId, validAnswers, () => {
              this.createSectionQuestion(questionId);
            });
          } else {
            this.createSectionQuestion(questionId);
          }
        },
        error: (err) => {
          console.error('❌ Erreur création question:', err);
          this.alertService.showError('Erreur', 'Erreur lors de la création de la question',err.error?.message);

        }
      });
    }
  } else {
    console.warn('⚠️ Formulaire invalide ou paramètres manquants');
    if (!this.questionForm.valid) {
      console.log('QuestionForm invalide:', this.questionForm.errors);
    }
    if (!this.selectedSection) {
      console.log('selectedSection manquant');
    }
    if (!this.survey) {
      console.log('survey manquant');
    }
  }
}

// 🔥 NOUVELLE MÉTHODE : Remplacer complètement toutes les réponses
replaceAllAnswers(questionId: number, newAnswers: any[], callback: () => void): void {
  console.log('🔄 Remplacement complet des réponses pour la question:', questionId);
  
  // 1. Récupérer les anciennes réponses
  this.http.get<any[]>(`/api/questionAnswers/by-question/${questionId}`).subscribe({
    next: (oldQuestionAnswers) => {
      if (oldQuestionAnswers.length === 0) {
        // Pas d'anciennes réponses, simplement sauvegarder les nouvelles
        this.saveAnswersForQuestion(questionId, newAnswers, callback);
        return;
      }
      
      // 2. Récupérer les IDs des NmAnswers à supprimer
      let nmAnswerIds: number[] = [];
      let qaCount = 0;
      
      oldQuestionAnswers.forEach(qa => {
        // Récupérer les détails de chaque QuestionAnswers pour avoir l'ID du NmAnswers
        this.http.get<any>(`/api/questionAnswers/${qa.id}`).subscribe({
          next: (qaDetail) => {
            if (qaDetail.nmAnswers && qaDetail.nmAnswers.id) {
              nmAnswerIds.push(qaDetail.nmAnswers.id);
            }
            qaCount++;
            
            if (qaCount === oldQuestionAnswers.length) {
              // 3. Supprimer les QuestionAnswers
              this.http.delete(`/api/questionAnswers/question/${questionId}`).subscribe({
                next: () => {
                  console.log('✅ QuestionAnswers supprimées');
                  
                  // 4. Supprimer les NmAnswers
                  if (nmAnswerIds.length === 0) {
                    this.saveAnswersForQuestion(questionId, newAnswers, callback);
                  } else {
                    let deletedNmCount = 0;
                    nmAnswerIds.forEach(nmId => {
                      this.http.delete(`/api/nmAnswers/${nmId}`).subscribe({
                        next: () => {
                          deletedNmCount++;
                          console.log(`✅ NmAnswers ${nmId} supprimée (${deletedNmCount}/${nmAnswerIds.length})`);
                          if (deletedNmCount === nmAnswerIds.length) {
                            this.saveAnswersForQuestion(questionId, newAnswers, callback);
                          }
                        },
                        error: (err) => {
                          console.error(`❌ Erreur suppression NmAnswers ${nmId}:`, err);
                          deletedNmCount++;
                          if (deletedNmCount === nmAnswerIds.length) {
                            this.saveAnswersForQuestion(questionId, newAnswers, callback);
                          }
                        }
                      });
                    });
                  }
                },
                error: (err) => {
                  console.error('❌ Erreur suppression QuestionAnswers:', err);
                  this.saveAnswersForQuestion(questionId, newAnswers, callback);
                }
              });
            }
          },
          error: (err) => {
            console.error(`❌ Erreur récupération QuestionAnswers ${qa.id}:`, err);
            qaCount++;
            if (qaCount === oldQuestionAnswers.length) {
              // Fallback: supprimer directement
              this.http.delete(`/api/questionAnswers/question/${questionId}`).subscribe({
                next: () => {
                  this.saveAnswersForQuestion(questionId, newAnswers, callback);
                },
                error: () => {
                  this.saveAnswersForQuestion(questionId, newAnswers, callback);
                }
              });
            }
          }
        });
      });
    },
    error: (err) => {
      console.error('❌ Erreur récupération des réponses:', err);
      this.saveAnswersForQuestion(questionId, newAnswers, callback);
    }
  });
}


deleteAnswersForQuestion(questionId: number, callback: () => void): void {
  console.log('🔍 Suppression complète des réponses pour la question:', questionId);
  
  // 🔥 Utiliser l'endpoint full qui supprime tout
  this.http.delete(`/api/questionAnswers/question/${questionId}/full`).subscribe({
    next: () => {
      console.log('✅ Toutes les réponses et NmAnswers supprimées avec succès');
      callback();
    },
    error: (err) => {
      console.error('❌ Erreur suppression complète:', err);
      // Fallback: essayer la suppression normale
      this.http.delete(`/api/questionAnswers/question/${questionId}`).subscribe({
        next: () => {
          console.log('✅ QuestionAnswers supprimées (fallback)');
          callback();
        },
        error: () => callback()
      });
    }
  });
}


saveAnswersForQuestion(questionId: number, answers: any[], callback: () => void): void {
  if (!questionId) {
    console.error('❌ ID de question invalide');
    callback();
    return;
  }
  
  if (answers.length === 0) {
    callback();
    return;
  }
  
  let completed = 0;
  const total = answers.length;
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`📝 Sauvegarde de ${total} réponse(s) pour la question ${questionId}`);
  
  answers.forEach((answer, index) => {
    // 🔥 CRÉER NmAnswers D'ABORD
    const nmAnswersData = {
      code: answer.code || `ANS_${Date.now()}_${index}`,
      libelle: answer.libelle,
      libelleEn: answer.libelleEn || '',
      reference: answer.reference || '',
      dtUpdate: today
    };
    
    console.log(`📤 [${index + 1}/${total}] Création NmAnswers:`, nmAnswersData);
    
    this.http.post('/api/nmAnswers', nmAnswersData).subscribe({
      next: (nmAnswer: any) => {
        const nmAnswerId = nmAnswer.id;
        
        if (!nmAnswerId) {
          console.error(`❌ [${index + 1}/${total}] Pas d'ID retourné`);
          completed++;
          if (completed === total) callback();
          return;
        }
        
        console.log(`✅ [${index + 1}/${total}] NmAnswers créée, ID: ${nmAnswerId}`);
        
        // 🔥 PRÉPARER LES CONDITIONS
        const condiQuestionIds = (answer.condiQuestion || []).map((q: any) => q.id).filter((id: number) => id);
        const condiSectionIds = (answer.condiSections || []).map((s: any) => s.id).filter((id: number) => id);
        
        // 🔥 CRÉER QuestionAnswers APRÈS
        const questionAnswersData = {
          isConditionnel: (condiQuestionIds.length > 0 || condiSectionIds.length > 0),
          dtUpdate: today,
          question: { id: questionId },
          nmAnswers: { id: nmAnswerId },
          condiQuestionIds: condiQuestionIds,
          condiSectionIds: condiSectionIds
        };
        
        console.log(`📤 [${index + 1}/${total}] Création QuestionAnswers avec conditions:`, questionAnswersData);
        
        this.http.post('/api/questionAnswers', questionAnswersData).subscribe({
          next: () => {
            completed++;
            console.log(`✅ [${index + 1}/${total}] Réponse sauvegardée (${completed}/${total})`);
            if (completed === total) {
              console.log('🎯 Toutes les réponses sauvegardées');
              callback();
            }
          },
          error: (err) => {
            console.error(`❌ [${index + 1}/${total}] Erreur QuestionAnswers:`, err);
            completed++;
            if (completed === total) callback();
          }
        });
      },
      error: (err) => {
        console.error(`❌ [${index + 1}/${total}] Erreur création NmAnswers:`, err);
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


  async deleteQuestion(questionId: number): Promise<void> {
  // Rechercher la question pour afficher son titre
  let questionTitle = '';
  let found = false;
  
  for (const section of this.sections) {
    if (section.questions) {
      const q = section.questions.find(q => q.id === questionId);
      if (q) {
        questionTitle = q.titleFr;
        found = true;
        break;
      }
    }
    if (section.children) {
      for (const child of section.children) {
        if (child.questions) {
          const q = child.questions.find(q => q.id === questionId);
          if (q) {
            questionTitle = q.titleFr;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
  }
  
  // 🔥 Confirmation
  const confirmed = await this.confirmService.show({
    title: '🗑️ Confirmation de suppression',
    message: `Supprimer la question "${questionTitle || '#' + questionId}" ?\n\n⚠️ Attention : Toutes les réponses associées seront également supprimées. Cette action est définitive.`,
    confirmText: 'Oui, supprimer',
    cancelText: 'Non, annuler',
    type: 'danger'
  });
  
  if (!confirmed) {
    this.alertService.showInfo('Annulé', 'La suppression a été annulée.');
    return;
  }
  
  if (!this.survey) return;
  
  this.loading = true;
  
  // 🔥 NOUVEAU : D'abord nettoyer les relations problématiques
  this.http.delete(`/api/questionAnswers/question/${questionId}/full`).subscribe({
    next: () => {
      console.log('✅ Réponses nettoyées avec succès');
      
      // Ensuite supprimer la question
      this.http.delete(`/api/question/${questionId}`).subscribe({
        next: () => {
          this.alertService.showSuccess(
            '✓ Question supprimée', 
            `La question "${questionTitle || '#' + questionId}" a été supprimée avec succès.`
          );
          this.loadSurvey(this.survey!.id!);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur suppression question:', err);
          this.alertService.showError(
            '✗ Erreur', 
            err.error?.message || 'Une erreur est survenue lors de la suppression de la question.'
          );
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: (err) => {
      console.error('Erreur nettoyage réponses:', err);
      // Même en cas d'erreur, on essaie de supprimer la question
      this.http.delete(`/api/question/${questionId}`).subscribe({
        next: () => {
          this.alertService.showSuccess('✓ Question supprimée', `La question a été supprimée.`);
          this.loadSurvey(this.survey!.id!);
          this.cdr.detectChanges();
        },
        error: (err2) => {
          console.error('Erreur suppression question:', err2);
          this.alertService.showError('✗ Erreur', 
        err.error?.message || 'Une erreur est survenue lors de la suppression de la question.',
         err.error?.details
      );
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  });
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
  const codesWithAnswers = ['CHECKBOX', 'LIST', 'RADIO', 'MULTI_SELECT','SELECT'];
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
// Vérifier si une réponse a des conditions
hasConditions(answer: any): boolean {
  return (answer.condiQuestion && answer.condiQuestion.length > 0) ||
         (answer.condiSections && answer.condiSections.length > 0);
}

// Récupérer le code du type de question
getQuestionTypeCode(typeId: number): string {
  const type = this.questionTypes.find(t => t.id === typeId);
  return type?.code || '';
}

// Récupérer les questions disponibles pour les conditions (exclure la question courante)
getAvailableQuestionsForCondition(currentAnswer: any): any[] {
  const allQuestions: any[] = [];
  
  this.sections.forEach(section => {
    if (section.questions) allQuestions.push(...section.questions);
    if (section.children) {
      section.children.forEach(child => {
        if (child.questions) allQuestions.push(...child.questions);
      });
    }
  });
  
  // Exclure la question en cours d'édition
  return allQuestions.filter(q => q.id !== this.editingQuestion?.id);
}

// Récupérer toutes les sections disponibles
getAvailableSectionsForCondition(): any[] {
  const allSections: any[] = [];
  
  this.sections.forEach(section => {
    allSections.push(section);
    if (section.children) allSections.push(...section.children);
  });
  
  return allSections;
}


// Ajouter une condition à une réponse
// Ajouter une condition à une réponse
addConditionToAnswer(answerIndex: number): void {
  const answerControl = this.getAnswersArray().at(answerIndex);
  const answer = answerControl?.value;
  const answerId = answer?.id;
  const type = this.tempConditionType[answerIndex];
  const itemId = this.tempConditionItemId[answerIndex];
  
  console.log('🔍 addConditionToAnswer - Paramètres:', { answerId, itemId, type, answerIndex });
  
  if (!answerId || !itemId || !type) {
    console.error('❌ Conditions manquantes');
    this.alertService.showError('Erreur', 'Veuillez sélectionner un type et un élément');
    return;
  }
  
  const url = type === 'question'
    ? `/api/questionAnswers/${answerId}/add-condi-question/${itemId}`
    : `/api/questionAnswers/${answerId}/add-condi-section/${itemId}`;
  
  console.log('📤 Appel API:', url);
  
  this.http.put(url, {}).subscribe({
    next: (response: any) => {
      console.log('✅ Condition ajoutée, réponse:', response);
      
      // 🔥 Mettre à jour le formulaire localement
      const answerFormGroup = this.getAnswersArray().at(answerIndex);
      if (answerFormGroup) {
        if (type === 'question') {
          // 🔥 Récupérer la QUESTION ajoutée (CORRECTION ICI)
          this.http.get(`/api/question/${itemId}`).subscribe({
            next: (newQuestion: any) => {
              const currentQuestions = answerFormGroup.value.condiQuestion || [];
              answerFormGroup.patchValue({
                condiQuestion: [...currentQuestions, newQuestion]
              });
              console.log('✅ Question conditionnelle ajoutée au formulaire:', newQuestion.titleFr);
              this.alertService.showSuccess('Succès', 'Question conditionnelle ajoutée');
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('❌ Erreur récupération question:', err);
              this.alertService.showError('Erreur', 'Question ajoutée mais impossible de rafraîchir');
            }
          });
        } else if (type === 'section') {
          // Récupérer la section ajoutée
          this.http.get(`/api/section/${itemId}`).subscribe({
            next: (newSection: any) => {
              const currentSections = answerFormGroup.value.condiSections || [];
              answerFormGroup.patchValue({
                condiSections: [...currentSections, newSection]
              });
              console.log('✅ Section conditionnelle ajoutée au formulaire:', newSection.title);
              this.alertService.showSuccess('Succès', 'Section conditionnelle ajoutée');
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('❌ Erreur récupération section:', err);
              this.alertService.showError('Erreur', 'Section ajoutée mais impossible de rafraîchir');
            }
          });
        }
      }
      
      // Réinitialiser les sélecteurs
      this.tempConditionType[answerIndex] = undefined as any;
      this.tempConditionItemId[answerIndex] = null;
    },
    error: (err) => {
      console.error('❌ Erreur ajout condition:', err);
      this.alertService.showError('Erreur', err.error || 'Impossible d\'ajouter la condition');
    }
  });
}

// Supprimer une condition d'une réponse
removeConditionFromAnswer(answerIndex: number, type: 'question' | 'section', itemId: number): void {
  const answerControl = this.getAnswersArray().at(answerIndex);
  const answer = answerControl?.value;
  const answerId = answer?.id;
  
  if (!answerId) return;
  
  const url = type === 'question'
    ? `/api/questionAnswers/${answerId}/remove-condi-question/${itemId}`
    : `/api/questionAnswers/${answerId}/remove-condi-section/${itemId}`;
  
  this.http.delete(url).subscribe({
    next: () => {
      console.log('✅ Condition supprimée');
      this.reloadSurvey();
    },
    error: (err) => console.error('❌ Erreur:', err)
  });
}

// Recharger le survey
reloadSurvey(): void {
  if (this.survey?.id) {
    this.loadSurvey(this.survey.id);
  }
}

// Ajouter ces méthodes dans SurveyDetailComponent

onConditionItemChange(answerIndex: number, value: string): void {
  this.tempConditionItemId[answerIndex] = value ? +value : null;
}

// Corriger onConditionTypeChange pour stocker le type
onConditionTypeChange(answerIndex: number, type: string): void {
  if (type === 'question' || type === 'section') {
    this.tempConditionType[answerIndex] = type;
  } else {
    delete this.tempConditionType[answerIndex];
  }
  this.tempConditionItemId[answerIndex] = null;
}

loadQuestionAndRefresh(questionId: number): void {
  console.log('🔄 Rechargement de la question:', questionId);
  
  this.http.get<Question>(`/api/question/${questionId}`).subscribe({
    next: (updatedQuestion) => {
      // Mettre à jour la question dans le survey
      this.updateQuestionInSurvey(updatedQuestion);
      
      // Recharger le survey complet pour mettre à jour l'affichage
      if (this.survey?.id) {
        this.loadSurvey(this.survey.id);
      }
    },
    error: (err) => {
      console.error('❌ Erreur rechargement question:', err);
      // Fallback: recharger tout le survey
      this.reloadSurvey();
    }
  });
}

updateQuestionInSurvey(updatedQuestion: Question): void {
  // Parcourir toutes les sections pour trouver et mettre à jour la question
  for (const section of this.sections) {
    if (section.questions) {
      const index = section.questions.findIndex(q => q.id === updatedQuestion.id);
      if (index !== -1) {
        section.questions[index] = updatedQuestion;
        break;
      }
    }
    if (section.children) {
      for (const child of section.children) {
        if (child.questions) {
          const index = child.questions.findIndex(q => q.id === updatedQuestion.id);
          if (index !== -1) {
            child.questions[index] = updatedQuestion;
            break;
          }
        }
      }
    }
  }
}
}