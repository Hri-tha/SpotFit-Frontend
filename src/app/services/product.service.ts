import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  api = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.api);
  }

  add(product: Partial<Product>, file?: File) {
    const form = new FormData();
    form.append('title', product.title || '');
    form.append('description', product.description || '');
    form.append('price', String(product.price ?? 0));
    if (product.type) form.append('type', product.type);


    if (product.category) form.append('category', product.category);
    if (file) {
      form.append('image', file);
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
}
