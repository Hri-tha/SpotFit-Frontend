// services/seo.service.ts
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);

  setSeoData(seoData: SeoData): void {
    const { title, description, keywords, image, url } = seoData;
    
    // Set title
    this.title.setTitle(title);
    
    // Update meta tags
    this.updateTag('description', description);
    this.updateTag('keywords', keywords || 'gym wear, workout clothes, fitness apparel, Nike shoes, training lowers, sports sandos');
    
    // Open Graph tags
    this.updateTag('og:title', title);
    this.updateTag('og:description', description);
    this.updateTag('og:image', image || 'https://spotfit.in/assets/spotfit-gymwear-preview.jpg');
    this.updateTag('og:url', url || 'https://spotfit.in');
    this.updateTag('og:type', 'website');
    
    // Twitter Card tags
    this.updateTag('twitter:card', 'summary_large_image');
    this.updateTag('twitter:title', title);
    this.updateTag('twitter:description', description);
    this.updateTag('twitter:image', image || 'https://spotfit.in/assets/spotfit-gymwear-preview.jpg');
  }

  setDefaultSeo(): void {
    this.setSeoData({
      title: 'SpotFit - Premium Gym Wear, Workout Clothes & Fitness Apparel Online',
      description: 'Buy premium gym clothing - Nike workout shoes, training lowers, sports sandos, fitness apparel. Best quality gym wear at affordable prices. Free shipping available.',
      keywords: 'gym wear, workout clothes, fitness apparel, Nike shoes, training lowers, sports sandos, gym clothing, workout gear',
      image: 'https://spotfit.in/assets/spotfit-gymwear-preview.jpg',
      url: 'https://spotfit.in'
    });
  }

  setProductSeo(productName: string, productDescription: string, productImage: string): void {
    this.setSeoData({
      title: `${productName} - Buy Online | SpotFit Gym Wear`,
      description: `Buy ${productName} - ${productDescription}. Premium quality gym wear with free shipping. Best prices guaranteed.`,
      keywords: `${productName}, gym wear, workout clothes, fitness apparel`,
      image: productImage,
      url: `https://spotfit.in/products/${productName.toLowerCase().replace(/\s+/g, '-')}`
    });
  }

  private updateTag(name: string, content: string | undefined): void {
    if (!content) return;
    
    if (this.meta.getTag(`name="${name}"`)) {
      this.meta.updateTag({ name, content });
    } else if (this.meta.getTag(`property="${name}"`)) {
      this.meta.updateTag({ property: name, content });
    } else {
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        this.meta.addTag({ property: name, content });
      } else {
        this.meta.addTag({ name, content });
      }
    }
  }
}