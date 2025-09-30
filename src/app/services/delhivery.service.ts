// services/delhivery.service.ts - UPDATED
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ServiceabilityResponse {
  deliverable: boolean;
  cash: boolean;
  prepaid: boolean;
  cod: boolean;
  pickup: boolean;
  reassign: boolean;
  forward: boolean;
  rto: boolean;
  country: string;
  pin: string;
  state: string;
  city: string;
  routing_code: string;
  zone: string;
  is_oda: string;
}

export interface CreateShipmentRequest {
  shipments: Array<{
    name: string;
    add: string;
    pin: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    order: string;
    products_desc: string;
    cod_amount: string;
    total_amount: string;
    quantity: string;
    waybill?: string;
    payment_mode: string;
  }>;
  pickup_location: {
    name: string;
    add: string;
    city: string;
    pin_code: string;
    state: string;
    phone: string;
    country: string;
  };
}

export interface CreateShipmentResponse {
  packages: Array<{
    waybill: string;
    status: string;
    sort_code: string;
  }>;
  success: boolean;
  waybill?: string; // Add this for alternative response format
}

@Injectable({
  providedIn: 'root'
})
export class DelhiveryService {
  private backendUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}

  /**
   * Check if pincode is serviceable - via your backend proxy
   */
  checkServiceability(pincode: string): Observable<any> {
    console.log('🔍 Checking serviceability for pincode:', pincode);
    
    return this.http.get(`${this.backendUrl}/delhivery/pin/${pincode}`).pipe(
      map((response: any) => {
        console.log('📦 Raw API Response:', response);
        
        // Handle different response formats
        if (response && Array.isArray(response)) {
          // If response is array, take first item
          return response[0];
        } else if (response && response.deliverable !== undefined) {
          // If response has deliverable property
          return response;
        } else {
          // Default fallback
          return { deliverable: false, error: 'Invalid response format' };
        }
      })
    );
  }

  /**
   * Alternative pincode check
   */
  checkPincode(pincode: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/delhivery/pincodes/${pincode}`);
  }

  /**
   * Create shipment - via your backend
   */
  createShipment(shipmentData: CreateShipmentRequest): Observable<CreateShipmentResponse> {
    console.log('🚚 Creating shipment:', shipmentData);
    
    return this.http.post<CreateShipmentResponse>(
      `${this.backendUrl}/delhivery/shipment/create`, 
      shipmentData
    );
  }

  /**
   * Track shipment - via your backend
   */
  trackShipment(waybillNumber: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/delhivery/track/${waybillNumber}`);
  }

  /**
   * Cancel shipment - via your backend
   */
  cancelShipment(waybillNumber: string): Observable<any> {
    return this.http.post(
      `${this.backendUrl}/delhivery/shipment/cancel`, 
      { waybill: waybillNumber }
    );
  }

  /**
   * Get shipping charges - via your backend
   */
  getShippingCharges(pincode: string, weight: number = 0.5): Observable<any> {
    return this.http.get(`${this.backendUrl}/delhivery/charges`, {
      params: {
        pincode,
        weight: weight.toString()
      }
    });
  }
}