// checkout.ts - FIXED (with waybillNumber issue resolved)
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
import { DelhiveryService, ServiceabilityResponse } from '../../services/delhivery.service';

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

  isCheckingServiceability: boolean = false;
  serviceabilityResult: { isServiceable: boolean; message: string } | null = null;

  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    private configService: ConfigService,
    private authService: AuthService,
    private delhiveryService: DelhiveryService,
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
      // 🔥 FIX: Check serviceability when address changes
      if (address && this.isAddressValid(address)) {
        this.checkServiceability(address.pincode);
      } else {
        // Reset serviceability result if no valid address
        this.serviceabilityResult = null;
      }
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
    const deliveryCharge = this.totalAmount >= 500 ? 0 : 0;
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
        // 🔥 FIX: Check serviceability after address change
        if (result.pincode) {
          this.checkServiceability(result.pincode);
        }
      }
    });
  }

  isAddressValid(address: Address): boolean {
    const isValid = !!(address.fullName &&
      address.addressLine1 &&
      address.city &&
      address.state &&
      address.pincode &&
      address.phone &&
      address.pincode.length === 6);

    console.log('Address validation result:', isValid, address);
    return isValid;
  }

  // 🔥 UPDATED: Better serviceability check with detailed logging
  async checkServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
      console.log('Invalid pincode for serviceability check:', pincode);
      this.serviceabilityResult = null;
      return;
    }

    console.log('🔄 Checking serviceability for pincode:', pincode);
    this.isCheckingServiceability = true;
    this.serviceabilityResult = null;

    try {
      // Convert Observable to Promise to use await
      const serviceability = await this.delhiveryService.checkServiceability(pincode).toPromise();
      console.log('📦 Delhivery API Response:', serviceability);

      if (serviceability && serviceability.deliverable) {
        this.serviceabilityResult = {
          isServiceable: true,
          message: '✅ Delivery available to this location'
        };
        console.log('✅ Serviceability: Available');
      } else {
        this.serviceabilityResult = {
          isServiceable: false,
          message: '❌ Delivery not available to this pincode'
        };
        console.log('❌ Serviceability: Not available');
      }
    } catch (error: any) {
      console.error('🚨 Serviceability check failed:', error);

      if (error.status === 401) {
        this.serviceabilityResult = {
          isServiceable: false,
          message: '❌ Invalid API Token. Please check Delhivery configuration.'
        };
      } else if (error.status === 403) {
        this.serviceabilityResult = {
          isServiceable: false,
          message: '❌ API Access Denied. Check Delhivery account permissions.'
        };
      } else {
        this.serviceabilityResult = {
          isServiceable: false,
          message: '❌ Unable to verify delivery availability'
        };
      }
    } finally {
      this.isCheckingServiceability = false;
    }
  }

  // 🔥 ADD: Test Delhivery connection method
  async testDelhiveryConnection() {
    console.log('🧪 Testing Delhivery API Connection...');

    try {
      this.isLoading = true;

      // Test with a known pincode first
      const testPincode = '560029'; // Your Bangalore pincode
      console.log('📍 Testing with pincode:', testPincode);

      // Convert Observable to Promise
      const serviceability = await this.delhiveryService.checkServiceability(testPincode).toPromise();
      console.log('📦 Test API Response:', serviceability);

      if (serviceability && serviceability.deliverable) {
        alert(`✅ Delhivery API Working!\n\nPincode: ${testPincode}\nStatus: Serviceable\n\nYou can proceed with orders.`);
      } else {
        alert(`❌ Delhivery API Working but pincode ${testPincode} not serviceable.\n\nResponse: ${JSON.stringify(serviceability)}`);
      }

    } catch (error: any) {
      console.error('❌ Delhivery test failed:', error);

      if (error.status === 401) {
        alert('❌ Invalid API Token. Please check your Delhivery token in environment.ts');
      } else if (error.status === 403) {
        alert('❌ API Access Denied. Please complete KYC in Delhivery dashboard.');
      } else {
        alert('❌ Connection failed: ' + (error.message || 'Check console for details'));
      }
    } finally {
      this.isLoading = false;
    }
  }

  async payWithRazorpay() {
    console.log('1. payWithRazorpay method started');
    this.addressError = '';

    // Auth check
    if (!this.authService.isAuthenticated()) {
      console.log('2. User not authenticated');
      const returnUrl = this.router.url;
      alert('Please login to continue with payment');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: returnUrl }
      });
      return;
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
      this.addressError = 'Please complete your address details including valid 6-digit pincode';
      this.changeAddress();
      return;
    }
    console.log('7. Address is valid');

    // 🔥 FIX: Check if serviceability was actually checked
    if (this.serviceabilityResult === null) {
      console.log('7a. Serviceability not checked yet, checking now...');
      await this.checkServiceability(this.selectedAddress.pincode);
    }

    if (!this.serviceabilityResult?.isServiceable) {
      console.log('7b. Address not serviceable');
      alert('Delivery is not available to this location. Please update your address.');
      return;
    }

    if (this.cartItems.length === 0) {
      console.log('8. Cart is empty');
      alert('Your cart is empty');
      return;
    }
    console.log('9. Cart has items');

    // IMPROVED CONFIG CHECK
    if (!this.configLoaded) {
      console.log('10. Config not loaded, attempting to load manually...');

      try {
        await this.configService.loadConfig();
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!this.configLoaded) {
          console.log('10b. Config still not loaded after manual load');
          const keyFromEnv = environment.razorpayKeyId;
          if (keyFromEnv) {
            console.log('10c. Using key from environment:', keyFromEnv);
          } else {
            alert('Payment system is loading. Please try again in a moment.');
            return;
          }
        }
      } catch (error) {
        console.log('10d. Config loading failed, checking environment key');
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
          await this.verifyPaymentAndCreateShipment(response, orderResponse.id);
        },
        prefill: {
          name: this.selectedAddress.fullName,
          email: this.authService.currentUser$.value?.email || 'customer@example.com',
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

// In checkout.ts - update verifyPaymentAndCreateShipment method
private async verifyPaymentAndCreateShipment(paymentResponse: any, orderId: string) {
  try {
    const verificationResponse: any = await this.http.post(`${environment.apiUrl}/payment/verify-payment`, {
      order_id: orderId,
      payment_id: paymentResponse.razorpay_payment_id,
      signature: paymentResponse.razorpay_signature,
      cart_items: this.cartItems,
      address: this.selectedAddress
    }).toPromise();

    if (verificationResponse.success) {
      // 1. First create the order in database
      await this.createOrderInDatabase(orderId, paymentResponse.razorpay_payment_id);

      // 2. Then create Delhivery shipment and get waybill
      const waybillNumber = await this.createDelhiveryShipment(orderId, paymentResponse.razorpay_payment_id);

      alert('Payment Successful! Order has been placed.');
      this.cartService.clearCart();

      // Navigate to success page with waybill
      this.router.navigate(['/order-success'], {
        state: {
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: orderId,
          waybill: waybillNumber
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

private async createOrderInDatabase(orderId: string, paymentId: string) {
  try {
    if (!this.selectedAddress) {
      throw new Error('No address available for order');
    }

    // Get current user from auth service
    const currentUser = this.authService.currentUser$.value;
    const userEmail = currentUser?.email || 'customer@example.com'; // Fallback to hardcoded only if no user
    
    console.log('👤 Using user email for order:', userEmail);

    const orderData = {
      orderId: orderId,
      paymentId: paymentId,
      amount: this.getFinalTotal(),
      currency: 'INR',
      customer: {
        userId: currentUser?.id, // Add user ID if available
        name: this.selectedAddress.fullName,
        email: userEmail, // ✅ Use actual user email
        phone: this.selectedAddress.phone
      },
      shippingAddress: {
        fullName: this.selectedAddress.fullName,
        addressLine1: this.selectedAddress.addressLine1,
        addressLine2: this.selectedAddress.addressLine2 || '',
        city: this.selectedAddress.city,
        state: this.selectedAddress.state,
        pincode: this.selectedAddress.pincode,
        country: this.selectedAddress.country || 'India',
        phone: this.selectedAddress.phone
      },
      items: this.cartItems.map(item => ({
        productId: item.product._id,
        title: item.product.title,
        price: item.product.price,
        discountedPrice: this.getDiscountedPrice(item.product),
        quantity: item.quantity,
        size: item.size,
        imageUrl: item.product.imageUrl || item.product.images?.[0] || 'assets/placeholder-image.jpg'
      }))
    };

    const response = await this.http.post(`${environment.apiUrl}/orders/create`, orderData).toPromise();
    console.log('✅ Order created in database with user email:', userEmail, response);
    
  } catch (error) {
    console.error('❌ Failed to create order in database:', error);
    // Don't block the flow if order creation fails
  }
}
  private async createDelhiveryShipment(orderId: string, paymentId: string): Promise<string | null> {
    try {
      if (!this.selectedAddress) {
        throw new Error('No address available for shipment');
      }

      // Use the correct Delhivery shipment format
      const shipmentData = {
        "shipments": [
          {
            "name": this.selectedAddress.fullName,
            "add": `${this.selectedAddress.addressLine1} ${this.selectedAddress.addressLine2 || ''}`.trim(),
            "pin": this.selectedAddress.pincode,
            "city": this.selectedAddress.city,
            "state": this.selectedAddress.state,
            "country": this.selectedAddress.country || 'India',
            "phone": this.selectedAddress.phone,
            "order": orderId,
            "products_desc": this.cartItems.map(item =>
              `${item.product.title} (Size: ${item.size}) x ${item.quantity}`
            ).join(', '),
            "cod_amount": "0", // For prepaid orders
            "total_amount": this.getFinalTotal().toString(),
            "quantity": this.getTotalItems().toString(),
            "waybill": "", // Will be generated by Delhivery
            "payment_mode": "Prepaid"
          }
        ],
        "pickup_location": {
          "name": environment.delhivery.sellerName,
          "add": environment.delhivery.sellerAddress,
          "city": environment.delhivery.sellerCity,
          "pin_code": environment.delhivery.sellerPincode,
          "state": environment.delhivery.sellerState,
          "phone": environment.delhivery.sellerPhone,
          "country": "India"
        }
      };

      console.log('🚚 Sending shipment data:', shipmentData);

      // Convert Observable to Promise using toPromise()
      const shipmentResponse = await this.delhiveryService.createShipment(shipmentData).toPromise();
      console.log('✅ Delhivery shipment created:', shipmentResponse);

      let waybill: string | null = null;

      // Handle different response formats
      if (shipmentResponse && shipmentResponse.packages) {
        // New format
        waybill = shipmentResponse.packages[0]?.waybill;
        if (waybill) {
          console.log('📦 Waybill number:', waybill);
          await this.storeWaybillInDatabase(orderId, waybill);
        }
      } else if (shipmentResponse && shipmentResponse.waybill) {
        // Alternative format
        waybill = shipmentResponse.waybill;
        console.log('📦 Waybill number:', waybill);
        await this.storeWaybillInDatabase(orderId, waybill);
      } else {
        console.log('⚠️ No waybill in response, but shipment might be created');
      }

      return waybill; // Return the waybill number

    } catch (error) {
      console.error('❌ Delhivery shipment creation failed:', error);
      // Don't throw error here - order is already paid, just log it
      return null; // Return null if shipment creation failed
    }
  }

  private async storeWaybillInDatabase(orderId: string, waybill: string) {
    try {
      await this.http.post(`${environment.apiUrl}/orders/update-shipment`, {
        orderId: orderId,
        waybill: waybill,
        courier: 'Delhivery',
        status: 'shipment_created'
      }).toPromise();
      console.log('💾 Waybill stored in database');
    } catch (error) {
      console.error('❌ Failed to store waybill:', error);
    }
  }

  // Add test method
  async testDelhiveryShipment() {
    try {
      this.isLoading = true;
      const testOrderId = `TEST_${Date.now()}`;
      console.log('🧪 Testing Delhivery shipment creation...');
      
      const waybill = await this.createDelhiveryShipment(testOrderId, 'test_payment');
      
      if (waybill) {
        alert(`✅ Shipment test successful!\n\nWaybill: ${waybill}\n\nYou can track at: https://track.delhivery.com/#/track/${waybill}`);
      } else {
        alert('❌ Shipment test completed but no waybill generated. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Shipment test failed:', error);
      alert('Shipment test failed. Check console for details.');
    } finally {
      this.isLoading = false;
    }
  }
}