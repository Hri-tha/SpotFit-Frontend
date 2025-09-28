// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private router: Router) {}

  initiatePayment(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const razorpay = new Razorpay(options);
      
      razorpay.on('payment.success', (response: any) => {
        resolve(response);
      });
      
      razorpay.on('payment.error', (error: any) => {
        reject(error);
      });
      
      razorpay.open();
    });
  }

  // Create order and payment options
  createPaymentOptions(amount: number, orderId: string, customerDetails: any, prefillData: any) {
    return {
      key: 'rzp_live_RMdzh3tFYlmgp4', // Replace with your Razorpay API Key
      amount: amount * 1, // Amount in paise
      currency: 'INR',
      name: 'SpotFit',
      description: 'Order Payment',
      order_id: orderId, // This comes from your backend
      handler: (response: any) => {
        this.handlePaymentSuccess(response, orderId);
      },
      prefill: {
        name: prefillData.name,
        email: prefillData.email,
        contact: prefillData.contact
      },
      notes: {
        address: customerDetails.address
      },
      theme: {
        color: '#c1121f'
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        }
      }
    };
  }

  private handlePaymentSuccess(response: any, orderId: string) {
    console.log('Payment successful:', response);
    
    // Verify payment with your backend
    this.verifyPayment(response, orderId).then(verificationResult => {
      if (verificationResult.success) {
        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
        // Navigate to success page or clear cart
        this.router.navigate(['/order-success'], { 
          state: { 
            paymentId: response.razorpay_payment_id,
            orderId: orderId
          } 
        });
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    }).catch(error => {
      console.error('Payment verification error:', error);
      alert('There was an issue verifying your payment. Please contact support.');
    });
  }

  private async verifyPayment(paymentResponse: any, orderId: string): Promise<any> {
    // In a real application, you would call your backend to verify the payment
    // This is a mock implementation
    try {
      // Simulate API call to your backend
      // const response = await this.http.post('/api/verify-payment', {
      //   razorpay_payment_id: paymentResponse.razorpay_payment_id,
      //   razorpay_order_id: paymentResponse.razorpay_order_id,
      //   razorpay_signature: paymentResponse.razorpay_signature,
      //   orderId: orderId
      // }).toPromise();
      
      // For demo purposes, we'll assume verification is successful
      return { success: true, message: 'Payment verified successfully' };
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, message: 'Verification failed' };
    }
  }
}