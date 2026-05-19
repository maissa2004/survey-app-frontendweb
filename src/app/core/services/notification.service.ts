
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment.prod';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceId: number;
  surveyLibelle: string;
  enqueteurNom: string;
  submissionDate: string;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';
  private socket: Socket | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initWebSocket();
  }

  private initWebSocket(): void {
    try {
      this.socket = io(environment.socketUrl, {
        path: '/socket.io',
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('Notification WebSocket connecté');
        this.joinNotificationRoom();
      });

      this.socket.on('newNotification', (notification: Notification) => {
        console.log('Nouvelle notification reçue:', notification);
        this.addNotification(notification);
      });
    } catch (error) {
      console.error('Erreur WebSocket notification:', error);
    }
  }

  private joinNotificationRoom(): void {
    if (this.socket) {
      this.socket.emit('joinNotificationRoom', { role: 'admin' });
    }
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/unread`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread/count`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteAllNotifications(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear-all`);
  }

  loadNotifications(): void {
    this.getAllNotifications().subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      },
      error: (err) => console.error('Erreur chargement notifications:', err)
    });
  }

  private updateUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => this.unreadCountSubject.next(response.count),
      error: (err) => console.error('Erreur comptage non lues:', err)
    });
  }

  private addNotification(notification: Notification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }

  refresh(): void {
    this.loadNotifications();
  }
}