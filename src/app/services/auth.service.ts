import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = `${environment.apiUrl}/auth`;
  private tokenKey = 'sprtfit_token';
  currentUser$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    const t = this.getToken();
    if (t) {
      // decode minimal info (skip JWT decode lib for brevity)
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        this.currentUser$.next(payload);
      } catch (err) { }
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

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser$.next(null);
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAdmin() {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (user.role === 'admin') return true;
    // Optionally, if backend used ADMIN_EMAIL check, the token will contain email,
    // so this function will still work when that email matches.
    return false;
  }
}
