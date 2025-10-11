// services/delhivery.service.ts - FIXED INTERFACE
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

// 🔥 FIXED: Updated interface to match actual API response
export interface CreateShipmentResponse {
  success: boolean;
  waybill?: string;
  shipment?: {
    packages?: Array<{
      waybill: string;
      status: string;
      sort_code: string;
    }>;
    waybill?: string;
  };
  packages?: Array<{
    waybill: string;
    status: string;
    sort_code: string;
  }>;
  pickup?: any;
  message?: string;
  pickupAdded?: boolean;
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
        
        if (response && Array.isArray(response)) {
          return response[0];
        } else if (response && response.deliverable !== undefined) {
          return response;
        } else {
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
   * Create shipment - NOW AUTOMATICALLY ADDS TO PICKUP
   */
  createShipment(shipmentData: CreateShipmentRequest): Observable<CreateShipmentResponse> {
    console.log('🚚 Creating shipment (will auto-add to pickup):', shipmentData);
    
    return this.http.post<CreateShipmentResponse>(
      `${this.backendUrl}/delhivery/shipment/create`, 
      shipmentData
    ).pipe(
      map((response: any) => {
        console.log('✅ Shipment created and added to pickup:', response);
        
        // Extract waybill from multiple possible locations
        let waybill = response.waybill;
        
        // Check in top-level packages
        if (!waybill && response.packages && response.packages.length > 0) {
          waybill = response.packages[0].waybill;
        }
        
        // Check in shipment.packages
        if (!waybill && response.shipment?.packages?.length > 0) {
          waybill = response.shipment.packages[0].waybill;
        }
        
        // Check in shipment.waybill
        if (!waybill && response.shipment?.waybill) {
          waybill = response.shipment.waybill;
        }

        return {
          ...response,
          waybill: waybill,
          pickupAdded: !!response.pickup
        } as CreateShipmentResponse;
      })
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

  /**
   * Create pickup request manually (fallback if auto-pickup fails)
   */
  createPickupRequest(pickupData: {
    pickup_location?: string;
    pickup_date?: string;
    pickup_time?: string;
    expected_package_count?: number;
    waybills?: string[];
  }): Observable<any> {
    console.log('📦 Creating manual pickup request:', pickupData);
    
    return this.http.post(`${this.backendUrl}/delhivery/pickup/request`, pickupData);
  }

  /**
   * Add existing waybills to pickup
   */
  addToPickup(waybills: string[], pickupDate?: string, pickupTime?: string): Observable<any> {
    console.log('📦 Adding waybills to pickup:', waybills);
    
    return this.http.post(`${this.backendUrl}/delhivery/pickup/add-waybills`, {
      waybills,
      pickup_date: pickupDate,
      pickup_time: pickupTime
    });
  }
}