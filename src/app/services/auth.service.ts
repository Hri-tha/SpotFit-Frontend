import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
// auth.service.ts - IMPROVED to handle user name
export class AuthService {
  api = `${environment.apiUrl}/auth`;
  private tokenKey = 'sprtfit_token';
  currentUser$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    const t = this.getToken();
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        this.currentUser$.next(payload);
      } catch (err) { 
        console.error('Error parsing token:', err);
      }
    }
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.api}/login`, { email, password }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.currentUser$.next(res.user);
        }
      })
    );
  }

  register(userData: any) {
    return this.http.post<any>(`${this.api}/register`, userData).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.currentUser$.next(res.user);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser$.next(null);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserName(): string {
    const user = this.currentUser$.value;
    return user?.name || user?.email || 'User';
  }

  isAdmin(): boolean {
    const user = this.currentUser$.value;
    return user?.role === 'admin';
  }
}