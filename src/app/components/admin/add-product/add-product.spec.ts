import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss']
})
export class AddProductComponent {
  product: Product = this.getDefaultProduct();

  // ✅ Default product factory
  private getDefaultProduct(): Product {
    return {
     title: '',
  description: '',
  price: undefined as number | undefined,
  imageUrl: '',
  features: [] as string[],
  featured: false,
  quantity: 0,
  sizes: [] as string[],
  discount: 0,
  type: ''
    };
  }

  onSubmit() {
    console.log('Product Added:', this.product);
    alert(`${this.product.title} added successfully! 🎉`);

    // Reset form
    this.product = this.getDefaultProduct();
  }
}
