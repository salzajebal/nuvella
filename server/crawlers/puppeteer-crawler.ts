import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { RawProduct } from './types';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  
  try {
    const executablePath = await chromium.executablePath();
    
    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
    });
    
    return browserInstance;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

interface CrawlConfig {
  site: string;
  baseUrl: string;
  searchPath: string;
  productSelector: string;
  nameSelector: string;
  priceSelector: string;
  originalPriceSelector?: string;
  imageSelector: string;
  linkSelector: string;
}

const SITE_CONFIGS: Record<string, CrawlConfig> = {
  'missdal.com': {
    site: 'missdal.com',
    baseUrl: 'https://missdal.com',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'polashop.co.kr': {
    site: 'polashop.co.kr',
    baseUrl: 'https://polashop.co.kr',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'sosohome.co.kr': {
    site: 'sosohome.co.kr',
    baseUrl: 'https://sosohome.co.kr',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'dailylike.co.kr': {
    site: 'dailylike.co.kr',
    baseUrl: 'https://dailylike.co.kr',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'hurumshop.com': {
    site: 'hurumshop.com',
    baseUrl: 'https://hurumshop.com',
    searchPath: '/goods/goods_search.php?keyword=',
    productSelector: '.goods_list li, .item_gallery_type li, .goods_item',
    nameSelector: '.goods_name, .item_name, .name',
    priceSelector: '.goods_price, .item_price, .price',
    originalPriceSelector: '.fixed_price, .consumer, del',
    imageSelector: '.goods_img img, .item_img img, img',
    linkSelector: 'a.goods_link, a[href*="goods_view"]'
  },
  'romand.co.kr': {
    site: 'romand.co.kr',
    baseUrl: 'https://romand.co.kr',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'xexymix.com': {
    site: 'xexymix.com',
    baseUrl: 'https://xexymix.com',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  },
  'innisfree.com': {
    site: 'innisfree.com',
    baseUrl: 'https://www.innisfree.com',
    searchPath: '/kr/ko/search?q=',
    productSelector: '.product-tile, .product-item, .prd-item',
    nameSelector: '.product-name, .prd-name, .name',
    priceSelector: '.product-price, .prd-price, .price',
    originalPriceSelector: '.original-price, .strike, del',
    imageSelector: '.product-image img, .prd-img img, img',
    linkSelector: 'a.product-link, a[href*="product"]'
  },
  'moremo.com': {
    site: 'moremo.com',
    baseUrl: 'https://moremo.com',
    searchPath: '/product/search.html?keyword=',
    productSelector: '.prdList li, .xans-product-listnormal li, .thumbnail li',
    nameSelector: '.name a, .prd_name, p.name',
    priceSelector: '.price span, .sale_price, .price',
    originalPriceSelector: '.origin, .consumer, del',
    imageSelector: 'img.thumb, .thumbnail img, .prdImg img, img',
    linkSelector: 'a.thumb, a[href*="product"]'
  }
};

export async function crawlProductsWithPuppeteer(
  site: string,
  keyword: string,
  limit: number = 20
): Promise<RawProduct[]> {
  const config = SITE_CONFIGS[site];
  if (!config) {
    console.log(`No config found for site: ${site}`);
    return [];
  }
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    browser = await getBrowser();
    page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    const searchUrl = `${config.baseUrl}${config.searchPath}${encodeURIComponent(keyword)}`;
    console.log(`Crawling: ${searchUrl}`);
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('img', { timeout: 5000 }).catch(() => {});
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const products = await page.evaluate((cfg: CrawlConfig, maxProducts: number) => {
      const results: Array<{
        name: string;
        price: string;
        originalPrice?: string;
        imageUrl: string;
        sourceUrl: string;
      }> = [];
      
      const productElements = document.querySelectorAll(cfg.productSelector);
      
      for (let i = 0; i < Math.min(productElements.length, maxProducts); i++) {
        const el = productElements[i] as HTMLElement;
        
        const nameEl = el.querySelector(cfg.nameSelector);
        const name = nameEl?.textContent?.trim() || '';
        
        const priceEl = el.querySelector(cfg.priceSelector);
        const price = priceEl?.textContent?.replace(/[^\d,]/g, '') || '';
        
        let originalPrice = '';
        if (cfg.originalPriceSelector) {
          const origEl = el.querySelector(cfg.originalPriceSelector);
          originalPrice = origEl?.textContent?.replace(/[^\d,]/g, '') || '';
        }
        
        const imgEl = el.querySelector(cfg.imageSelector) as HTMLImageElement;
        let imageUrl = '';
        if (imgEl) {
          imageUrl = imgEl.currentSrc || imgEl.src || imgEl.dataset.src || imgEl.dataset.original || imgEl.dataset.lazySrc || '';
        }
        
        const linkEl = el.querySelector(cfg.linkSelector) as HTMLAnchorElement;
        let sourceUrl = '';
        if (linkEl) {
          sourceUrl = linkEl.href || '';
        }
        
        if (name && price) {
          results.push({
            name,
            price,
            originalPrice: originalPrice || undefined,
            imageUrl,
            sourceUrl
          });
        }
      }
      
      return results;
    }, config, limit);
    
    console.log(`Found ${products.length} products from ${site}`);
    
    return products.map(p => {
      let imageUrl = p.imageUrl;
      if (imageUrl && imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = config.baseUrl + imageUrl;
      }
      
      let sourceUrl = p.sourceUrl;
      if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = config.baseUrl + sourceUrl;
      }
      
      const priceNum = parseInt(p.price.replace(/,/g, ''), 10) || 0;
      const origPriceNum = p.originalPrice ? parseInt(p.originalPrice.replace(/,/g, ''), 10) : 0;
      let discountPercent: number | undefined;
      if (origPriceNum > priceNum) {
        discountPercent = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
      }
      
      return {
        name: p.name,
        price: priceNum.toLocaleString(),
        originalPrice: origPriceNum ? origPriceNum.toLocaleString() : undefined,
        discountPercent,
        imageUrl,
        sourceUrl,
        sourceSite: site,
        platform: 'puppeteer',
        crawledAt: new Date()
      };
    });
    
  } catch (error) {
    console.error(`Puppeteer crawl error for ${site}:`, error);
    return [];
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}
