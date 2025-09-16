export interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  available?: boolean;
  featured?: boolean;
  features?: string[];
  quantity: number;
  sizes?: string[];
  discount?: number;
  type?: string;
}
