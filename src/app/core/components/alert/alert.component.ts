// src/app/core/components/alert/alert.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="alert" class="alert-container animate-slide-in" [ngClass]="'alert-' + alert.type">
      <div class="alert-content">
        <div class="alert-icon">
          <i class="bi" [ngClass]="getIcon()"></i>
        </div>
        <div class="alert-text">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-message">{{ alert.message }}</div>
          <div *ngIf="alert.details" class="alert-details-toggle" (click)="toggleDetails()">
            <i class="bi" [class.bi-chevron-down]="!showDetails" [class.bi-chevron-up]="showDetails"></i>
            Détails
          </div>
          <div *ngIf="showDetails && alert.details" class="alert-details">
            {{ alert.details }}
          </div>
        </div>
        
        <button class="alert-close" (click)="close()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="alert-progress" [style.animationDuration]="(alert.duration || 4000) + 'ms'"></div>
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
     :host-context(.dark-mode) .alert-confirm-modal .modal-content {
  background-color: #1e293b;
  border-left-color: #f97316;
}
:host-context(.dark-mode) .alert-title {
  color: #f97316;
}
:host-context(.dark-mode) .alert-message {
  color: #cbd5e1;
}
:host-context(.dark-mode) .alert-icon.warning {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

:host-context(.dark-mode) .alert-icon.warning {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}
  .alert-confirm-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.alert-confirm-modal .modal-content {
  border: none;
  border-left: 4px solid #dc3545;
}
.alert-confirm-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.alert-icon.warning {
  width: 40px;
  height: 40px;
  background: rgba(220, 53, 69, 0.15);
  border-radius: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  font-size: 1.3rem;
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
export class AlertComponent implements OnInit, OnDestroy {
  alert: Alert | null = null;
  showDetails = false;
  private sub: Subscription | null = null;
 
  constructor(private alertService: AlertService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.alertService.alerts$.subscribe(alert => {
      // schedule in macrotask so assignment happens outside current CD cycle
      setTimeout(() => {
        this.alert = alert;
        this.showDetails = false;
        this.cd.markForCheck();
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  close(): void {
    this.alertService.clear();
  }
}