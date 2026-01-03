import { RawProduct } from '../types';

export abstract class BaseCrawlerAdapter {
  protected site: string;
  protected baseUrl: string;
  protected userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];

  constructor(site: string, baseUrl: string) {
    this.site = site;
    this.baseUrl = baseUrl;
  }

  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  protected normalizePrice(priceStr: string): string {
    if (!priceStr) return '0';
    return priceStr.replace(/[^\d]/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }

  protected calculateDiscount(original: string, current: string): number {
    const originalNum = parseInt(original.replace(/[^\d]/g, ''), 10);
    const currentNum = parseInt(current.replace(/[^\d]/g, ''), 10);
    if (!originalNum || !currentNum || originalNum <= currentNum) return 0;
    return Math.round(((originalNum - currentNum) / originalNum) * 100);
  }

  protected normalizeImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return url;
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abstract fetchProducts(categoryKeywords: string[], limit?: number): Promise<RawProduct[]>;
}
