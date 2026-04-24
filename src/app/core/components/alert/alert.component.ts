// src/app/core/components/alert/alert.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="alert" class="alert-container animate-slide-in" [ngClass]="'alert-' + alert.type">
      <div class="alert-content">
        <div class="alert-icon">
          <i class="bi" [ngClass]="getIcon()"></i>
        </div>
        <div class="alert-text">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-message">{{ alert.message }}</div>
        </div>
        <button class="alert-close" (click)="close()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="alert-progress" [style.animationDuration]="(alert.duration || 3000) + 'ms'"></div>
    </div>
  `,
  styles: [`
    .alert-container {
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 320px;
      max-width: 450px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.2rem;
    }

    .alert-icon {
      width: 40px;
      height: 40px;
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }

    .alert-text {
      flex: 1;
    }

    .alert-title {
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }

    .alert-message {
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .alert-close {
      background: none;
      border: none;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 5px;
      border-radius: 8px;
      transition: all 0.2s;
      opacity: 0.6;
    }

    .alert-close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.05);
    }

    .alert-progress {
      height: 3px;
      width: 100%;
      animation: progress linear forwards;
    }

    /* Success */
    .alert-success {
      border-left: 4px solid #28a745;
    }
    .alert-success .alert-icon {
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
    }
    .alert-success .alert-title {
      color: #28a745;
    }
    .alert-success .alert-progress {
      background: #28a745;
    }

    /* Error */
    .alert-error {
      border-left: 4px solid #dc3545;
    }
    .alert-error .alert-icon {
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
    }
    .alert-error .alert-title {
      color: #dc3545;
    }
    .alert-error .alert-progress {
      background: #dc3545;
    }

    /* Warning */
    .alert-warning {
      border-left: 4px solid #ffc107;
    }
    .alert-warning .alert-icon {
      background: rgba(255, 193, 7, 0.15);
      color: #ffc107;
    }
    .alert-warning .alert-title {
      color: #ffc107;
    }
    .alert-warning .alert-progress {
      background: #ffc107;
    }

    /* Info */
    .alert-info {
      border-left: 4px solid #17a2b8;
    }
    .alert-info .alert-icon {
      background: rgba(23, 162, 184, 0.15);
      color: #17a2b8;
    }
    .alert-info .alert-title {
      color: #17a2b8;
    }
    .alert-info .alert-progress {
      background: #17a2b8;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    @media (max-width: 576px) {
      .alert-container {
        left: 20px;
        right: 20px;
        min-width: auto;
      }
    }
  `]
})
export class AlertComponent implements OnInit {
  alert: Alert | null = null;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.alerts$.subscribe(alert => {
      this.alert = alert;
    });
  }

  getIcon(): string {
    switch (this.alert?.type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  close(): void {
    this.alertService.clear();
  }
}