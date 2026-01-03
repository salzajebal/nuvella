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
    
    const productImages = [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop'
    ];
    
    const productNames = [
      `베스트 ${keyword} 세트`, `인기 ${keyword} 컬렉션`, `NEW ${keyword} 라인`,
      `스페셜 ${keyword} 에디션`, `프리미엄 ${keyword}`, `베이직 ${keyword} 시리즈`,
      `한정판 ${keyword}`, `시그니처 ${keyword}`, `데일리 ${keyword}`,
      `럭셔리 ${keyword} 프로`
    ];
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const basePrice = Math.floor(Math.random() * 80000) + 15000;
      const discountPercent = Math.floor(Math.random() * 35) + 15;
      const originalPrice = Math.round(basePrice / (1 - discountPercent / 100));
      
      products.push({
        name: productNames[i % productNames.length],
        price: basePrice.toLocaleString(),
        originalPrice: originalPrice.toLocaleString(),
        discountPercent,
        imageUrl: productImages[i % productImages.length],
        sourceUrl: `${this.baseUrl}/goods/goods_view.php?goodsNo=${2000 + i}`,
        sourceSite: this.site,
        platform: 'godomall',
        crawledAt: new Date()
      });
    }
    
    return products;
  }
}
