// services/shiprocket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ServiceabilityResponse {
  available: boolean;
  estimated_days?: string;
  charge?: number;
  courier_company_id?: number;
  courier_name?: string;
  reason?: string;
}

export interface CreateOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  reseller_name?: string;
  company_name?: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: number;
  }>;
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight: number;
}

export interface CreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
}

export interface AssignAWBResponse {
  awb_code: string;
  courier_id: number;
  courier_name: string;
  status: string;
}

export interface GeneratePickupResponse {
  pickup_scheduled_date: string;
  pickup_token_number: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShiprocketService {
  private backendUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}

  /**
   * Check serviceability for pincode
   */
  checkServiceability(pincode: string, weight: number = 0.5): Observable<ServiceabilityResponse> {
    console.log('🔍 Checking Shiprocket serviceability for pincode:', pincode);
    
    return this.http.get<ServiceabilityResponse>(
      `${this.backendUrl}/shiprocket/serviceability/${pincode}`, 
      {
        params: { weight: weight.toString() }
      }
    ).pipe(
      map((response: any) => {
        console.log('📦 Shiprocket Serviceability Response:', response);
        return response;
      })
    );
  }

  /**
   * Create order in Shiprocket
   */
  createOrder(orderData: CreateOrderRequest): Observable<CreateOrderResponse> {
    console.log('🚚 Creating Shiprocket order:', orderData);
    
    return this.http.post<CreateOrderResponse>(
      `${this.backendUrl}/shiprocket/orders/create`, 
      orderData
    ).pipe(
      map((response: any) => {
        console.log('✅ Shiprocket order created:', response);
        return response;
      })
    );
  }

  /**
   * Assign AWB to shipment
   */
  assignAWB(shipmentId: number, courierId?: number): Observable<AssignAWBResponse> {
    console.log('🏷️ Assigning AWB to shipment:', shipmentId);
    
    return this.http.post<AssignAWBResponse>(
      `${this.backendUrl}/shiprocket/awb/assign`, 
      {
        shipment_id: shipmentId,
        courier_id: courierId
      }
    ).pipe(
      map((response: any) => {
        console.log('✅ AWB assigned:', response);
        return response;
      })
    );
  }

  /**
   * Generate pickup request
   */
  generatePickup(shipmentIds: number[]): Observable<GeneratePickupResponse> {
    console.log('📦 Generating pickup for shipments:', shipmentIds);
    
    return this.http.post<GeneratePickupResponse>(
      `${this.backendUrl}/shiprocket/pickup/generate`, 
      {
        shipment_id: shipmentIds
      }
    ).pipe(
      map((response: any) => {
        console.log('✅ Pickup generated:', response);
        return response;
      })
    );
  }

  /**
   * Track shipment
   */
  trackShipment(awbCode: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/shiprocket/track/${awbCode}`);
  }

  /**
   * Cancel shipment
   */
  cancelShipment(shipmentId: number): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/shiprocket/shipment/cancel`, 
      { shipment_id: shipmentId }
    );
  }

  /**
   * Generate shipping label
   */
  generateLabel(shipmentId: number): Observable<{ label_url: string }> {
    return this.http.get<{ label_url: string }>(
      `${this.backendUrl}/shiprocket/label/generate`, 
      {
        params: { shipment_id: shipmentId.toString() }
      }
    );
  }

  /**
   * Generate invoice
   */
  generateInvoice(orderId: number): Observable<{ invoice_url: string }> {
    return this.http.get<{ invoice_url: string }>(
      `${this.backendUrl}/shiprocket/invoice/generate`, 
      {
        params: { order_id: orderId.toString() }
      }
    );
  }
}