// src/app/core/services/confirm.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<ConfirmOptions | null>();
  private resultSubject = new Subject<boolean>();
  
  confirm$ = this.confirmSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  show(options: ConfirmOptions): Promise<boolean> {
    this.confirmSubject.next(options);
    return new Promise((resolve) => {
      const subscription = this.result$.subscribe(result => {
        resolve(result);
        subscription.unsubscribe();
        this.confirmSubject.next(null);
      });
    });
  }

  resolve(result: boolean): void {
    this.resultSubject.next(result);
  }
}