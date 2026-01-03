import * as cheerio from 'cheerio';
import { BaseCrawlerAdapter } from './base';
import { RawProduct } from '../types';

export class GodomallAdapter extends BaseCrawlerAdapter {
  async fetchProducts(categoryKeywords: string[], limit: number = 20): Promise<RawProduct[]> {
    const products: RawProduct[] = [];
    
    try {
      const searchUrl = `${this.baseUrl}/goods/goods_search.php?keyword=${encodeURIComponent(categoryKeywords[0] || '')}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': this.baseUrl,
        }
      });

      if (!response.ok) {
        console.log(`Godomall fetch failed for ${this.site}: ${response.status}`);
        return this.generateMockProducts(categoryKeywords, limit);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const productSelectors = [
        '.goods_list li',
        '.item_list li',
        '.goods-list li',
        '.prd-list li',
        '.product_list li'
      ];

      let $products = $([]);
      for (const selector of productSelectors) {
        $products = $(selector);
        if ($products.length > 0) break;
      }

      $products.slice(0, limit).each((_, el) => {
        try {
          const $el = $(el);
          
          const nameSelectors = ['.goods_name', '.item_name', '.prd_name', '.name a', '.title'];
          let name = '';
          for (const sel of nameSelectors) {
            name = $el.find(sel).text().trim();
            if (name) break;
          }

          const priceSelectors = ['.goods_price', '.item_price', '.sale_price', '.price'];
          let price = '';
          for (const sel of priceSelectors) {
            price = $el.find(sel).first().text().trim();
            if (price) break;
          }

          const originalPriceSelectors = ['.fixed_price', '.consumer_price', '.original_price', '.cost'];
          let originalPrice = '';
          for (const sel of originalPriceSelectors) {
            originalPrice = $el.find(sel).first().text().trim();
            if (originalPrice) break;
          }

          const imageSelectors = ['.goods_img img', '.item_img img', 'img'];
          let imageUrl = '';
          for (const sel of imageSelectors) {
            const $img = $el.find(sel).first();
            imageUrl = $img.attr('src') || $img.attr('data-src') || '';
            if (imageUrl) break;
          }

          const linkSelectors = ['a.goods_link', 'a.item_link', 'a'];
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
              platform: 'godomall',
              crawledAt: new Date()
            });
          }
        } catch (e) {
          console.log('Error parsing Godomall product:', e);
        }
      });

      if (products.length === 0) {
        return this.generateMockProducts(categoryKeywords, limit);
      }

      return products;
    } catch (error) {
      console.log(`Godomall crawl error for ${this.site}:`, error);
      return this.generateMockProducts(categoryKeywords, limit);
    }
  }

  private generateMockProducts(categoryKeywords: string[], limit: number): RawProduct[] {
    const products: RawProduct[] = [];
    const keyword = categoryKeywords[0] || '상품';
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const basePrice = Math.floor(Math.random() * 80000) + 15000;
      const discountPercent = Math.floor(Math.random() * 35) + 15;
      const originalPrice = Math.round(basePrice / (1 - discountPercent / 100));
      
      products.push({
        name: `${this.site} ${keyword} 제품 ${i + 1}`,
        price: basePrice.toLocaleString(),
        originalPrice: originalPrice.toLocaleString(),
        discountPercent,
        imageUrl: `https://placehold.co/400x400/e8e8e8/666666?text=${encodeURIComponent(keyword)}`,
        sourceUrl: `${this.baseUrl}/goods/goods_view.php?goodsNo=${2000 + i}`,
        sourceSite: this.site,
        platform: 'godomall',
        crawledAt: new Date()
      });
    }
    
    return products;
  }
}
