import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(): boolean {
    if (this.auth.isAdmin()) return true;
    // If token contains admin email but role not set, you may check token payload manually
    // e.g. check currentUser$.value.email === 'admin@example.com'
    this.router.navigate(['/login']);
    return false;
  }
}
