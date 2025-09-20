// src/app/components/checkout/checkout.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';

import { CartService } from '../../services/cart.service';
import { AddressService } from '../../services/address.service';
import { ConfigService } from '../../services/config.service';
import { AddressDialogComponent } from '../address-dialog/address-dialog';
import { Address } from '../../models/address.model';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  totalAmount: number = 0;
  selectedAddress: Address | null = null;
  addresses: Address[] = [];
  isLoading: boolean = false;
  configLoaded: boolean = false;

  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    private configService: ConfigService,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCartData();
    this.loadAddressData();
    
    // Wait for config to load
    this.configService.isConfigLoaded().subscribe(loaded => {
      this.configLoaded = loaded;
    });
  }

  loadCartData() {
    this.cartItems = this.cartService.getCartItems();
    this.totalAmount = this.cartItems.reduce(
      (sum, item) => sum + this.getDiscountedPrice(item.product) * item.quantity,
      0
    );
  }

  loadAddressData() {
    this.addressService.selectedAddress$.subscribe(address => {
      this.selectedAddress = address;
    });
    this.addresses = this.addressService.getAddresses();
  }

  getDiscountedPrice(product: any): number {
    return product.discount && product.discount > 0
      ? Math.round(product.price - (product.price * product.discount) / 100)
      : product.price;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getFinalTotal(): number {
    const deliveryCharge = this.totalAmount >= 500 ? 0 : 49;
    return this.totalAmount + deliveryCharge;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(amount);
  }

  changeAddress(): void {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '500px',
      data: {
        address: this.selectedAddress || undefined,
        isEdit: !!this.selectedAddress
      }
    });

    dialogRef.afterClosed().subscribe((result: Address | null) => {
      if (result) {
        if (this.selectedAddress?.id) {
          this.addressService.updateAddress(this.selectedAddress.id, result);
        } else {
          this.addressService.addAddress(result);
        }
        this.selectedAddress = result;
      }
    });
  }

  async payWithRazorpay() {
    if (!this.selectedAddress) {
      alert('Please select a delivery address first');
      return;
    }

    if (this.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!this.configLoaded) {
      alert('Payment system is loading. Please try again in a moment.');
      return;
    }

    this.isLoading = true;
    
    try {
      const finalAmount = this.getFinalTotal();
      
      // Step 1: Create order on backend
      const orderResponse: any = await this.http.post(`${environment.apiUrl}/payment/create-order`, {
        amount: finalAmount * 100, // Convert to paise for Razorpay
        currency: 'INR',
        receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        items: this.cartItems,
        address: this.selectedAddress
      }).toPromise();

      // Step 2: Initialize Razorpay checkout
      const razorpayKeyId = this.configService.getRazorpayKeyId();
      
      const options = {
        key: razorpayKeyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        order_id: orderResponse.id,
        name: 'SpotFit',
        description: 'Order Payment',
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          await this.verifyPayment(response, orderResponse.id);
        },
        prefill: {
          name: this.selectedAddress.fullName,
          email: 'customer@example.com',
          contact: this.selectedAddress.phone
        },
        notes: {
          address: this.selectedAddress.addressLine1,
          order_items: JSON.stringify(this.cartItems.map(item => ({
            product: item.product.title,
            quantity: item.quantity,
            size: item.size
          })))
        },
        theme: {
          color: '#c1121f'
        }
      };

      const rzp1 = new Razorpay(options);
      rzp1.open();
      
      rzp1.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        alert('Payment failed. Please try again.');
        this.isLoading = false;
      });
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed. Please try again.');
      this.isLoading = false;
    }
  }

  private async verifyPayment(paymentResponse: any, orderId: string) {
    try {
      const verificationResponse: any = await this.http.post(`${environment.apiUrl}/payment/verify-payment`, {
        order_id: orderId,
        payment_id: paymentResponse.razorpay_payment_id,
        signature: paymentResponse.razorpay_signature,
        cart_items: this.cartItems,
        address: this.selectedAddress
      }).toPromise();

      if (verificationResponse.success) {
        // Payment successful
        alert('Payment Successful! Payment ID: ' + paymentResponse.razorpay_payment_id);
        this.cartService.clearCart();
        
        // Navigate to success page
        this.router.navigate(['/order-success'], {
          state: {
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: orderId
          }
        });
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('There was an issue verifying your payment. Please contact support.');
    } finally {
      this.isLoading = false;
    }
  }
}