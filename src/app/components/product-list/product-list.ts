import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { RatingComponent } from '../rating/rating';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RatingComponent],
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
  showSizeModal: boolean = false;
  showSizeGuide: boolean = false;
  selectedProduct: Product | null = null;
  selectedSize: string = '';
  isBuyNowMode: boolean = false;
  sizeError: string = '';
  isLoggedIn: boolean = false; // Set this based on your authentication
  userDropdownOpen: boolean = false;
  currentUser: any = null;

  private authSubscription!: Subscription;
  private seoService = inject(SeoService);
  private authService = inject(AuthService);

  constructor(
    private svc: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    this.seoService.setDefaultSeo();
    this.loadHeroBanners();
    this.loadProducts();

    // 🔔 Subscribe to cart changes
    this.cartService.cart$.subscribe((items) => {
      this.cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
    });

    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      console.log('Auth state changed:', { isLoggedIn: this.isLoggedIn, user: this.currentUser });
    });

    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.currentUser = this.authService.currentUser$.value;
    }
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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



  // ✅ Open Size Modal - FIXED
  openSizeModal(product: Product, isBuyNow: boolean = false) {
    console.log('Opening size modal for product:', product);

    if (!product) {
      console.error('No product provided to size modal');
      return;
    }

    this.selectedProduct = product; // Use the actual product reference
    this.isBuyNowMode = isBuyNow;
    this.selectedSize = '';
    this.sizeError = '';
    this.showSizeModal = true;

    console.log('Modal product data:', this.selectedProduct);
    console.log('Product image URL:', this.getProductImage(this.selectedProduct));
  }

  closeSizeModal() {
    this.showSizeModal = false;
    this.selectedProduct = null;
    this.selectedSize = '';
    this.sizeError = '';
  }
  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';

    const name = this.currentUser.name || this.currentUser.email || 'User';
    return name
      .split(' ')
      .map((part: string) => part.charAt(0).toUpperCase()) // Add type annotation here
      .join('')
      .substring(0, 2);
  }
  getUserName(): string {
    if (!this.currentUser) return 'User';
    return this.currentUser.name || this.currentUser.email.split('@')[0];
  }

  goToProfile(): void {
   this.userDropdownOpen = false;
  this.router.navigate(['/profile']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
    this.userDropdownOpen = false;
  }

  logout(): void {
    this.userDropdownOpen = false;
    this.isLoggedIn = false;
    this.currentUser = null;
    // Add your logout logic here
    console.log('User logged out');
  }

  goToProfileAndClose(): void {
    this.closeMenu();
    this.goToProfile();
  }

  goToProducts(): void {
    this.resetFilter();
    this.router.navigate(['/']);
  }

  goToSale(): void {
    // Filter products with discount
    this.normalProducts = this.allProducts.filter(p =>
      p.discount && p.discount > 0 && !p.featured
    );
    this.featuredProduct = this.allProducts.find(p =>
      p.discount && p.discount > 0 && p.featured
    );
    this.scrollToProducts();
  }

  goToShipping(): void {
    // You can create a shipping info page or show a modal
    alert('Shipping Information:\n\n• Standard Delivery: 3-5 business days\n• Express Delivery: 1-2 business days\n• Free shipping on orders above ₹999\n• Cash on Delivery available');
  }

  goToReturns(): void {
    alert('Return Policy:\n\n• 30-day return policy\n• Items must be unused with tags\n• Free returns for defective products\n• Refund processed within 7 business days');
  }

  scrollToProducts(): void {
    const productsSection = document.querySelector('.product-container');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  goToOrdersAndClose(): void {
    this.closeMenu();
    this.goToOrders();
  }

  logoutAndClose(): void {
    this.closeMenu();
    this.logout();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!(event.target as Element).closest('.user-profile')) {
      this.userDropdownOpen = false;
    }
  }

  // ✅ Select Size
  selectSize(size: string) {
    if (this.isSizeOutOfStock(size)) {
      return;
    }
    this.selectedSize = size;
    this.sizeError = '';
  }

  isSizeOutOfStock(size: string): boolean {
    if (!this.selectedProduct) return true;
    return this.selectedProduct.quantity === 0;
  }

  confirmSizeSelection() {
    if (!this.selectedSize && this.selectedProduct?.sizes && this.selectedProduct.sizes.length > 0) {
      this.sizeError = 'Please select a size';
      return;
    }

    if (this.selectedProduct) {
      if (this.isBuyNowMode) {
        this.buyNowWithSize(this.selectedProduct, this.selectedSize);
      } else {
        this.addToCartWithSize(this.selectedProduct, this.selectedSize);
      }
    }

    this.closeSizeModal();
  }

  addToCartWithSize(product: Product, size: string) {
    this.cartService.addToCart(product, size);
  }

  // ✅ Buy Now with Selected Size
  buyNowWithSize(product: Product, size: string) {
    this.cartService.buyNow(product, size);
    this.router.navigate(['/checkout']);
  }

  openSizeGuide() {
    this.showSizeGuide = true;
  }

  // ✅ Close Size Guide
  closeSizeGuide() {
    this.showSizeGuide = false;
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

  // ✅ FIXED: Get product image method
  getProductImage(product: Product, index: number = 0): string {
    if (!product) return 'assets/placeholder-image.jpg';

    // Check if product has multiple images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const safeIndex = index % product.images.length;
      return product.images[safeIndex] || product.imageUrl || 'assets/placeholder-image.jpg';
    }
    // Fallback to single imageUrl
    return product.imageUrl || 'assets/placeholder-image.jpg';
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
      ? Math.floor(p.price - (p.price * p.discount) / 100)
      : p.price;
  }

  // ✅ Ask for size before adding
  selectSizeAndAdd(product: Product) {
    this.openSizeModal(product, false);
  }

  increaseQuantity(product: Product) {
    const item = this.cartService
      .getCartItems()
      .find((i) => i.product._id === product._id);

    if (item) {
      this.cartService.addToCart(product, item.size || '');
    } else {
      this.openSizeModal(product, false);
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

  resetFilterAndClose() {
    this.resetFilter();
    this.closeMenu();
  }

  goLoginAndClose() {
    this.goLogin();
    this.closeMenu();
  }

  goToCartAndClose() {
    this.goToCart();
    this.closeMenu();
  }

  closeMenu() {
    this.menuOpen = false;
  }

  buyNow(product: Product) {
    if (this.cartCount === 0) {
      this.openSizeModal(product, true); // true = isBuyNowMode
    } else {
      // If cart has items, go directly to checkout
      this.router.navigate(['/checkout']);
    }
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

  handleBuyNow() {
    if (this.cartCount > 0) {
      this.router.navigate(['/checkout']);
    } else {
      const productsSection = document.querySelector('.product-container');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      } else {
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
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  onRatingSubmitted() {
    console.log('Rating submitted successfully');
    // Optional: You can refresh products or show a toast notification here
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}