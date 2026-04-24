// src/app/core/components/confirm/confirm.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="options" class="confirm-overlay animate-fade-in" (click)="onCancel()">
      <div class="confirm-modal animate-scale-in" (click)="$event.stopPropagation()">
        <div class="confirm-icon" [ngClass]="'confirm-' + (options.type || 'warning')">
          <i class="bi" [ngClass]="getIcon()"></i>
        </div>
        <h3 class="confirm-title">{{ options.title }}</h3>
        <p class="confirm-message">{{ options.message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" (click)="onCancel()">
            <i class="bi bi-x-lg me-1"></i> {{ options.cancelText || 'Annuler' }}
          </button>
          <button class="btn-confirm" [ngClass]="'btn-' + (options.type || 'warning')" (click)="onConfirm()">
            <i class="bi bi-check-lg me-1"></i> {{ options.confirmText || 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .confirm-modal {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      min-width: 320px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .confirm-icon {
      width: 70px;
      height: 70px;
      border-radius: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
    }

    .confirm-danger {
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
    }

    .confirm-warning {
      background: rgba(255, 193, 7, 0.15);
      color: #ffc107;
    }

    .confirm-info {
      background: rgba(23, 162, 184, 0.15);
      color: #17a2b8;
    }

    .confirm-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #001f3f;
      margin-bottom: 0.75rem;
    }

    .confirm-message {
      color: #6c757d;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .confirm-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-cancel, .btn-confirm {
      padding: 0.6rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-cancel {
      background: #f8f9fa;
      color: #6c757d;
    }

    .btn-cancel:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
      transform: translateY(-1px);
    }

    .btn-warning {
      background: #ffc107;
      color: #001f3f;
    }

    .btn-warning:hover {
      background: #e0a800;
      transform: translateY(-1px);
    }

    .btn-info {
      background: #17a2b8;
      color: white;
    }

    .btn-info:hover {
      background: #138496;
      transform: translateY(-1px);
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
  `]
})
export class ConfirmComponent implements OnInit {
  options: ConfirmOptions | null = null;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.confirmService.confirm$.subscribe(options => {
      this.options = options;
    });
  }

  getIcon(): string {
    switch (this.options?.type) {
      case 'danger': return 'bi-exclamation-triangle-fill';
      case 'warning': return 'bi-exclamation-circle-fill';
      case 'info': return 'bi-question-circle-fill';
      default: return 'bi-exclamation-triangle-fill';
    }
  }

  onConfirm(): void {
    this.confirmService.resolve(true);
    this.options = null;
  }

  onCancel(): void {
    this.confirmService.resolve(false);
    this.options = null;
  }
}