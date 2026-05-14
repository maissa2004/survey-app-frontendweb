import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>('/api/auth/users');
  }
}