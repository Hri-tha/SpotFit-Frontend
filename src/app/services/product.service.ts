// services/product.service.ts - PRODUCTION READY
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product, UserRating } from '../models/product';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  api = `${environment.apiUrl}/products`;
  
  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.api).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        return throwError(() => new Error('Failed to fetch products'));
      })
    );
  }

  // ✅ Get hero banners
  getHeroBanners(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/banner/hero`);
  }

  add(product: Partial<Product>, files?: File[]) {
    const form = new FormData();
    form.append('title', product.title || '');
    form.append('description', product.description || '');
    form.append('price', String(product.price ?? 0));
    if (product.type) form.append('type', product.type);
    if (product.heroBanner !== undefined) form.append('heroBanner', String(product.heroBanner));
    if (product.bannerOrder) form.append('bannerOrder', String(product.bannerOrder));

    if (product.category) form.append('category', product.category);
    
    // ✅ Handle multiple files
    if (files && files.length > 0) {
      files.forEach(file => {
        form.append('images', file);
      });
    } else if (product.imageUrl) {
      form.append('imageUrl', product.imageUrl);
    }

    // ✅ Arrays (always stringify for backend)
    if (product.features) form.append('features', JSON.stringify(product.features));
    if (product.sizes) form.append('sizes', JSON.stringify(product.sizes));

    // ✅ Booleans & Numbers
    form.append('featured', String(product.featured ?? false));
    form.append('quantity', String(product.quantity ?? 0));
    form.append('discount', String(product.discount ?? 0));

    return this.http.post<Product>(this.api, form);
  }

  // ✅ Upload multiple images
  uploadMultipleImages(files: File[]): Observable<{imageUrls: string[]}> {
    const form = new FormData();
    files.forEach(file => {
      form.append('images', file);
    });
    return this.http.post<{imageUrls: string[]}>(`${this.api}/upload-multiple`, form);
  }

  // ✅ Submit rating for a product
  submitRating(productId: string, ratingData: {
    rating: number;
    review?: string;
    orderId: string;
  }): Observable<Product> {
    return this.http.post<Product>(`${this.api}/${productId}/rate`, ratingData);
  }

  // ✅ Get user's rating for a product
  getUserRating(productId: string): Observable<UserRating | null> {
    return this.http.get<UserRating | null>(`${this.api}/${productId}/user-rating`);
  }

  // ✅ Check if user can rate product
  canUserRate(productId: string): Observable<{ canRate: boolean; orderId?: string }> {
    return this.http.get<{ canRate: boolean; orderId?: string }>(
      `${this.api}/${productId}/can-rate`
    );
  }

  // ❌ REMOVED: simulateDelivery method (test only)
}