// login.ts - UPDATED
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  returnUrl: string = '/'; // Default redirect

  constructor(
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get return URL from query parameters or default to home
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    this.isLoading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        const user = this.auth.currentUser$.value;
        
        // Redirect logic based on user role and return URL
        if (user?.role === 'admin') {
          // Admin always goes to admin panel, regardless of returnUrl
          this.router.navigate(['/admin']);
        } else {
          // Regular users go to their intended destination
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: err => {
        this.isLoading = false;
        alert(err.error?.message || 'Login failed');
      }
    });
  }
}