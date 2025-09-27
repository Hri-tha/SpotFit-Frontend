import { Component, OnInit, HostListener, inject} from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  heroBanners: Product[] = [];
  featuredProduct?: Product;
  normalProducts: Product[] = [];
  allProducts: Product[] = [];

  currentBannerIndex: number = 0;
  bannerInterval: any; 
  cartCount: number = 0;
  menuOpen: boolean = false;

  private seoService = inject(SeoService);

  constructor(
    private svc: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.seoService.setDefaultSeo();
    this.loadHeroBanners();
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

   loadHeroBanners() {
    this.svc.getHeroBanners().subscribe((banners) => {
      this.heroBanners = banners;
      this.startBannerRotation();
    });
  }

  startBannerRotation() {
    if (this.heroBanners.length > 1) {
      this.bannerInterval = setInterval(() => {
        this.currentBannerIndex = (this.currentBannerIndex + 1) % this.heroBanners.length;
      }, 3000); // Change every 3 seconds
    }
  }

  stopBannerRotation() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  goToBanner(index: number) {
    this.currentBannerIndex = index;
  }

   loadProducts() {
    this.svc.getAll().subscribe((data) => {
      this.products = data;
      this.allProducts = data;
      this.featuredProduct = this.products.find((p) => p.featured);
      this.normalProducts = this.products.filter((p) => !p.featured);
    });
  }

  get currentHeroBanner(): Product | null {
    return this.heroBanners.length > 0 ? this.heroBanners[this.currentBannerIndex] : null;
  }

  currentImageIndex: { [productId: string]: number } = {};

  getProductImage(product: Product, index: number = 0): string {
    // Check if product has multiple images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const safeIndex = index % product.images.length;
      return product.images[safeIndex] || product.imageUrl || '';
    }
    // Fallback to single imageUrl
    return product.imageUrl || '';
  }

  onProductHover(product: Product) {
    if (product.images && Array.isArray(product.images) && product.images.length > 1) {
      const productId = product._id!;
      this.currentImageIndex[productId] = this.currentImageIndex[productId] || 0;
      
      // Use type assertion for dynamic property
      (product as any).hoverInterval = setInterval(() => {
        if (this.currentImageIndex[productId] !== undefined) {
          this.currentImageIndex[productId] = 
            (this.currentImageIndex[productId] + 1) % product.images!.length;
        }
      }, 1500);
    }
  }

 onProductLeave(product: Product) {
    // Stop image cycling when mouse leaves
    const hoverInterval = (product as any).hoverInterval;
    if (hoverInterval) {
      clearInterval(hoverInterval);
      (product as any).hoverInterval = null;
    }
    // Reset to first image
    if (product._id) {
      this.currentImageIndex[product._id] = 0;
    }
  }

  // Close menu when clicking outside on mobile
  @HostListener('window:click', ['$event'])
  onClick(event: Event) {
    if (this.menuOpen && window.innerWidth <= 768) {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-menu-left') && !target.closest('.hamburger-left')) {
        this.menuOpen = false;
      }
    }
  }

  // Close menu on escape key
  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.menuOpen) {
      this.menuOpen = false;
    }
  }

   filterByType(type: string) {
    if (!type) return;
    
    this.normalProducts = this.allProducts.filter(
      (p) => p.type === type && !p.featured
    );
    this.featuredProduct = this.allProducts.find(
      (p) => p.type === type && p.featured
    );
    this.menuOpen = false;
  }

  resetFilter() {
    this.normalProducts = this.allProducts.filter((p) => !p.featured);
    this.featuredProduct = this.allProducts.find((p) => p.featured);
    this.menuOpen = false; // Close menu after selection
  }

  goHome() {
    this.resetFilter();
    this.router.navigate(['/']);
    this.closeMenu(); // Close menu
  }

  goLogin() {
    this.router.navigate(['/login']);
    this.closeMenu(); // Close menu
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

    if (item && product._id) {
      this.cartService.removeFromCart(product._id, item.size || '');
    }
  }

  filterByTypeAndClose(type: string) {
  this.filterByType(type);
  this.closeMenu();
}

// New method to reset filter and close menu
resetFilterAndClose() {
  this.resetFilter();
  this.closeMenu();
}

// New method to navigate to login and close menu
goLoginAndClose() {
  this.goLogin();
  this.closeMenu();
}

// New method to navigate to cart and close menu
goToCartAndClose() {
  this.goToCart();
  this.closeMenu();
}

closeMenu() {
  this.menuOpen = false;
}
buyNow(product: Product) {
  let selectedSize: string = '';
  
  if (product.sizes && product.sizes.length > 0) {
    selectedSize = prompt(
      `Available sizes: ${product.sizes.join(', ')}\nEnter your size:`
    ) || '';
    
    if (selectedSize && !product.sizes.includes(selectedSize)) {
      alert('Invalid size selected.');
      return;
    }
  }
   this.cartService.buyNow(product, selectedSize);
  
  // Navigate to checkout
  this.router.navigate(['/checkout']);
  this.closeMenu()
}

  getCartQuantity(product: Product): number {
    const item = this.cartService
      .getCartItems()
      .find((i) => i.product._id === product._id);
    return item ? item.quantity : 0;
  }

  goToCart() {
   this.router.navigate(['/checkout']);
  this.closeMenu();
  }

  // Add this method to your ProductListComponent class
handleBuyNow() {
  if (this.cartCount > 0) {
    // If items are in cart, navigate to checkout
    this.router.navigate(['/checkout']);
  } else {
    // If cart is empty, scroll to products section
    const productsSection = document.querySelector('.product-container');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback if product container not found
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }
  this.closeMenu();
}

handleShopNow() {
  const productsSection = document.querySelector('.product-container');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    // Fallback if product container not found
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}