// login.ts - SIMPLIFIED with better error handling
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleButton') googleButton!: ElementRef;

  email = '';
  password = '';
  isLoading = false;
  returnUrl: string = '/';
  googleAvailable = false;

  constructor(
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Store return URL for redirection after login
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    localStorage.setItem('returnUrl', this.returnUrl);
  }

  ngOnInit() {
    // Check if Google is available and initialize
    this.checkGoogleAvailability();
  }

  ngAfterViewInit() {
    // Try to render Google button with retry mechanism
    this.attemptGoogleButtonRender();
  }

  private checkGoogleAvailability() {
    this.googleAvailable = this.auth.isGoogleAvailable();
    
    if (!this.googleAvailable) {
      // Retry after a delay
      setTimeout(() => {
        this.googleAvailable = this.auth.isGoogleAvailable();
        if (this.googleAvailable) {
          this.auth.initializeGoogleOneTap();
        }
      }, 2000);
    } else {
      this.auth.initializeGoogleOneTap();
    }
  }

  private attemptGoogleButtonRender(attempts = 0) {
    const maxAttempts = 3;
    
    if (attempts >= maxAttempts) {
      console.warn('Failed to render Google button after multiple attempts');
      return;
    }

    if (this.googleButton?.nativeElement && this.auth.isGoogleAvailable()) {
      const success = this.auth.renderGoogleButton(this.googleButton.nativeElement);
      if (!success) {
        // Retry after delay
        setTimeout(() => this.attemptGoogleButtonRender(attempts + 1), 1000);
      }
    } else {
      // Google not ready yet, try again
      setTimeout(() => this.attemptGoogleButtonRender(attempts + 1), 1000);
    }
  }

  // Handle Google login
  onGoogleLogin() {
    if (this.auth.isGoogleAvailable()) {
      google.accounts.id.prompt();
    } else {
      console.warn('Google login not available');
      alert('Google login is not available at the moment. Please try again later.');
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirection is now handled in AuthService
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Login failed');
      }
    });
  }
}