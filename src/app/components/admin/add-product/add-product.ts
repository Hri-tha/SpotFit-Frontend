// add-product.component.ts - UPDATED
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss']
})
export class AddProductComponent {
  constructor(private productService: ProductService) {}

  product = {
    title: '',
    description: '',
    price: undefined as number | undefined,
    imageUrl: '',
    images: [] as string[], // ✅ NEW: Multiple images
    features: [] as string[],
    featured: false,
    heroBanner: false, // ✅ NEW: Hero banner flag
    bannerOrder: 0, // ✅ NEW: Banner order
    quantity: 0,
    sizes: [] as string[],
    discount: 0,
    type: '' 
  };

  newFeature: string = '';
  newSize: string = '';
  files: File[] = []; // ✅ NEW: Multiple files
  imagePreviews: string[] = []; // ✅ NEW: Image previews

  // Features
  addFeature() {
    if (this.newFeature.trim()) {
      this.product.features.push(this.newFeature.trim());
      this.newFeature = '';
    }
  }
  removeFeature(i: number) {
    this.product.features.splice(i, 1);
  }

  // Sizes
  addSize() {
    if (this.newSize.trim() && !this.product.sizes.includes(this.newSize.trim().toUpperCase())) {
      this.product.sizes.push(this.newSize.trim().toUpperCase());
      this.newSize = '';
    }
  }
  removeSize(i: number) {
    this.product.sizes.splice(i, 1);
  }

  // ✅ NEW: Handle multiple file selection
  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        this.files.push(selectedFiles[i]);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(selectedFiles[i]);
      }
    }
  }

  // ✅ NEW: Remove image
  removeImage(index: number) {
    this.files.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  // Submit
  onSubmit() {
    const productToSubmit = { 
      ...this.product, 
      price: this.product.price ?? 0,
      quantity: Number(this.product.quantity),
      discount: Number(this.product.discount),
      bannerOrder: Number(this.product.bannerOrder)
    };

    this.productService.add(productToSubmit, this.files.length > 0 ? this.files : undefined).subscribe({
      next: (res) => {
        alert(`✅ ${res.title} added successfully!`);
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to add product');
      }
    });
  }

  // ✅ NEW: Reset form
  resetForm() {
    this.product = { 
      title: '', description: '', price: undefined, imageUrl: '', 
      images: [], features: [], featured: false, heroBanner: false,
      bannerOrder: 0, quantity: 0, sizes: [], discount: 0,
      type: '' 
    };
    this.newFeature = '';
    this.newSize = '';
    this.files = [];
    this.imagePreviews = [];
  }
}