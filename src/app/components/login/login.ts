import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
   standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container mt-4" style="max-width:400px">
    <h3>Login</h3>
    <form (submit)="onSubmit()">
      <div class="mb-2">
        <input class="form-control" placeholder="Email" [(ngModel)]="email" name="email"/>
      </div>
      <div class="mb-2">
        <input class="form-control" placeholder="Password" type="password" [(ngModel)]="password" name="password"/>
      </div>
      <button class="btn btn-primary">Login</button>
    </form>
  </div>`
})
export class LoginComponent {
  email = '';
  password = '';
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit() {
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const user = this.auth.currentUser$.value;
        if (user?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: err => alert(err.error?.message || 'Login failed')
    });
  }
}
