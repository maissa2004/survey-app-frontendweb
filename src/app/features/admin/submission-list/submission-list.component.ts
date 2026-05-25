import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAnswerService, Submission } from '../../../core/services/admin-answer.service';
import { SurveyService } from '../../../core/services/survey.service';
import { UserService } from '../../../core/services/user.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AlertService } from '../../../core/services/alert.service';
import { User } from '../../../core/services/session-enqueteur.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service'; 
import { ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submission-list.component.html',
  styleUrls: ['./submission-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmissionListComponent implements OnInit {
  
  submissions: Submission[] = [];
  loading = false;
  loadingAction = false;      
  totalElements = 0;
  totalPages = 0;

  page = 0;
  displaySize = 20;
  filters = {
    surveyId: null as number | null,
    userId: null as number | null,
    status: '',
    validationDate: ''
  };
  surveys: any[] = [];
  users: User[] = [];
  selectedSubmission: Submission | null = null;
  showDetailModal = false;
  comment = '';

  // Batch selection
//  selectedIds = new Set<number>();
//  showBatchModal = false;
//  batchComment = '';

  constructor(
      private cdr: ChangeDetectorRef,

    private adminService: AdminAnswerService,
    private surveyService: SurveyService,
    private userService: UserService,
    private confirm: ConfirmService,
    private alert: AlertService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSurveysAndUsers();
    this.loadSubmissions();
  }

  loadSurveysAndUsers() {
    this.surveyService.getAllSurveys().subscribe(data => this.surveys = data);
    this.userService.getAllUsers().subscribe(data => this.users = data.filter(u => u.role === 'enqueteur'));
  }

  async loadAllSubmissionsRecursively(currentPage:number = 0, accumulator: Submission[] = []): Promise<Submission[]> {
  const res = await this.adminService.getSubmissions(this.filters, currentPage).toPromise();
  const newAcc = [...accumulator, ...res.content];
  //// Si la page est pleine, il y a probablement une page suivante
 if (res.content.length === 20) {
    return this.loadAllSubmissionsRecursively(currentPage + 1, newAcc);
  }
  return newAcc;
}


  loadSubmissions() {
    this.loading = true;
     this.loadAllSubmissionsRecursively(0, [])
      .then(allSubmissions => {
        allSubmissions.sort((a, b) =>
          new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
        );

        this.totalElements = allSubmissions.length;
        this.totalPages = Math.ceil(this.totalElements / this.displaySize);

        const start = this.page * this.displaySize;
      this.submissions = allSubmissions.slice(start, start + this.displaySize);
        this.loading = false;
        setTimeout(() =>this.cdr.markForCheck()); // détection de changement auto
        window.scrollTo({ top: 0, behavior: 'smooth' });
              })
      .catch(err => {
                this.loading = false;
                setTimeout(() =>this.cdr.markForCheck());

                console.error('❌ Erreur lors du chargement (Erreur API):', err);
        this.alert.showError('Erreur', err.error?.message || 'Impossible de charger les soumissions',err.error?.message || err.message);
    
            });   
             console.log('🔍 Chargement des soumissions avec filtres :', this.filters, 'page', this.page);

  }
  
  onFilter() {
    this.page = 0;
    // this.selectedIds.clear();
    this.loadSubmissions();
  }
  goToPreviousPage() {
    if (this.page > 0) {
      this.page--;
      this.loadSubmissions();
    }
  }

  goToNextPage() {
    if (this.page + 1 < this.totalPages) {
      this.page++;
      this.loadSubmissions();
    }
  }
 // refresh(): void {
  //  this.loadSubmissions();
 // }


  resetFilters() {
    this.filters = { surveyId: null, userId: null, status: '', validationDate: '' };
    this.onFilter();
  }
  trackById(index: number, item: Submission): number {
  return item.id;
}

  exportCsv(submissionId:number) {
    this.adminService.exportCsvForSubmission(submissionId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =`submission_${submissionId}_details_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.alert.showSuccess('Export', `Détails de la soumission #${submissionId} exportés en CSV`);
  });
  }

  exportExcel(submissionId: number) {
    this.adminService.exportExcelForSubmission(submissionId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =`submission_${submissionId}_details_${new Date().toISOString()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.alert.showSuccess('Export', `Détails de la soumission #${submissionId} exportés en Excel`);
    });
  }

  viewDetail(submission: Submission) {
    this.adminService.getSubmissionDetail(submission.id).subscribe({
      next: (data) => {
        this.selectedSubmission = data;
        this.comment = data.validationComment || '';
        this.showDetailModal = true;
      },
      error: (err) => this.alert.showError('Erreur', err.error?.message || 'Impossible de charger le détail', err.error?.message || err.message)
    });
  }
  viewImage(answerId: number, fileName: string) {
  this.adminService.downloadFile(answerId).subscribe(blob => {
    const url = URL.createObjectURL(blob);
    window.open(url); // or set as img src
    URL.revokeObjectURL(url);
  });
}

  async validateSingle() {
    if (!this.selectedSubmission) return;
    const confirmed = await this.confirm.show({
      title: 'Validation',
      message: `Valider cette soumission ?`,
      confirmText: 'Valider',
      cancelText: 'Annuler',
      type: 'info'
    });
    if (!confirmed) return;
    this.loadingAction = true;
    this.adminService.validate(this.selectedSubmission.id, this.comment).subscribe({
      next: () => {
        this.loadingAction = false;
        this.alert.showSuccess('Validée', 'Soumission validée');
        this.loadSubmissions();
        this.closeModal();
      },
      error: (err) => {
        this.loadingAction = false;
        this.alert.showError('Erreur', err.error?.message || 'Échec de la validation');
      }
    });
  }


  async rejectSingle() {
    if (!this.selectedSubmission) return;
    if (!this.comment.trim()) {
      this.alert.showWarning('Commentaire requis', 'Veuillez saisir un commentaire de rejet');
      return;
    }
    const confirmed = await this.confirm.show({
      title: 'Rejet',
      message: `Rejeter cette soumission ?`,
      confirmText: 'Rejeter',
      cancelText: 'Annuler',
      type: 'danger'
    });
    if (!confirmed) return;
    this.loadingAction = true;
    this.adminService.reject(this.selectedSubmission.id, this.comment).subscribe({
      next: () => {
        this.loadingAction = false;
        this.alert.showSuccess('Rejetée', 'Soumission rejetée');
        this.loadSubmissions();
        this.closeModal();
      },
      error: (err) => {
        this.loadingAction = false;
        this.alert.showError('Erreur', err.error?.message || 'Échec du rejet');
      }
    });
  }
  // Batch actions
 // toggleSelectAll(event: any) {
 //   if (event.target.checked) {
 //     this.submissions.forEach(s => this.selectedIds.add(s.id));
 //   } else {
 //     this.selectedIds.clear();
 //   }
 // }

  //toggleSelect(id: number, event: any) {
  //  if (event.target.checked) {
  //    this.selectedIds.add(id);
  //  } else {
  //    this.selectedIds.delete(id);
  //  }
  //}
//batchModalOpening = false;

//  openBatchModal() {
//    console.log('openBatchModal called, selectedIds size =', this.selectedIds.size);
//    if (this.selectedIds.size === 0) {
//      this.alert.showWarning('Aucune sélection', 'Veuillez sélectionner au moins une soumission');
//      return;
//    }
//    if (this.batchModalOpening) return;
//    this.batchModalOpening = true;
//    this.showBatchModal = true;
//    this.batchComment = '';
//    this.cdr.detectChanges(); 

//      setTimeout(() => this.batchModalOpening = false, 500);

//}

//  batchValidate() {
//      console.log('batchValidate called, ids =', Array.from(this.selectedIds), 'comment =', this.batchComment);
//    if (this.selectedIds.size === 0) return;
//    return this.adminService.batchValidate(Array.from(this.selectedIds), this.batchComment).subscribe({
//      next: () => {
//        this.alert.showSuccess('Lot validé', `${this.selectedIds.size} soumission(s) validée(s)`);
//        this.selectedIds.clear();
//        this.loadSubmissions();
//        this.showBatchModal = false;
//      },
//      error: (err) => this.alert.showError('Erreur', err.error?.message ||  'Échec de la validation par lot')
//    });
//  }

//  batchReject() {
//    console.log('batchReject called, ids =', Array.from(this.selectedIds), 'comment =', this.batchComment);
//    if (!this.batchComment.trim()) {
//      this.alert.showWarning('Commentaire requis', 'Veuillez saisir un commentaire pour le rejet');
//      return;
//    }
//    this.adminService.batchReject(Array.from(this.selectedIds), this.batchComment).subscribe({
//      next: () => {
//        this.alert.showSuccess('Lot rejeté', `${this.selectedIds.size} soumission(s) rejetée(s)`);
//        this.selectedIds.clear();
//        this.loadSubmissions();
//        this.showBatchModal = false;
//      },
//      error: (err) => this.alert.showError('Erreur', err.error?.message || 'Échec du rejet par lot')
//    });
//  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedSubmission = null;
    this.comment = '';
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'ACCEPTE': return 'badge bg-success';
      case 'REJETE': return 'badge bg-danger';
      default: return 'badge bg-warning text-dark';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACCEPTE': return 'Acceptée';
      case 'REJETE': return 'Rejetée';
      default: return 'En attente';
    }
  }

  getFileUrl(answerId: number): string {
    return `/api/admin/answers/${answerId}/file`;
  }
 downloadFile(answerId: number, fileName: string) {
  const token = this.authService.getToken(); // récupérer le token stocké
  if (!token) {
    this.alert.showError('Erreur', 'Vous n\'êtes pas authentifié');
    return;
  }
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  this.http.get(`/api/admin/answers/${answerId}/file`, { headers, responseType: 'blob' }).subscribe({
    
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    error: () => this.alert.showError('Erreur', 'Téléchargement impossible')
  });
}  onImageError(event: any) {
    event.target.src = 'assets/placeholder-image.png';
  }
  downloadFileFromBase64(base64: string | undefined, fileName: string | undefined, mimeType: string | undefined) {
  if (!base64 || !fileName) {
    this.alert.showError('Erreur', 'Fichier non disponible');
    return;
  }
let cleanBase64 = base64;
  if (base64.includes(',')) {
    cleanBase64 = base64.split(',')[1];
  }  try {
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    this.alert.showError('Erreur', 'Impossible de lire le fichier');
  }
}
// Retourne le libellé correct de la question, surtout pour DATE_RANGE
getQuestionText(answer: any): string {
  
  return answer.questionText ;
}
// Ajoutez cette méthode pour formater les plages de dates
// Remplacer la méthode formatDateRange par celle-ci
formatDateRange(answer: any): string {
  if (!answer.value) return 'Non renseigné';
  
  let value = answer.value;
  
  // Séparateur "|" (format typique du backend)
  if (value.includes('|')) {
    const parts = value.split('|');
    if (parts.length === 2) {
      const start = this.extractDate(parts[0]);
      const end = this.extractDate(parts[1]);
      return `de ${start} à ${end}`;
    }
  }
  
  // Séparateur virgule
  if (value.includes(',')) {
    const parts = value.split(',');
    if (parts.length === 2) {
      const start = this.extractDate(parts[0]);
      const end = this.extractDate(parts[1]);
      return `de ${start} à ${end}`;
    }
  }
  
  // Tentative de parsing JSON
  try {
    const range = JSON.parse(value);
    if (range.start && range.end) {
      const start = this.extractDate(range.start);
      const end = this.extractDate(range.end);
      return `de ${start} à ${end}`;
    }
    if (range.debut && range.fin) {
      const start = this.extractDate(range.debut);
      const end = this.extractDate(range.fin);
      return `de ${start} à ${end}`;
    }
    if (range.from && range.to) {
      const start = this.extractDate(range.from);
      const end = this.extractDate(range.to);
      return `de ${start} à ${end}`;
    }
  } catch(e) {
    // Ce n'est pas du JSON
  }
  
  // Si déjà lisible
  if (value.includes(' - ') || value.includes(' à ')) {
    return value;
  }
  
  return value;
}

// Méthode utilitaire pour extraire la date (avant le 'T')
private extractDate(dateStr: string): string {
  if (!dateStr) return '';
  // Prendre la partie avant le 'T' (supprime l'heure)
  const parts = dateStr.split('T');
  return parts[0];
}
}
