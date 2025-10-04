import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile = {
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    preferences: {
      newsletter: true,
      smsNotifications: false,
      emailNotifications: true
    }
  };

  isEditing: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  activeTab: string = 'personal';
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.initializeProfile(user);
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  initializeProfile(user: any) {
    this.userProfile = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || '',
        country: user.address?.country || 'India'
      },
      preferences: {
        newsletter: user.preferences?.newsletter !== false,
        smsNotifications: user.preferences?.smsNotifications || false,
        emailNotifications: user.preferences?.emailNotifications !== false
      }
    };
    this.isLoading = false;
  }

  loadUserProfile() {
    // Simulate API call delay
    setTimeout(() => {
      const currentUser = this.authService.currentUser$.value;
      if (currentUser) {
        this.initializeProfile(currentUser);
      } else {
        // Redirect to login if no user
        this.router.navigate(['/login']);
      }
    }, 500);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reload original data when canceling edit
      this.loadUserProfile();
    }
  }

  saveProfile() {
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      // Here you would typically call your user service to update the profile
      console.log('Saving profile:', this.userProfile);
      
      // Update user in auth service (simulated)
      const updatedUser = {
        ...this.authService.currentUser$.value,
        ...this.userProfile
      };
      
      this.isEditing = false;
      this.isSaving = false;
      
      // Show success message (you can replace with a toast service)
      alert('Profile updated successfully!');
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Handle profile picture upload
      console.log('Profile picture selected:', file);
      // You would typically upload this to your server here
    }
  }

  getInitials(): string {
    if (!this.userProfile.name) return 'U';
    return this.userProfile.name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  changePassword() {
    // Navigate to change password page or show modal
    alert('Change password functionality would go here');
  }

  deleteAccount() {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmDelete) {
      // Call delete account service
      console.log('Account deletion requested');
    }
  }
}