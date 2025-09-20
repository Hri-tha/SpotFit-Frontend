// src/app/services/address.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private addresses: Address[] = [];
  private selectedAddressSubject = new BehaviorSubject<Address | null>(null);
  selectedAddress$ = this.selectedAddressSubject.asObservable();

  constructor() {
    this.loadAddresses();
  }

  private loadAddresses() {
    // Try to load from localStorage
    const savedAddresses = localStorage.getItem('spotfit_addresses');
    const selectedAddressId = localStorage.getItem('spotfit_selected_address');
    
    if (savedAddresses) {
      this.addresses = JSON.parse(savedAddresses);
      
      // Set selected address if exists
      if (selectedAddressId) {
        const address = this.addresses.find(a => a.id === selectedAddressId);
        if (address) {
          this.selectedAddressSubject.next(address);
        }
      } else if (this.addresses.length > 0) {
        // Set first address as default if none selected
        const defaultAddress = this.addresses.find(a => a.isDefault) || this.addresses[0];
        this.selectedAddressSubject.next(defaultAddress);
        localStorage.setItem('spotfit_selected_address', defaultAddress.id!);
      }
    } else {
      // Load from browser autofill if available (simplified)
      this.tryGetBrowserAddress();
    }
  }

  private tryGetBrowserAddress() {
    // This is a simplified version - in a real app, you'd use more advanced techniques
    // or ask the user to enter their address
    const placeholderAddress: Address = {
      id: 'placeholder',
      fullName: 'Your Name',
      phone: 'Your Phone Number',
      addressLine1: 'Your Address Line 1',
      city: 'Your City',
      state: 'Your State',
      pincode: 'Your Pincode',
      country: 'India',
      isDefault: true,
      type: 'home'
    };
    
    this.addresses = [placeholderAddress];
    this.selectedAddressSubject.next(placeholderAddress);
  }

  getAddresses(): Address[] {
    return [...this.addresses];
  }

  getSelectedAddress(): Address | null {
    return this.selectedAddressSubject.value;
  }

  setSelectedAddress(address: Address) {
    this.selectedAddressSubject.next(address);
    if (address.id) {
      localStorage.setItem('spotfit_selected_address', address.id);
    }
  }

  addAddress(address: Address): string {
    const id = Date.now().toString();
    const newAddress = { ...address, id };
    this.addresses.push(newAddress);
    this.saveAddresses();
    
    // If this is the first address or default, select it
    if (this.addresses.length === 1 || address.isDefault) {
      this.setSelectedAddress(newAddress);
    }
    
    return id;
  }

  updateAddress(id: string, address: Address) {
    const index = this.addresses.findIndex(a => a.id === id);
    if (index !== -1) {
      this.addresses[index] = { ...address, id };
      this.saveAddresses();
      
      // If updating the selected address, update the subject
      if (this.selectedAddressSubject.value?.id === id) {
        this.selectedAddressSubject.next(this.addresses[index]);
      }
    }
  }

  deleteAddress(id: string) {
    this.addresses = this.addresses.filter(a => a.id !== id);
    this.saveAddresses();
    
    // If deleting the selected address, select another one
    if (this.selectedAddressSubject.value?.id === id) {
      if (this.addresses.length > 0) {
        this.setSelectedAddress(this.addresses[0]);
      } else {
        this.selectedAddressSubject.next(null);
      }
    }
  }

  private saveAddresses() {
    localStorage.setItem('spotfit_addresses', JSON.stringify(this.addresses));
  }
}