// src/app/core/components/notification-dropdown/notification-dropdown.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmOptions  } from '../../services/confirm.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <li class="nav-item dropdown" *ngIf="isBrowser && authService.isAuthenticated() && authService.isNormalAdmin()">
      <a class="nav-link dropdown-toggle text-white position-relative" 
         href="#" 
         role="button" 
         data-bs-toggle="dropdown" 
         aria-expanded="false"
         (click)="onDropdownOpen()">
        <i class="bi bi-bell-fill"></i>
        <span *ngIf="unreadCount > 0" class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end notification-dropdown">
        <li class="dropdown-header">
          <div class="d-flex justify-content-between align-items-center">
            <span>
              <i class="bi bi-bell-fill me-2"></i>
              Notifications
              <span *ngIf="unreadCount > 0" class="badge bg-orange ms-2">{{ unreadCount }} nouvelle(s)</span>
            </span>
            <div class="dropdown-actions">
              <button *ngIf="notifications.length > 0" class="btn-icon" (click)="markAllAsRead($event)" title="Tout marquer comme lu">
                <i class="bi bi-envelope-check"></i>
              </button>
              <button *ngIf="notifications.length > 0" class="btn-icon" (click)="clearAll($event)" title="Tout effacer">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </li>
        <li><hr class="dropdown-divider"></li>
        
        <!-- Liste des notifications -->
        <div class="notification-list" *ngIf="notifications.length > 0">
          <div *ngFor="let notif of notifications" 
               class="notification-item" 
               [class.unread]="!notif.read"
               (click)="onNotificationClick(notif)">
            <div class="notification-icon">
              <i class="bi bi-envelope-paper-fill"></i>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notif.title }}</div>
              <div class="notification-message">{{ notif.message }}</div>
              <div class="notification-time">
                <i class="bi bi-clock me-1"></i>
                {{ notif.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </div>
              <div class="notification-meta">
                <span class="badge bg-orange-light me-1">{{ notif.surveyLibelle }}</span>
                <span class="badge bg-secondary">{{ notif.enqueteurNom }}</span>
              </div>
            </div>
              <div class="notification-actions">
                <button class="notification-delete" (click)="deleteNotification(notif.id, $event)" title="Supprimer">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div class="notification-empty" *ngIf="notifications.length === 0">
          <i class="bi bi-bell-slash"></i>
          <p>Aucune notification</p>
        </div>
        
        <li><hr class="dropdown-divider" *ngIf="notifications.length > 0"></li>
        <li class="dropdown-footer" *ngIf="notifications.length > 0">
          <a class="dropdown-item text-center" [routerLink]="['/submissions']" (click)="closeDropdown()">
            <i class="bi bi-eye me-1"></i> Voir toutes les réponses
          </a>
        </li>
      </ul>
    </li>
  `,
  styles: [`
    .notification-badge {
      position: absolute;
      top: 0;
      right: -5px;
      background-color: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 0.15rem 0.35rem;
      font-size: 0.6rem;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    }

    .notification-dropdown {
      width: 380px;
      max-width: 90vw;
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .dropdown-header {
      padding: 1rem 1rem 0.5rem;
      background: linear-gradient(135deg, #001f3f, #0b2b4a);
      color: white;
    }

    .dropdown-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e9ecef;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background-color: #f8f9fa;
    }

    .notification-item.unread {
      background-color: #fff3e8;
    }

    .notification-item.unread::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #ff6b35;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #001f3f, #ff6b35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 0.85rem;
      color: #001f3f;
      margin-bottom: 0.25rem;
    }

    .notification-message {
      font-size: 0.75rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
      line-height: 1.4;
      word-break: break-word;
    }

    .notification-time {
      font-size: 0.65rem;
      color: #adb5bd;
      margin-bottom: 0.5rem;
    }

    .notification-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .notification-meta .badge {
      font-size: 0.65rem;
      padding: 0.2rem 0.5rem;
    }

    .bg-orange-light {
      background-color: #fff3e8;
      color: #ff6b35;
    }
      .notification-actions {
        flex-shrink: 0;
        margin-left: 0.5rem;
        display: flex;
        align-items: center;
      }

    .notification-delete {
      background: none;
      border: none;
      color: #adb5bd;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .notification-delete:hover {
      background-color: #ffe8e8;
      color: #dc3545;
    }

    .notification-empty {
      text-align: center;
      padding: 2rem;
      color: #adb5bd;
    }

    .notification-empty i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .notification-empty p {
      margin: 0;
      font-size: 0.85rem;
    }

    .dropdown-footer {
      padding: 0.5rem;
      background-color: #f8f9fa;
    }

    .dropdown-footer .dropdown-item {
      text-align: center;
      font-size: 0.8rem;
      color: #ff6b35;
    }

    .dropdown-footer .dropdown-item:hover {
      background-color: #fff3e8;
    }

    /* Dark mode */
    :host-context(.dark-mode) .notification-item {
      border-bottom-color: #334155;
    }

    :host-context(.dark-mode) .notification-item:hover {
      background-color: #334155;
    }

    :host-context(.dark-mode) .notification-item.unread {
      background-color: #2d1b0a;
    }

    :host-context(.dark-mode) .notification-title {
      color: #f1f5f9;
    }

    :host-context(.dark-mode) .notification-message {
      color: #9ca3af;
    }

    :host-context(.dark-mode) .notification-empty {
      color: #9ca3af;
    }

    :host-context(.dark-mode) .dropdown-footer {
      background-color: #1e293b;
    }

    :host-context(.dark-mode) .bg-orange-light {
      background-color: #2d1b0a;
      color: #ffb347;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isBrowser: boolean = true;
  private subscriptions: Subscription[] = [];
  alertService: any;

  // Rendre authService PUBLIC pour l'utiliser dans le template
  constructor(
    public authService: AuthService,  // 🔥 Changé de private à public
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser && this.authService.isNormalAdmin()) {
      this.loadNotifications();
      this.subscriptions.push(
        this.notificationService.notifications$.subscribe(notifications => {
          this.notifications = notifications;
          this.cdr.detectChanges();
        })
      );
      this.subscriptions.push(
        this.notificationService.unreadCount$.subscribe(count => {
          this.unreadCount = count;
          this.cdr.detectChanges();
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.notificationService.loadNotifications();
  }

  onDropdownOpen(): void {
    // Optionnel
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
        this.updateUnreadCount();
      });
    }
    this.router.navigate(['/submissions']);
    this.closeDropdown();
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
    next: () => {
      this.notifications.forEach(n => n.read = true);
      this.updateUnreadCount();
      this.alertService.showSuccess('Marquées comme lues', 'Toutes les notifications ont été lues.');
    },
    error: () => this.alertService.showError('Erreur', 'Opération impossible')
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id).subscribe({
    next: () => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.updateUnreadCount();
      this.alertService.showInfo('Notification supprimée', '', 2000);
    },
    error: () => {
      this.alertService.showError('Erreur', 'Impossible de supprimer cette notification');
    }
  });
  }

  clearAll(event: Event): void {
    event.stopPropagation();
      const options: ConfirmOptions = {
        title: 'Supprimer toutes les notifications',
        message: 'Êtes-vous sûr de vouloir supprimer toutes les notifications ?',
        type: 'danger',
        confirmText: 'Tout supprimer',
        cancelText: 'Annuler'
      };
  
  this.confirmService.show(options).then(confirmed => {
    if (confirmed) {
      this.notificationService.deleteAllNotifications().subscribe({
        next: () => {
          this.notifications = [];
          this.updateUnreadCount();
          this.alertService.showSuccess('Supprimées', 'Toutes les notifications ont été supprimées.');
          
        },
        error: () =>this.alertService.showError('Erreur', 'Impossible de supprimer')
        
      });
    }
  });
}
    
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  closeDropdown(): void {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
      const bsDropdown = (window as any).bootstrap?.Dropdown?.getInstance(dropdown);
      if (bsDropdown) bsDropdown.hide();
    }
  }
}