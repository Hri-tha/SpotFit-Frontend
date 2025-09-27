import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  addedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();

  private loadCartFromStorage() {
    const saved = localStorage.getItem('spotfit_cart');
    if (saved) {
      try {
        const items = JSON.parse(saved);
        // Convert string dates back to Date objects
        this.cartItems = items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
        this.cartSubject.next(this.cartItems);
      } catch (e) {
        console.error('Error loading cart from storage:', e);
        this.clearCart();
      }
    }
  }

  private saveCartToStorage() {
    localStorage.setItem('spotfit_cart', JSON.stringify(this.cartItems));
    this.cartSubject.next([...this.cartItems]);
  }

  addToCart(product: Product, size: string = '') {
    if (product.quantity <= 0) {
      alert('Sorry, this product is out of stock!');
      return;
    }

    const existingItem = this.cartItems.find(item => 
      item.product._id === product._id && item.size === size
    );

    if (existingItem) {
      // Check stock availability
      if (existingItem.quantity >= product.quantity) {
        alert(`Only ${product.quantity} items available in stock!`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      this.cartItems.push({
        product,
        quantity: 1,
        size,
        addedAt: new Date()
      });
    }

    this.saveCartToStorage();
  }

  removeFromCart(productId: string, size: string = '') {
    const index = this.cartItems.findIndex(item => 
      item.product._id === productId && item.size === size
    );
    
    if (index !== -1) {
      if (this.cartItems[index].quantity > 1) {
        this.cartItems[index].quantity -= 1;
      } else {
        this.cartItems.splice(index, 1);
      }
      this.saveCartToStorage();
    }
  }

   removeItemCompletely(productId: string, size: string = ''): void {
    this.cartItems = this.cartItems.filter(item => 
      !(item.product._id === productId && item.size === size)
    );
    this.saveCartToStorage();
  }

   updateQuantity(productId: string, size: string, quantity: number): void {
    const item = this.cartItems.find(item => 
      item.product._id === productId && item.size === size
    );
    
    if (item && quantity > 0) {
      // Check stock limit
      if (quantity > item.product.quantity) {
        alert(`Only ${item.product.quantity} items available!`);
        quantity = item.product.quantity;
      }
      item.quantity = quantity;
      this.saveCartToStorage();
    }
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

    getCartTotal(): number {
    return this.cartItems.reduce((total, item) => {
      const price = this.getDiscountedPrice(item.product);
      return total + (price * item.quantity);
    }, 0);
  }

   getItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

 clearCart(): void {
    this.cartItems = [];
    this.saveCartToStorage();
  }

  private getDiscountedPrice(product: Product): number {
    return product.discount && product.discount > 0
      ? Math.round(product.price - (product.price * product.discount) / 100)
      : product.price;
  }

   buyNow(product: Product, size: string = ''): void {
    // Clear cart and add only this product
    this.clearCart();
    this.addToCart(product, size);
    // Navigate to checkout (you'll need to inject Router)
  }
}
