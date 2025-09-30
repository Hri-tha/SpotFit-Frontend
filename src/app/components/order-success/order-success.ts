// src/app/components/order-success/order-success.component.ts - UPDATED
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.html',
  styleUrls: ['./order-success.scss']
})
export class OrderSuccessComponent implements OnInit {
  orderId: string = '';
  paymentId: string = '';
  waybillNumber: string = '';
  isLoading: boolean = true;
  trackingUrl: string = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { 
      orderId: string, 
      paymentId: string,
      waybill?: string 
    };
    
    if (state) {
      this.orderId = state.orderId;
      this.paymentId = state.paymentId;
      this.waybillNumber = state.waybill || '';
    }
  }

  ngOnInit() {
    if (!this.orderId) {
      this.router.navigate(['/']);
      return;
    }

    // If we don't have waybill, try to get it from backend
    if (!this.waybillNumber) {
      this.getOrderDetails();
    } else {
      this.setTrackingUrl();
      this.isLoading = false;
    }
  }

  getOrderDetails() {
    this.http.get(`${environment.apiUrl}/orders/${this.orderId}`)
      .subscribe({
        next: (order: any) => {
          this.waybillNumber = order.waybill || '';
          this.setTrackingUrl();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to fetch order details:', error);
          this.isLoading = false;
        }
      });
  }

  setTrackingUrl() {
    if (this.waybillNumber) {
      this.trackingUrl = `https://track.delhivery.com/#/track/${this.waybillNumber}`;
    }
  }

  trackOrder() {
    if (this.trackingUrl) {
      window.open(this.trackingUrl, '_blank');
    }
  }

  continueShopping() {
    this.router.navigate(['/']);
  }
}