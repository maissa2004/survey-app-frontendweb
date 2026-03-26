import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Answer, NmAnswers } from '../models/survey';

@Injectable({
  providedIn: 'root'
})
export class AnswerService {
  private apiUrl = '/api/answer';
  private nmAnswersUrl = '/api/nm-answers';

  constructor(private http: HttpClient) { }

  getAnswersByQuestionId(questionId: number): Observable<Answer[]> {
    return this.http.get<Answer[]>(`${this.apiUrl}/question/${questionId}`);
  }

  getAnswerById(id: number): Observable<Answer> {
    return this.http.get<Answer>(`${this.apiUrl}/${id}`);
  }

  getNmAnswers(): Observable<NmAnswers[]> {
    return this.http.get<NmAnswers[]>(this.nmAnswersUrl);
  }

  createAnswer(answer: Answer): Observable<Answer> {
    return this.http.post<Answer>(this.apiUrl, answer);
  }

  updateAnswer(id: number, answer: Answer): Observable<Answer> {
    return this.http.put<Answer>(`${this.apiUrl}/${id}`, answer);
  }

  deleteAnswer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}