// src/app/components/checkout/checkout.ts
import { Component, OnInit, inject } from '@angular/core';
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
import { SeoService } from '../../services/seo.service';
import { AuthService } from '../../services/auth.service';

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
  private seoService = inject(SeoService);
  addressError: string = '';

  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadCartData();
    this.loadAddressData();
    this.seoService.setSeoData({
      title: 'Checkout - Secure Payment | SpotFit Gym Wear',
      description: 'Complete your gym wear purchase securely. Multiple payment options available including UPI, Credit Card, and Debit Card.',
      keywords: 'checkout, payment, buy gym wear, secure payment'
    });
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

  private isAddressValid(address: Address): boolean {
    return !!(address.fullName &&
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.pincode &&
      address.phone);
  }

  // checkout.ts - UPDATED with debugging
async payWithRazorpay() {
  console.log('1. payWithRazorpay method started');
  
  this.addressError = '';
  
  
  // Auth check
  if (!this.authService.isAuthenticated()) {
    console.log('2. User not authenticated');
    
    // Store the current URL as return URL
    const returnUrl = this.router.url;
    
    alert('Please login to continue with payment');
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: returnUrl }  // Pass current URL
    });
    return;

    // console.log('2. User not authenticated');
    // alert('Please login to continue with payment');
    // this.router.navigate(['/login'], { 
    //   queryParams: { returnUrl: this.router.url } 
    // });
    // return;
  }
  console.log('3. User is authenticated');

  if (!this.selectedAddress) {
    console.log('4. No address selected');
    this.addressError = 'Please add a delivery address before proceeding with payment';
    setTimeout(() => {
      this.changeAddress();
    }, 500);
    return;
  }
  console.log('5. Address is selected');

  if (!this.isAddressValid(this.selectedAddress)) {
    console.log('6. Address is invalid');
    this.addressError = 'Please complete your address details';
    this.changeAddress();
    return;
  }
  console.log('7. Address is valid');

  if (this.cartItems.length === 0) {
    console.log('8. Cart is empty');
    alert('Your cart is empty');
    return;
  }
  console.log('9. Cart has items');

// IMPROVED CONFIG CHECK - REPLACE THE ABOVE CODE WITH THIS:
if (!this.configLoaded) {
  console.log('10. Config not loaded, attempting to load manually...');
  
  // Try to load config manually
  try {
    await this.configService.loadConfig();
    
    // Wait a bit for the observable to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check again after loading
    if (!this.configLoaded) {
      console.log('10b. Config still not loaded after manual load');
      
      // Check if we at least have a key from environment
      const keyFromEnv = environment.razorpayKeyId;
      if (keyFromEnv) {
        console.log('10c. Using key from environment:', keyFromEnv);
        // Continue with environment key even if config service says not loaded
      } else {
        alert('Payment system is loading. Please try again in a moment.');
        return;
      }
    }
  } catch (error) {
    console.log('10d. Config loading failed, checking environment key');
    
    // If environment has key, continue anyway
    if (environment.razorpayKeyId) {
      console.log('10e. Using environment key despite load failure');
    } else {
      alert('Payment system unavailable. Please try again later.');
      return;
    }
  }
}
console.log('11. Config check passed, key:', this.configService.getRazorpayKeyId());

  this.isLoading = true;
  console.log('12. Starting payment process...');

  try {
    const finalAmount = this.getFinalTotal();
    console.log('13. Final amount:', finalAmount);

    // Step 1: Create order on backend
    console.log('14. Making API call to create-order');
    const orderResponse: any = await this.http.post(`${environment.apiUrl}/payment/create-order`, {
      amount: finalAmount,
      currency: 'INR',
      receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: this.cartItems,
      address: this.selectedAddress
    }).toPromise();

    console.log('15. Order created successfully:', orderResponse);

    // Step 2: Initialize Razorpay checkout
    const razorpayKeyId = this.configService.getRazorpayKeyId();
    console.log('16. Razorpay Key ID:', razorpayKeyId);

    // Check if Razorpay is available
    if (typeof Razorpay === 'undefined') {
      console.error('17. Razorpay not loaded');
      alert('Payment gateway not available. Please refresh the page.');
      this.isLoading = false;
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      order_id: orderResponse.id,
      name: 'SpotFit',
      description: 'Order Payment',
      handler: async (response: any) => {
        console.log('18. Payment successful:', response);
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

    console.log('19. Opening Razorpay checkout');
    const rzp1 = new Razorpay(options);
    rzp1.open();

    rzp1.on('payment.failed', (response: any) => {
      console.error('20. Payment failed:', response);
      alert('Payment failed. Please try again.');
      this.isLoading = false;
    });

  } catch (error) {
    console.error('21. Payment error:', error);
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