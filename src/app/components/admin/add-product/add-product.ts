import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.html',
  styleUrls: ['./add-product.scss'],
})
export class AddProductComponent {
  constructor(private productService: ProductService) {}

  product = {
    title: '',
    description: '',
    price: undefined as number | undefined,
    imageUrl: '',
    images: [] as string[],
    features: [] as string[],
    featured: false,
    heroBanner: false,
    bannerOrder: 0,
    quantity: 0,
    sizes: [] as string[],
    discount: 0,
    type: '' 
  };

  newFeature: string = '';
  newSize: string = '';
  files: File[] = [];
  imagePreviews: string[] = [];
  isSubmitting: boolean = false;
  isDragging: boolean = false;
  showImageModal: boolean = false;
  selectedImage: string = '';

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

  // File Handling
  onFileSelected(event: any) {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      this.processFiles(selectedFiles);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  private processFiles(fileList: FileList) {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check file type and size (5MB max)
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files');
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        continue;
      }

      this.files.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.files.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  viewImage(image: string) {
    this.selectedImage = image;
    this.showImageModal = true;
  }

  closeModal() {
    this.showImageModal = false;
    this.selectedImage = '';
  }

  getFileSize(index: number): string {
    const file = this.files[index];
    if (!file) return '0 KB';
    
    const sizeInKB = Math.round(file.size / 1024);
    return sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`;
  }

  // Submit
  onSubmit() {
    this.isSubmitting = true;
    
    const productToSubmit = { 
      ...this.product, 
      price: this.product.price ?? 0,
      quantity: Number(this.product.quantity),
      discount: Number(this.product.discount),
      bannerOrder: Number(this.product.bannerOrder)
    };

    this.productService.add(productToSubmit, this.files.length > 0 ? this.files : undefined).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert(`✅ ${res.title} added successfully!`);
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        alert('❌ Failed to add product');
      }
    });
  }

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