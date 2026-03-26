import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Section } from '../models/survey';

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private apiUrl = '/api/section';

  constructor(private http: HttpClient) { }

  getSectionsBySurveyId(surveyId: number): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.apiUrl}/survey/${surveyId}`);
  }

  getSectionById(id: number): Observable<Section> {
    return this.http.get<Section>(`${this.apiUrl}/${id}`);
  }

  createSection(section: Section): Observable<Section> {
    return this.http.post<Section>(this.apiUrl, section);
  }

  updateSection(id: number, section: Section): Observable<Section> {
    return this.http.put<Section>(`${this.apiUrl}/${id}`, section);
  }

  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}