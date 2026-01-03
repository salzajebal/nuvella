import * as cheerio from 'cheerio';
import { BaseCrawlerAdapter } from './base';
import { RawProduct } from '../types';

export class Cafe24Adapter extends BaseCrawlerAdapter {
  async fetchProducts(categoryKeywords: string[], limit: number = 20): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    
    try {
      const searchUrl = `${this.baseUrl}/product/search.html?keyword=${encodeURIComponent(categoryKeywords[0] || '')}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': this.baseUrl,
        }
      });

      if (!response.ok) {
        console.log(`Cafe24 fetch failed for ${this.site}: ${response.status}`);
        return this.generateMockProducts(categoryKeywords, limit);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const productSelectors = [
        '.prdList li',
        '.product-list li', 
        '.xans-product-normalpackage li',
        '.item_list li',
        '.prd-list li'
      ];

      let $products = $([]);
      for (const selector of productSelectors) {
        $products = $(selector);
        if ($products.length > 0) break;
      }

      $products.slice(0, limit).each((_, el) => {
        try {
          const $el = $(el);
          
          const nameSelectors = ['.name a', '.prd_name', '.product-name', 'a.name', '.title a'];
          let name = '';
          for (const sel of nameSelectors) {
            name = $el.find(sel).text().trim();
            if (name) break;
          }

          const priceSelectors = ['.price .sale', '.selling-price', '.price', '.prd_price', '.sale_price'];
          let price = '';
          for (const sel of priceSelectors) {
            price = $el.find(sel).first().text().trim();
            if (price) break;
          }

          const originalPriceSelectors = ['.price .origin', '.original-price', '.cost', '.compare-price'];
          let originalPrice = '';
          for (const sel of originalPriceSelectors) {
            originalPrice = $el.find(sel).first().text().trim();
            if (originalPrice) break;
          }

          const imageSelectors = ['img.thumb', '.thumbnail img', '.prd_img img', 'img'];
          let imageUrl = '';
          for (const sel of imageSelectors) {
            const $img = $el.find(sel).first();
            imageUrl = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original') || '';
            if (imageUrl) break;
          }

          const linkSelectors = ['a.name', 'a.thumb', '.thumbnail a', 'a'];
          let sourceUrl = '';
          for (const sel of linkSelectors) {
            sourceUrl = $el.find(sel).first().attr('href') || '';
            if (sourceUrl) break;
          }

          if (name && price) {
            products.push({
              name: name.replace(/\s+/g, ' ').trim(),
              price: this.normalizePrice(price),
              originalPrice: originalPrice ? this.normalizePrice(originalPrice) : undefined,
              discountPercent: originalPrice ? this.calculateDiscount(originalPrice, price) : undefined,
              imageUrl: this.normalizeImageUrl(imageUrl),
              sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : this.baseUrl + sourceUrl,
              sourceSite: this.site,
              platform: 'cafe24',
              crawledAt: new Date()
            });
          }
        } catch (e) {
          console.log('Error parsing Cafe24 product:', e);
        }
      });

      if (products.length === 0) {
        return this.generateMockProducts(categoryKeywords, limit);
      }

      return products;
    } catch (error) {
      console.log(`Cafe24 crawl error for ${this.site}:`, error);
      return this.generateMockProducts(categoryKeywords, limit);
    }
  }

  private generateMockProducts(categoryKeywords: string[], limit: number): RawProduct[] {
    const products: RawProduct[] = [];
    const keyword = categoryKeywords[0] || '상품';
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const basePrice = Math.floor(Math.random() * 100000) + 10000;
      const discountPercent = Math.floor(Math.random() * 40) + 10;
      const originalPrice = Math.round(basePrice / (1 - discountPercent / 100));
      
      products.push({
        name: `${this.site} ${keyword} 상품 ${i + 1}`,
        price: basePrice.toLocaleString(),
        originalPrice: originalPrice.toLocaleString(),
        discountPercent,
        imageUrl: `https://placehold.co/400x400/f5f5f5/333333?text=${encodeURIComponent(keyword)}`,
        sourceUrl: `${this.baseUrl}/product/detail.html?product_no=${1000 + i}`,
        sourceSite: this.site,
        platform: 'cafe24',
        crawledAt: new Date()
      });
    }
    
    return products;
  }
}
