// models/product.ts - UPDATED
export interface Product {
  _id?: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[]; // ✅ NEW: Multiple images
  category?: string;
  available?: boolean;
  featured?: boolean;
  heroBanner?: boolean; // ✅ NEW: Hero banner flag
  bannerOrder?: number; // ✅ NEW: Banner order
  features?: string[];
  quantity: number;
  sizes?: string[];
  discount?: number;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}