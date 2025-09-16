import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  featuredProduct?: Product;
  normalProducts: Product[] = [];
  allProducts: Product[] = [];

  cartCount: number = 0;

  constructor(
    private svc: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.svc.getAll().subscribe((data) => {
      this.products = data;
      this.allProducts = data;
      this.featuredProduct = this.products.find((p) => p.featured);
      this.normalProducts = this.products.filter((p) => !p.featured);
    });

    // 🔔 Subscribe to cart changes
    this.cartService.cart$.subscribe((items) => {
      this.cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
    });
  }

  filterByType(type: string) {
    this.normalProducts = this.allProducts.filter(
      (p) => p.type === type && !p.featured
    );
    this.featuredProduct = this.allProducts.find(
      (p) => p.type === type && p.featured
    );
  }

  resetFilter() {
    this.normalProducts = this.allProducts.filter((p) => !p.featured);
    this.featuredProduct = this.allProducts.find((p) => p.featured);
  }

  goHome() {
    this.resetFilter();
    this.router.navigate(['/']);
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  getDiscountedPrice(p: Product): number {
    return p.discount && p.discount > 0
      ? Math.round(p.price - (p.price * p.discount) / 100)
      : p.price;
  }

  // ✅ Ask for size before adding
  selectSizeAndAdd(product: Product) {
    let selectedSize: string | null = null;

    if (product.sizes && product.sizes.length > 0) {
      selectedSize = prompt(
        `Available sizes: ${product.sizes.join(', ')}\nEnter your size:`
      );
      if (!selectedSize || !product.sizes.includes(selectedSize)) {
        alert('Invalid size selected.');
        return;
      }
    }

    this.cartService.addToCart(product, selectedSize || '');
  }

increaseQuantity(product: Product) {
  const item = this.cartService
    .getCartItems()
    .find((i) => i.product._id === product._id);

  if (item) {
    this.cartService.addToCart(product, item.size || '');
  } else {
    this.selectSizeAndAdd(product);
  }
}


decreaseQuantity(product: Product) {
  const item = this.cartService
    .getCartItems()
    .find((i) => i.product._id === product._id);

  if (item) {
    this.cartService.removeFromCart(product._id, item.size || '');
  }
}


  getCartQuantity(product: Product): number {
  const item = this.cartService
    .getCartItems()
    .find((i) => i.product._id === product._id);
  return item ? item.quantity : 0;
}

  goToCart() {
    this.router.navigate(['/cart']); // 🚀 In future make Buy Now page
  }
}
