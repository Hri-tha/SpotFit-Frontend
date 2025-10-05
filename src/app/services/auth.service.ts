// auth.service.ts - FIXED with proper redirection
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router'; // Add Router import

declare var google: any;

@Injectable({ providedIn: 'root' })
export class AuthService {
  api = `${environment.apiUrl}/auth`;
  private tokenKey = 'spotfit_token';
  currentUser$ = new BehaviorSubject<any>(null);
  private googleInitialized = false;

  constructor(
    private http: HttpClient,
    private router: Router // Inject Router
  ) {
    this.initializeGoogleAuth();
    this.loadUserFromToken();
  }

  private loadUserFromToken() {
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

  private initializeGoogleAuth() {
    if (this.googleInitialized) return;
    
    if (typeof google !== 'undefined') {
      this.googleInitialized = true;
      return;
    }

    // Load Google SDK script dynamically
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.googleInitialized = true;
        console.log('Google SDK loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Google SDK');
      };
      document.head.appendChild(script);
    }
  }

  // Email/Password Login - STILL AVAILABLE
  login(email: string, password: string) {
    return this.http.post<any>(`${this.api}/login`, { email, password }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.currentUser$.next(res.user);
          this.redirectAfterLogin(res.user); // Add redirection
        }
      })
    );
  }

  // Register - STILL AVAILABLE
  register(userData: any) {
    return this.http.post<any>(`${this.api}/register`, userData).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.currentUser$.next(res.user);
          this.redirectAfterLogin(res.user); // Add redirection
        }
      })
    );
  }

  // Google Login - UPDATED with redirection
  googleLogin(credential: string) {
    return this.http.post<any>(`${this.api}/google`, { token: credential }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.currentUser$.next(res.user);
          this.redirectAfterLogin(res.user); // Add redirection
        }
      })
    );
  }

  // NEW: Handle redirection after successful login
  private redirectAfterLogin(user: any) {
    console.log('Redirecting after login for user:', user);
    
    if (user?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      // Get return URL from localStorage or default to home
      const returnUrl = localStorage.getItem('returnUrl') || '/';
      localStorage.removeItem('returnUrl'); // Clean up
      this.router.navigateByUrl(returnUrl);
    }
  }

  renderGoogleButton(element: HTMLElement): boolean {
    if (!this.isGoogleAvailable()) {
      console.error('Google SDK not loaded');
      return false;
    }

    try {
      google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
      return true;
    } catch (error) {
      console.error('Error rendering Google button:', error);
      return false;
    }
  }

  initializeGoogleOneTap(): boolean {
    if (!this.isGoogleAvailable()) {
      console.warn('Google SDK not loaded yet');
      return false;
    }

    try {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleGoogleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google One Tap not displayed');
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing Google One Tap:', error);
      return false;
    }
  }

  private handleGoogleCredentialResponse(response: any) {
    if (!response.credential) {
      console.error('No credential in Google response');
      return;
    }

    this.googleLogin(response.credential).subscribe({
      next: () => {
        console.log('Google login successful - redirection handled by service');
        // Redirection is now handled in the googleLogin method
      },
      error: (err) => {
        console.error('Google login failed:', err);
        alert('Google login failed: ' + (err.error?.message || 'Please try again.'));
      }
    });
  }

  isGoogleAvailable(): boolean {
    return typeof google !== 'undefined' && this.googleInitialized;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.currentUser$.next(null);
    this.router.navigate(['/']); // Redirect to home after logout
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