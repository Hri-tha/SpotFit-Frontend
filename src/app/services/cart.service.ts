import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();

  addToCart(product: Product, size: string = '') {
    const existing = this.cartItems.find(
      (c) => c.product._id === product._id && c.size === size
    );

    if (existing) {
      existing.quantity++;
    } else {
      this.cartItems.push({ product, quantity: 1, size });
    }
    this.cartSubject.next([...this.cartItems]);
  }

  removeFromCart(productId: string, size: string = '') {
    const index = this.cartItems.findIndex(
      (c) => c.product._id === productId && c.size === size
    );
    if (index > -1) {
      this.cartItems[index].quantity -= 1;
      if (this.cartItems[index].quantity <= 0) {
        this.cartItems.splice(index, 1);
      }
      this.cartSubject.next([...this.cartItems]);
    }
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  clearCart() {
    this.cartItems = [];
    this.cartSubject.next([]);
  }
}
