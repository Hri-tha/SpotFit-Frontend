// rating.ts - PRODUCTION READY
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { UserRating } from '../../models/product';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating.html',
  styleUrls: ['./rating.scss']
})
export class RatingComponent implements OnInit {
  @Input() productId!: string;
  @Input() averageRating: number = 0;
  @Input() totalRatings: number = 0;
  @Output() ratingSubmitted = new EventEmitter<void>();

  isEditing: boolean = false;
  tempRating: number = 0;
  finalRating: number = 0;
  tempReview: string = '';
  submitting: boolean = false;
  userRating: UserRating | null = null;
  canRate: boolean = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkIfUserCanRate();
    this.getUserRating();
  }

  checkIfUserCanRate() {
    if (this.authService.isAuthenticated()) {
      this.productService.canUserRate(this.productId).subscribe({
        next: (response) => {
          this.canRate = response.canRate;
        },
        error: (error) => {
          console.error('Error checking rating eligibility:', error);
        }
      });
    }
  }

  getUserRating() {
    if (this.authService.isAuthenticated()) {
      this.productService.getUserRating(this.productId).subscribe({
        next: (rating) => {
          this.userRating = rating;
        },
        error: (error) => {
          console.error('Error getting user rating:', error);
          if (error.status !== 404) {
            console.error('Unexpected error:', error);
          }
        }
      });
    }
  }

  // ❌ REMOVED: simulateDelivery method

  startRating() {
    if (!this.authService.isAuthenticated()) {
      alert('Please login to rate products');
      return;
    }
    
    if (!this.canRate && !this.userRating) {
      alert('You need to purchase and receive this product before you can rate it.');
      return;
    }
    
    this.isEditing = true;
    this.tempRating = this.userRating?.rating || 0;
    this.finalRating = this.userRating?.rating || 0;
    this.tempReview = this.userRating?.review || '';
  }

  submitRating() {
    if (this.finalRating === 0) return;

    this.submitting = true;
    
    if (!this.userRating?.orderId) {
      alert('Unable to submit rating. Please ensure you have a valid order.');
      this.submitting = false;
      return;
    }

    const orderId = this.userRating.orderId;
    
    this.productService.submitRating(this.productId, {
      rating: this.finalRating,
      review: this.tempReview,
      orderId: orderId
    }).subscribe({
      next: (updatedProduct) => {
        this.averageRating = updatedProduct.averageRating || 0;
        this.totalRatings = updatedProduct.totalRatings || 0;
        
        // Update user rating with actual data from backend
        this.getUserRating();
        
        this.isEditing = false;
        this.submitting = false;
        this.canRate = false;
        this.ratingSubmitted.emit();
        alert('Rating submitted successfully!');
      },
      error: (error) => {
        console.error('Error submitting rating:', error);
        this.submitting = false;
        alert('Error submitting rating. Please try again.');
      }
    });
  }

  cancelRating() {
    this.isEditing = false;
    this.tempRating = 0;
    this.finalRating = 0;
    this.tempReview = '';
  }
}