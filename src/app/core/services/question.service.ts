import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, NmTypeQuest } from '../models/survey';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = '/api/question';
  private typeUrl = '/api/nmTypeQuest';  // ✅ Modifier ici : camelCase

  constructor(private http: HttpClient) { }

  getQuestionsBySectionId(sectionId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/section/${sectionId}`);
  }

  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`);
  }

  getQuestionTypes(): Observable<NmTypeQuest[]> {
    return this.http.get<NmTypeQuest[]>(this.typeUrl);  // Maintenant /api/nmTypeQuest
  }

  createQuestion(question: Question): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  updateQuestion(id: number, question: Question): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}