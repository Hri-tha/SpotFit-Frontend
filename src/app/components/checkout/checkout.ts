// checkout.ts - FIXED VERSION
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
import { ShiprocketService } from '../../services/shiprocket.service';

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
    private shiprocketService: ShiprocketService,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.loadCartData();
    this.loadAddressData();
    this.cartService.cart$.subscribe(() => {
      this.loadCartData();
    });

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
      if (address && this.isAddressValid(address)) {
        this.checkServiceability(address.pincode);
      } else {
        this.serviceabilityResult = null;
      }
    });
    this.addresses = this.addressService.getAddresses();
  }

  getDiscountedPrice(product: any): number {
    return product.discount && product.discount > 0
      ? Math.floor(product.price - (product.price * product.discount) / 100)
      : product.price;
  }

  getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getFinalTotal(): number {
    const deliveryCharge = this.totalAmount >= 999 ? 0 : 0;
    return this.totalAmount + deliveryCharge;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(amount);
  }

  changeAddress(): void {
    const isMobile = window.innerWidth <= 768;
    
    const dialogConfig = {
      width: isMobile ? '95vw' : '500px',
      maxWidth: isMobile ? '95vw' : '500px',
      height: isMobile ? 'auto' : 'auto',
      maxHeight: isMobile ? '90vh' : '80vh',
      data: {
        address: this.selectedAddress || undefined,
        isEdit: !!this.selectedAddress
      }
    };

    const dialogRef = this.dialog.open(AddressDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((result: Address | null) => {
      if (result) {
        if (this.selectedAddress?.id) {
          this.addressService.updateAddress(this.selectedAddress.id, result);
        } else {
          this.addressService.addAddress(result);
        }
        this.selectedAddress = result;
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

  async checkServiceability(pincode: string) {
    if (!pincode || pincode.length !== 6) {
      console.log('Invalid pincode for serviceability check:', pincode);
      this.serviceabilityResult = null;
      return;
    }

    console.log('🔄 Checking Shiprocket serviceability for pincode:', pincode);
    this.isCheckingServiceability = true;
    this.serviceabilityResult = null;

    try {
      const serviceability = await this.shiprocketService.checkServiceability(pincode).toPromise();
      console.log('📦 Shiprocket Serviceability Response:', serviceability);

      if (serviceability && serviceability.available) {
        this.serviceabilityResult = {
          isServiceable: true,
          message: ` Delivery available`
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
      console.error('🚨 Shiprocket serviceability check failed:', error);
      this.serviceabilityResult = {
        isServiceable: false,
        message: '❌ Unable to verify delivery availability'
      };
    } finally {
      this.isCheckingServiceability = false;
    }
  }

  // 🔥 FIXED: Test Shiprocket connection method
  async testShiprocketConnection() {
    console.log('🧪 Testing Shiprocket API Connection...');

    try {
      this.isLoading = true;
      const testPincode = '560029';
      console.log('📍 Testing with pincode:', testPincode);

      const serviceability = await this.shiprocketService.checkServiceability(testPincode).toPromise();
      console.log('📦 Test API Response:', serviceability);

      if (serviceability && serviceability.available) {
        alert(`✅ Shiprocket API Working!\n\nPincode: ${testPincode}\nCourier: ${serviceability.courier_name}\nCharge: ₹${serviceability.charge}\n\nYou can proceed with orders.`);
      } else {
        alert(`❌ Shiprocket API Working but pincode ${testPincode} not serviceable.\n\nResponse: ${JSON.stringify(serviceability)}`);
      }

    } catch (error: any) {
      console.error('❌ Shiprocket test failed:', error);

      if (error.status === 401) {
        alert('❌ Invalid API Credentials. Please check your Shiprocket credentials in environment.');
      } else if (error.status === 403) {
        alert('❌ API Access Denied. Please check Shiprocket account permissions.');
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

      const orderResponse: any = await this.http.post(`${environment.apiUrl}/payment/create-order`, {
        amount: finalAmount,
        currency: 'INR',
        receipt: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        items: this.cartItems,
        address: this.selectedAddress
      }).toPromise();

      console.log('15. Order created successfully:', orderResponse);

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

        // 2. Then create Shiprocket shipment and get AWB
        const awbNumber = await this.createShiprocketShipment(orderId, paymentResponse.razorpay_payment_id);

        alert('Payment Successful! Order has been placed.');
        this.cartService.clearCart();

        // Navigate to success page with AWB
        this.router.navigate(['/order-success'], {
          state: {
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: orderId,
            waybill: awbNumber
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

      const currentUser = this.authService.currentUser$.value;
      const userEmail = currentUser?.email || 'customer@example.com';
      
      console.log('👤 Using user email for order:', userEmail);

      const orderData = {
        orderId: orderId,
        paymentId: paymentId,
        amount: this.getFinalTotal(),
        currency: 'INR',
        customer: {
          userId: currentUser?.id,
          name: this.selectedAddress.fullName,
          email: userEmail,
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
    }
  }

// Key section: Auto-detect correct pickup location
private async createShiprocketShipment(orderId: string, paymentId: string): Promise<string | null> {
  try {
    if (!this.selectedAddress) {
      throw new Error('No address available for shipment');
    }

    // 🔥 STEP 1: Fetch actual pickup locations from Shiprocket
    let availablePickupLocations: string[] = [];
    
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/shiprocket/pickup-locations`).toPromise();
      if (response.success && response.data) {
        availablePickupLocations = response.data.map((loc: any) => loc.name);
        console.log('📋 Available pickup locations from API:', availablePickupLocations);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch pickup locations, using common defaults');
    }

    // If API call failed, try common location names
    if (availablePickupLocations.length === 0) {
      availablePickupLocations = [
        'Home', 'Primary', 'Default', 'Warehouse', 
        'home', 'primary', 'default', 'warehouse',
        'Main', 'Office', 'Store', 'SpotFit'
      ];
    }

    let orderResponse: any = null;
    let successfulLocation = '';

    // 🔥 STEP 2: Try each pickup location until one works
    for (const pickupLocation of availablePickupLocations) {
      try {
        const orderData = {
          order_id: orderId,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickupLocation, // ✅ Try this location
          billing_customer_name: this.selectedAddress.fullName.trim(),
          billing_last_name: '',
          billing_address: (this.selectedAddress.addressLine1 + ' ' + (this.selectedAddress.addressLine2 || '')).trim(),
          billing_address_2: '',
          billing_city: this.selectedAddress.city.trim(),
          billing_pincode: this.selectedAddress.pincode,
          billing_state: this.selectedAddress.state.trim(),
          billing_country: this.selectedAddress.country || 'India',
          billing_email: this.authService.currentUser$.value?.email || 'customer@example.com',
          billing_phone: this.selectedAddress.phone,
          shipping_is_billing: true,
          order_items: this.cartItems.map((item, index) => ({
            name: item.product.title,
            sku: item.product._id || `SKU_${index}_${Date.now()}`,
            units: item.quantity,
            selling_price: this.getDiscountedPrice(item.product),
            discount: 0,
            tax: 0,
            hsn: 6115
          })),
          payment_method: 'Prepaid' as 'Prepaid',
          sub_total: this.getFinalTotal(),
          weight: 0.5,
          length: 10,
          breadth: 10,
          height: 2
        };

        console.log(`🚚 Attempting pickup location: "${pickupLocation}"`);

        orderResponse = await this.shiprocketService.createOrder(orderData).toPromise();
        
        if (orderResponse && orderResponse.shipment_id) {
          console.log(`✅ SUCCESS with pickup location: "${pickupLocation}"`);
          successfulLocation = pickupLocation;
          break; // Found working location, stop trying
        }

      } catch (error: any) {
        console.warn(`❌ Failed with "${pickupLocation}":`, error?.error?.message || error.message);
        
        // Extract available locations from error if provided
        if (error?.error?.data?.data) {
          const errorLocations = error.error.data.data.map((loc: any) => 
            loc.pickup_location || loc.name
          );
          console.log('💡 Locations from error:', errorLocations);
          
          // Add new locations to try
          errorLocations.forEach((loc: string) => {
            if (!availablePickupLocations.includes(loc)) {
              availablePickupLocations.push(loc);
            }
          });
        }
        // Continue to next location
      }
    }

    // 🔥 STEP 3: Check if we got a successful order
    if (!orderResponse || !orderResponse.shipment_id) {
      console.error('❌ All pickup locations failed');
      
      // Store as pending and notify user
      await this.storeWaybillInDatabase(orderId, 'PENDING_SHIPMENT');
      alert('Order placed! Shipment will be created shortly. You will receive tracking details via email.');
      
      return 'PENDING_SHIPMENT';
    }

    // 🔥 STEP 4: Assign AWB to the shipment
    try {
      const awbResponse = await this.shiprocketService.assignAWB(orderResponse.shipment_id).toPromise();
      console.log('✅ AWB assigned:', awbResponse);

      if (awbResponse && awbResponse.awb_code) {
        await this.storeWaybillInDatabase(orderId, awbResponse.awb_code);
        console.log(`🎉 Shipment created with location "${successfulLocation}", AWB: ${awbResponse.awb_code}`);
        return awbResponse.awb_code;
      }
    } catch (awbError) {
      console.error('❌ AWB assignment failed:', awbError);
      // Store shipment ID even if AWB fails
      await this.storeWaybillInDatabase(orderId, `SHIPMENT_${orderResponse.shipment_id}`);
      return `SHIPMENT_${orderResponse.shipment_id}`;
    }

    return null;

  } catch (error) {
    console.error('❌ Shiprocket shipment creation failed:', error);
    await this.storeWaybillInDatabase(orderId, 'PENDING_SHIPMENT');
    return 'PENDING_SHIPMENT';
  }
}
  
  private async storeWaybillInDatabase(orderId: string, waybill: string) {
    try {
      await this.http.post(`${environment.apiUrl}/orders/update-shipment`, {
        orderId: orderId,
        waybill: waybill,
        courier: 'Shiprocket', // Updated from Delhivery to Shiprocket
        status: 'shipment_created'
      }).toPromise();
      console.log('💾 Waybill stored in database');
    } catch (error) {
      console.error('❌ Failed to store waybill:', error);
    }
  }

  // 🔥 FIXED: Test Shiprocket shipment method
  async testShiprocketShipment() {
    try {
      this.isLoading = true;
      const testOrderId = `TEST_${Date.now()}`;
      console.log('🧪 Testing Shiprocket shipment creation...');
      
      const awb = await this.createShiprocketShipment(testOrderId, 'test_payment');
      
      if (awb) {
        alert(`✅ Shiprocket shipment test successful!\n\nAWB: ${awb}\n\nYou can track at: https://shiprocket.co/tracking/${awb}`);
      } else {
        alert('❌ Shipment test completed but no AWB generated. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Shiprocket shipment test failed:', error);
      alert('Shiprocket shipment test failed. Check console for details.');
    } finally {
      this.isLoading = false;
    }
  }

  increaseQuantity(index: number): void {
    const item = this.cartItems[index];
    
    if (item.quantity >= item.product.quantity) {
      alert(`Only ${item.product.quantity} items available in stock!`);
      return;
    }
    
    this.cartService.updateQuantity(
      item.product._id, 
      item.size || '', 
      item.quantity + 1
    );
    
    this.loadCartData();
  }

  decreaseQuantity(index: number): void {
    const item = this.cartItems[index];
    
    if (item.quantity > 1) {
      this.cartService.updateQuantity(
        item.product._id, 
        item.size || '', 
        item.quantity - 1
      );
      
      this.loadCartData();
    }
  }

  getProductImage(product: any): string {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
    if (product.imageUrl) {
      return product.imageUrl;
    }
    
    return 'assets/placeholder-image.jpg';
  }
}