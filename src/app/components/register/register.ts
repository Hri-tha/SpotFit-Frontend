// register.component.ts - ENHANCED
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  returnUrl: string = '/';
  passwordStrength = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  checkPasswordStrength() {
    if (!this.password) {
      this.passwordStrength = '';
      return;
    }

    let strength = 0;
    
    // Length check
    if (this.password.length >= 8) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(this.password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(this.password)) strength++;
    
    // Contains numbers
    if (/[0-9]/.test(this.password)) strength++;
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(this.password)) strength++;

    if (strength <= 2) this.passwordStrength = 'weak';
    else if (strength <= 4) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.isLoading = true;
    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: err => {
        this.isLoading = false;
        alert(err.error?.message || 'Registration failed');
      }
    });
  }
}