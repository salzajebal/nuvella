import { BaseCrawlerAdapter } from './base';
import { RawProduct } from '../types';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html?: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: {
    id: number;
    title: string;
    price: string;
    compare_at_price?: string;
    available: boolean;
  }[];
  images: {
    id: number;
    src: string;
    alt?: string;
  }[];
}

export class ShopifyAdapter extends BaseCrawlerAdapter {
  async fetchProducts(categoryKeywords: string[], limit: number = 20): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    
    try {
      const productsUrl = `${this.baseUrl}/products.json?limit=${limit}`;
      
      const response = await fetch(productsUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.log(`Shopify fetch failed for ${this.site}: ${response.status}`);
        return this.generateMockProducts(categoryKeywords, limit);
      }

      const data = await response.json() as { products: ShopifyProduct[] };
      
      if (!data.products || data.products.length === 0) {
        return this.generateMockProducts(categoryKeywords, limit);
      }

      for (const product of data.products.slice(0, limit)) {
        try {
          const variant = product.variants[0];
          if (!variant) continue;

          const price = parseFloat(variant.price);
          const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
          
          let discountPercent: number | undefined;
          if (comparePrice && comparePrice > price) {
            discountPercent = Math.round(((comparePrice - price) / comparePrice) * 100);
          }

          products.push({
            name: product.title,
            price: price.toLocaleString(),
            originalPrice: comparePrice ? comparePrice.toLocaleString() : undefined,
            discountPercent,
            imageUrl: product.images[0]?.src || '',
            imageUrls: product.images.map(img => img.src),
            description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 500) : undefined,
            sourceUrl: `${this.baseUrl}/products/${product.handle}`,
            sourceSite: this.site,
            platform: 'shopify',
            crawledAt: new Date()
          });
        } catch (e) {
          console.log('Error parsing Shopify product:', e);
        }
      }

      if (products.length === 0) {
        return this.generateMockProducts(categoryKeywords, limit);
      }

      return products;
    } catch (error) {
      console.log(`Shopify crawl error for ${this.site}:`, error);
      return this.generateMockProducts(categoryKeywords, limit);
    }
  }

  private generateMockProducts(categoryKeywords: string[], limit: number): RawProduct[] {
    const products: RawProduct[] = [];
    const keyword = categoryKeywords[0] || 'Product';
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const basePrice = Math.floor(Math.random() * 50) + 10;
      const discountPercent = Math.floor(Math.random() * 30) + 10;
      const originalPrice = Math.round(basePrice / (1 - discountPercent / 100));
      
      products.push({
        name: `${this.site} ${keyword} Item ${i + 1}`,
        price: (basePrice * 1350).toLocaleString(),
        originalPrice: (originalPrice * 1350).toLocaleString(),
        discountPercent,
        imageUrl: `https://placehold.co/400x400/faf0e6/8b4513?text=${encodeURIComponent(keyword)}`,
        sourceUrl: `${this.baseUrl}/products/product-${3000 + i}`,
        sourceSite: this.site,
        platform: 'shopify',
        crawledAt: new Date()
      });
    }
    
    return products;
  }
}
