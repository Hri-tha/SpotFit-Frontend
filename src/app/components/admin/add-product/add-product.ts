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
  features: [] as string[],
  featured: false,
  quantity: 0,
  sizes: [] as string[],
  discount: 0,
  type: '' // ✅ new field
};


  newFeature: string = '';
  newSize: string = '';
  file?: File;

  // ✅ Features
  addFeature() {
    if (this.newFeature.trim()) {
      this.product.features.push(this.newFeature.trim());
      this.newFeature = '';
    }
  }
  removeFeature(i: number) {
    this.product.features.splice(i, 1);
  }

  // ✅ Sizes
  addSize() {
    if (this.newSize.trim() && !this.product.sizes.includes(this.newSize.trim().toUpperCase())) {
      this.product.sizes.push(this.newSize.trim().toUpperCase());
      this.newSize = '';
    }
  }
  removeSize(i: number) {
    this.product.sizes.splice(i, 1);
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  // ✅ Submit
  onSubmit() {
    const productToSubmit = { 
      ...this.product, 
      price: this.product.price ?? 0,
      quantity: Number(this.product.quantity),
      discount: Number(this.product.discount)
    };

    this.productService.add(productToSubmit, this.file).subscribe({
      next: (res) => {
        alert(`✅ ${res.title} added successfully!`);
        this.product = { 
          title: '', description: '', price: undefined, imageUrl: '', 
          features: [], featured: false, quantity: 0, sizes: [], discount: 0,
          type: '' 
        };
        this.newFeature = '';
        this.newSize = '';
        this.file = undefined;
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to add product');
      }
    });
  }
}
