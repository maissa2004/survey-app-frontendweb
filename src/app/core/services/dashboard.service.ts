// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalEnqueteurs: number;
  totalSurveys: number;
  totalSessions: number;
  totalSubmissions: number;
}

export interface DailySubmission {
  date: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SessionSurveys {
  sessionName: string;
  surveyCount: number;
}

export interface TopSurvey {
  surveyLibelle: string;
  submissionCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

  getSubmissionsPerDay(startDate?: string, endDate?: string): Observable<DailySubmission[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<DailySubmission[]>(`${this.apiUrl}/submissions-per-day`, { params });
}

  getSubmissionsByStatus(): Observable<StatusCount[]> {
    return this.http.get<StatusCount[]>(`${this.apiUrl}/submissions-by-status`);
  }

  getSurveysPerSession(): Observable<SessionSurveys[]> {
    return this.http.get<SessionSurveys[]>(`${this.apiUrl}/surveys-per-session`);
  }

  getTopSurveys(): Observable<TopSurvey[]> {
    return this.http.get<TopSurvey[]>(`${this.apiUrl}/top-surveys`);
  }


getHistoricalStats(date: string): Observable<DashboardStats> {
    let params = new HttpParams().set('date', date);
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/historical`, { params });
}
}