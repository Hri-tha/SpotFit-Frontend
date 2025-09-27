// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../environments/environment';
// import { Product } from '../models/product';
// import { catchError, Observable, throwError } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class ProductService {
//   api = `${environment.apiUrl}/products`;
  
//   constructor(private http: HttpClient) {}

//   getAll(): Observable<Product[]> {
//     return this.http.get<Product[]>(this.api).pipe(
//       catchError(error => {
//         console.error('Error fetching products:', error);
//         return throwError(() => new Error('Failed to fetch products'));
//       })
//     );
//   }

//   add(product: Partial<Product>, file?: File) {
//     const form = new FormData();
//     form.append('title', product.title || '');
//     form.append('description', product.description || '');
//     form.append('price', String(product.price ?? 0));
//     if (product.type) form.append('type', product.type);


//     if (product.category) form.append('category', product.category);
//     if (file) {
//       form.append('image', file);
//     } else if (product.imageUrl) {
//       form.append('imageUrl', product.imageUrl);
//     }

//     // ✅ Arrays (always stringify for backend)
//     if (product.features) form.append('features', JSON.stringify(product.features));
//     if (product.sizes) form.append('sizes', JSON.stringify(product.sizes));

//     // ✅ Booleans & Numbers
//     form.append('featured', String(product.featured ?? false));
//     form.append('quantity', String(product.quantity ?? 0));
//     form.append('discount', String(product.discount ?? 0));

//     return this.http.post<Product>(this.api, form);
//   }
// }

// services/product.service.ts - UPDATED
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
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

  // ✅ NEW: Get hero banners
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

  // ✅ NEW: Upload multiple images
  uploadMultipleImages(files: File[]): Observable<{imageUrls: string[]}> {
    const form = new FormData();
    files.forEach(file => {
      form.append('images', file);
    });
    return this.http.post<{imageUrls: string[]}>(`${this.api}/upload-multiple`, form);
  }
}