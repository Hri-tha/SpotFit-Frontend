// models/product.ts - UPDATED
export interface Product {
  _id?: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  available?: boolean;
  featured?: boolean;
  heroBanner?: boolean;
  bannerOrder?: number;
  features?: string[];
  quantity: number;
  sizes?: string[];
  discount?: number;
  type?: string;
  
  // ✅ NEW: Rating properties
  averageRating?: number;
  totalRatings?: number;
  ratings?: UserRating[];
  
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ NEW: User Rating Interface
export interface UserRating {
  userId: string;
  userName: string;
  rating: number; // 1-5
  review?: string;
  orderId: string;
  createdAt: Date;
}