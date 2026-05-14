import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  totalEnqueteurs: number;
  totalSurveys: number;
}

export interface DailySubmissions {
  date: string;
  count: number;
}

export interface SurveyPerSession {
  surveyLibelle: string;
  sessionCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private apiUrl = '/api/admin/stats';

  constructor(private http: HttpClient) {}

  getOverallStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/overall`);
  }

  getSubmissionsPerDay(days: number = 7): Observable<DailySubmissions[]> {
    return this.http.get<DailySubmissions[]>(`${this.apiUrl}/submissions-per-day?days=${days}`);
  }

  getSurveysPerSession(): Observable<SurveyPerSession[]> {
    return this.http.get<SurveyPerSession[]>(`${this.apiUrl}/surveys-per-session`);
  }

  getRecentSubmissions(limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recent-submissions?limit=${limit}`);
  }

  getRealTimeStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/realtime`);
  }
}