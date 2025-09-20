// src/app/components/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { orderId: string, paymentId: string };
    
    if (state) {
      this.orderId = state.orderId;
      this.paymentId = state.paymentId;
    }
  }

  ngOnInit() {
    if (!this.orderId) {
      this.router.navigate(['/']);
    }
  }

  continueShopping() {
    this.router.navigate(['/']);
  }
}