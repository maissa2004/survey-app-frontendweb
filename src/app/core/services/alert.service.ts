// src/app/core/services/alert.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string; 
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert | null>();
  alerts$ = this.alertSubject.asObservable();

  showSuccess(title: string, message: string, duration: number = 3000): void {
    // emit on next macrotask to avoid changing bindings during current CD cycle
    setTimeout(() => this.alertSubject.next({ type: 'success', title, message, duration }), 0);
    setTimeout(() => this.clear(), duration + 0);
  }

  showError(title: string, message: string, details?: string, duration: number = 5000): void {
    setTimeout(() => this.alertSubject.next({ type: 'error', title, message, details, duration }), 0);
    setTimeout(() => this.clear(), duration + 0);
  }

  showWarning(title: string, message: string, duration: number = 3000): void {
    setTimeout(() => this.alertSubject.next({ type: 'warning', title, message, duration }), 0);
    setTimeout(() => this.clear(), duration + 0);
  }

  showInfo(title: string, message: string, duration: number = 3000): void {
    setTimeout(() => this.alertSubject.next({ type: 'info', title, message, duration }), 0);
    setTimeout(() => this.clear(), duration + 0);
  }

  clear(): void {
    this.alertSubject.next(null);
  }
}