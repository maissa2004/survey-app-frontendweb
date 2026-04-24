// src/app/core/services/alert.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert | null>();
  alerts$ = this.alertSubject.asObservable();

  showSuccess(title: string, message: string, duration: number = 3000): void {
    this.alertSubject.next({ type: 'success', title, message, duration });
    setTimeout(() => this.clear(), duration);
  }

  showError(title: string, message: string, duration: number = 4000): void {
    this.alertSubject.next({ type: 'error', title, message, duration });
    setTimeout(() => this.clear(), duration);
  }

  showWarning(title: string, message: string, duration: number = 3000): void {
    this.alertSubject.next({ type: 'warning', title, message, duration });
    setTimeout(() => this.clear(), duration);
  }

  showInfo(title: string, message: string, duration: number = 3000): void {
    this.alertSubject.next({ type: 'info', title, message, duration });
    setTimeout(() => this.clear(), duration);
  }

  clear(): void {
    this.alertSubject.next(null);
  }
}