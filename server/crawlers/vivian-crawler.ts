import * as cheerio from 'cheerio';

export interface VivianProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  imageUrls: string[];
  descriptionImages: string[];
  sourceUrl: string;
  category: string;
  description?: string;
}

export interface VivianCrawlResult {
  category: string;
  categoryId: number;
  products: VivianProduct[];
  success: boolean;
  error?: string;
}

const VIVIAN_BASE_URL = 'https://vivian-mall.com';

const USD_TO_KRW_RATE = 1450;

const CATEGORY_MAPPING: Record<number, string> = {
  10: 'home_interior',
  20: 'beauty',
  30: 'electronics',
  40: 'living',
  50: 'health',
  60: 'luxury',
  70: 'kids'
};

const CATEGORY_NAMES: Record<number, string> = {
  10: '홈 인테리어',
  20: '뷰티',
  30: '가전/디지털',
  40: '생활용품',
  50: '헬스/건강식품',
  60: '럭셔리/명품',
  70: '유아/완구'
};

export const VIVIAN_CATEGORIES = CATEGORY_NAMES;

function convertUsdToKrw(usdPrice: number): number {
  const krwPrice = usdPrice * USD_TO_KRW_RATE;
  return Math.round(krwPrice / 100) * 100;
}

function parseAndConvertPrice(priceStr: string): string {
  if (!priceStr) return '0';
  
  const cleanedStr = priceStr.replace(/[,\s]/g, '');
  
  const dollarMatch = cleanedStr.match(/\$\s*([\d.]+)/);
  if (dollarMatch) {
    const usdAmount = parseFloat(dollarMatch[1]);
    if (!isNaN(usdAmount) && usdAmount > 0) {
      const krwAmount = convertUsdToKrw(usdAmount);
      return String(krwAmount);
    }
  }
  
  const numericMatch = cleanedStr.match(/([\d.]+)/);
  if (numericMatch) {
    const value = parseFloat(numericMatch[1]);
    if (!isNaN(value)) {
      if (priceStr.includes('₩') || priceStr.includes('원') || value >= 10000) {
        return String(Math.round(value));
      }
      const krwAmount = convertUsdToKrw(value);
      return String(krwAmount);
    }
  }
  
  return '0';
}

function absoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `${VIVIAN_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed after retries');
}

async function fetchProductDetail(sourceUrl: string): Promise<{
  imageUrls: string[];
  descriptionImages: string[];
  description: string;
}> {
  try {
    const html = await fetchWithRetry(sourceUrl);
    const $ = cheerio.load(html);
    
    const imageUrls: string[] = [];
    const descriptionImages: string[] = [];
    const seenUrls = new Set<string>();
    
    $('#sit_pvi img, .product-image img, .item-photo img, .prd-detail-img img, .main-image img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo')) {
          seenUrls.add(fullUrl);
          imageUrls.push(fullUrl);
        }
      }
    });
    
    $('.thumbnail img, .thumb-list img, .slider img, .gallery img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo')) {
          seenUrls.add(fullUrl);
          imageUrls.push(fullUrl);
        }
      }
    });
    
    $('#sit_inf img, .product-description img, .item-detail img, .detail-content img, #sit_inf_explan img, .info-box img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo') && !fullUrl.includes('button')) {
          seenUrls.add(fullUrl);
          descriptionImages.push(fullUrl);
        }
      }
    });
    
    let description = '';
    const descText = $('#sit_inf, .product-description, .item-detail, .detail-content').text().trim();
    if (descText) {
      description = descText.substring(0, 500).replace(/\s+/g, ' ');
    }
    
    return {
      imageUrls: imageUrls.slice(0, 10),
      descriptionImages: descriptionImages.slice(0, 20),
      description
    };
  } catch (error) {
    console.error(`[Vivian Crawler] Error fetching detail page ${sourceUrl}:`, error);
    return {
      imageUrls: [],
      descriptionImages: [],
      description: ''
    };
  }
}

export async function crawlVivianCategory(categoryId: number, limit: number = 20): Promise<VivianCrawlResult> {
  const category = CATEGORY_MAPPING[categoryId];
  if (!category) {
    return {
      category: '',
      categoryId,
      products: [],
      success: false,
      error: `Unknown category ID: ${categoryId}`
    };
  }

  try {
    const url = `${VIVIAN_BASE_URL}/shop/list.php?ca_id=${categoryId}`;
    console.log(`[Vivian Crawler] Fetching: ${url}`);
    
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    const basicProducts: { id: string; name: string; price: string; originalPrice?: string; imageUrl: string; sourceUrl: string }[] = [];

    $('li.prd-item, .product-item, .sct_li').each((index, element) => {
      if (basicProducts.length >= limit) return false;

      const $el = $(element);
      
      const $link = $el.find('a[href*="item.php"]').first();
      const href = $link.attr('href') || '';
      const productIdMatch = href.match(/it_id=(\d+)/);
      const productId = productIdMatch ? productIdMatch[1] : `vivian_${Date.now()}_${index}`;
      
      const name = $el.find('.prd-name, .name, .item-name, .sct_txt a').text().trim() ||
                   $el.find('a[href*="item.php"]').text().trim() ||
                   $el.find('.title').text().trim();
      
      const priceText = $el.find('.prd-price, .price, .sale-price, .sct_price').text().trim();
      const price = parseAndConvertPrice(priceText);
      
      const originalPriceText = $el.find('.original-price, .base-price, del').text().trim();
      const originalPrice = originalPriceText ? parseAndConvertPrice(originalPriceText) : undefined;
      
      let imageUrl = $el.find('img').first().attr('src') || 
                     $el.find('img').first().attr('data-src') || '';
      
      imageUrl = absoluteUrl(imageUrl);
      
      const sourceUrl = absoluteUrl(href);
      
      if (name && (price !== '0' || imageUrl)) {
        basicProducts.push({
          id: productId,
          name: name.substring(0, 200),
          price,
          originalPrice,
          imageUrl,
          sourceUrl
        });
      }
    });

    if (basicProducts.length === 0) {
      $('a[href*="item.php"]').each((index, element) => {
        if (basicProducts.length >= limit) return false;
        
        const $el = $(element);
        const href = $el.attr('href') || '';
        const productIdMatch = href.match(/it_id=(\d+)/);
        if (!productIdMatch) return;
        
        const productId = productIdMatch[1];
        const $img = $el.find('img').first();
        const imageUrl = absoluteUrl($img.attr('src') || '');
        const name = $img.attr('alt') || $el.text().trim();
        
        const $parent = $el.closest('li, div, article');
        const priceText = $parent.find('.price, [class*="price"]').text() || '';
        const price = parseAndConvertPrice(priceText);
        
        if (name && imageUrl) {
          basicProducts.push({
            id: productId,
            name: name.substring(0, 200),
            price: price || '0',
            imageUrl,
            sourceUrl: absoluteUrl(href)
          });
        }
      });
    }

    console.log(`[Vivian Crawler] Found ${basicProducts.length} products in ${CATEGORY_NAMES[categoryId]}, fetching details...`);
    
    const products: VivianProduct[] = [];
    
    for (let i = 0; i < basicProducts.length; i++) {
      const basicProduct = basicProducts[i];
      
      console.log(`[Vivian Crawler] Fetching detail ${i + 1}/${basicProducts.length}: ${basicProduct.name.substring(0, 30)}...`);
      
      const detail = await fetchProductDetail(basicProduct.sourceUrl);
      
      const allImages = [basicProduct.imageUrl, ...detail.imageUrls].filter(Boolean);
      const uniqueImages = Array.from(new Set(allImages));
      
      products.push({
        id: basicProduct.id,
        name: basicProduct.name,
        price: basicProduct.price,
        originalPrice: basicProduct.originalPrice,
        imageUrl: uniqueImages[0] || basicProduct.imageUrl,
        imageUrls: uniqueImages,
        descriptionImages: detail.descriptionImages,
        sourceUrl: basicProduct.sourceUrl,
        category,
        description: detail.description || `에스텔라 프리미엄 ${CATEGORY_NAMES[categoryId]} 상품입니다.`
      });
      
      if (i < basicProducts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log(`[Vivian Crawler] Completed ${products.length} products with details in ${CATEGORY_NAMES[categoryId]}`);
    
    return {
      category,
      categoryId,
      products,
      success: true
    };
  } catch (error) {
    console.error(`[Vivian Crawler] Error crawling category ${categoryId}:`, error);
    return {
      category,
      categoryId,
      products: [],
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function crawlAllVivianCategories(
  productsPerCategory: number = 20,
  onProgress?: (progress: { current: number; total: number; category: string }) => void
): Promise<VivianCrawlResult[]> {
  const categoryIds = Object.keys(CATEGORY_MAPPING).map(Number);
  const results: VivianCrawlResult[] = [];
  
  for (let i = 0; i < categoryIds.length; i++) {
    const categoryId = categoryIds[i];
    const categoryName = CATEGORY_NAMES[categoryId];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: categoryIds.length,
        category: categoryName
      });
    }
    
    console.log(`[Vivian Crawler] ${i + 1}/${categoryIds.length}: ${categoryName}`);
    
    const result = await crawlVivianCategory(categoryId, productsPerCategory);
    results.push(result);
    
    if (i < categoryIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

export function getVivianCategoryIds(): number[] {
  return Object.keys(CATEGORY_MAPPING).map(Number);
}

export function getVivianCategoryName(categoryId: number): string {
  return CATEGORY_NAMES[categoryId] || `Category ${categoryId}`;
}
