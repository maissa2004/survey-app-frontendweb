import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Submission {
  id: number;
  surveyId: number;
  surveyLibelle: string;
  userId: number;
  username: string;
  submissionDate: string;
  status: string;
  validationComment?: string;
  validatedByUsername?: string;
  validatedAt?: string;
  answers: AnswerDetail[];
}

export interface AnswerDetail {
  id: number;
  codeQuestion: string;
  questionText?: string;
  value: string;
  referenceCode?: string;
  fileName?: string;
  fileType?: string;
  selectedOptions?: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminAnswerService {
  private api = '/api/admin/answers';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getSubmissions(filters: any, page: number, size: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (filters.surveyId) params = params.set('surveyId', filters.surveyId);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.validationDate) params = params.set('validationDate', filters.validationDate);
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.api}/submissions`, { params, headers });
  }

  getSubmissionDetail(id: number): Observable<Submission> {
    const headers = this.getAuthHeaders();
    return this.http.get<Submission>(`${this.api}/submissions/${id}`, { headers });
  }

  validate(id: number, comment: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.put<void>(`${this.api}/submissions/${id}/validate`, { comment }, { headers });
  }

  reject(id: number, comment: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.put<void>(`${this.api}/submissions/${id}/reject`, { comment }, { headers });
  }

//  batchValidate(ids: number[], comment: string): Observable<void> {
//      console.log('batchValidate appelé avec ids:', ids, 'comment:', comment);
//      const token = this.authService.getToken();
//  console.log('Token utilisé:', token);
//  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
//  return this.http.put<void>(`${this.api}/submissions/batch/validate`, { ids, comment }, { headers });
//}


//batchReject(ids: number[], comment: string): Observable<void> {
//  const headers = this.getAuthHeaders();
//    return this.http.put<void>(`${this.api}/submissions/batch/reject`, { ids, comment }, { headers });
//}

downloadFile(answerId: number): Observable<Blob> {
  const headers = this.getAuthHeaders();
    return this.http.get(`${this.api}/${answerId}/file`, { headers, responseType: 'blob' });
}

 // exportCsv(filters: any): Observable<Blob> {
 //   let params = new HttpParams();
  //  if (filters.surveyId) params = params.set('surveyId', filters.surveyId);
//    if (filters.userId) params = params.set('userId', filters.userId);
  //  if (filters.status) params = params.set('status', filters.status);
  //  if (filters.validationDate) params = params.set('validationDate', filters.validationDate);
  //  return this.http.get(`${this.api}/submissions/export/csv`, { params, responseType: 'blob' });
 // }
 // exportExcel(filters: any): Observable<Blob> {
  //let params = new HttpParams();
 // if (filters.surveyId) params = params.set('surveyId', filters.surveyId);
  //if (filters.userId) params = params.set('userId', filters.userId);
  //if (filters.status) params = params.set('status', filters.status);
 // if (filters.validationDate) params = params.set('validationDate', filters.validationDate);
 //     const headers = this.getAuthHeaders();

 // return this.http.get(`${this.api}/submissions/export/excel`, { params, responseType: 'blob' });
//}

exportCsvForSubmission(submissionId: number): Observable<Blob> {
  return this.http.get(`${this.api}/submissions/${submissionId}/export/csv`, { responseType: 'blob' });
}

exportExcelForSubmission(submissionId: number): Observable<Blob> {
  return this.http.get(`${this.api}/submissions/${submissionId}/export/excel`, { responseType: 'blob' });
}


  getStats(surveyId: number): Observable<any> {
        const headers = this.getAuthHeaders();
    return this.http.get(`${this.api}/stats/${surveyId}`, { headers });
  }
}