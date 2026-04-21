// src/app/core/services/session-enqueteur.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SessionEnqueteur {
  id: number;
  idSessionSurvey: number;
  idUser: number;
  username: string;
  email: string;
  phone: string;
  idSession: number;
  idSurvey: number;
  surveyCode: string;
  surveyLibelle: string;
  dateAffectation: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionEnqueteurService {
  private apiUrl = '/api/sessions/enqueteurs';

  constructor(private http: HttpClient) {}

  // 🔥 AJOUTER CETTE MÉTHODE - Récupérer les enquêteurs par session_survey
  getEnqueteursBySessionSurvey(sessionSurveyId: number): Observable<SessionEnqueteur[]> {
    return this.http.get<SessionEnqueteur[]>(`${this.apiUrl}/session-survey/${sessionSurveyId}`);
  }

  getEnqueteursBySession(sessionId: number): Observable<SessionEnqueteur[]> {
    return this.http.get<SessionEnqueteur[]>(`${this.apiUrl}/session/${sessionId}`);
  }

  getAvailableEnqueteurs(sessionSurveyId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/session-survey/${sessionSurveyId}/available`);
  }

  assignEnqueteur(sessionSurveyId: number, userId: number): Observable<SessionEnqueteur> {
    const body = {
      idSessionSurvey: sessionSurveyId,
      idUser: userId
    };
    return this.http.post<SessionEnqueteur>(`${this.apiUrl}/assign`, body);
  }

  // Dans session-enqueteur.service.ts
removeEnqueteur(sessionSurveyId: number, userId: number): Observable<void> {
  console.log('Appel API DELETE:', `${this.apiUrl}/session-survey/${sessionSurveyId}/user/${userId}`);
  return this.http.delete<void>(`${this.apiUrl}/session-survey/${sessionSurveyId}/user/${userId}`);
}
  
}