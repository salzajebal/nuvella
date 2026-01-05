import * as cheerio from 'cheerio';

export interface VivianProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  sourceUrl: string;
  category: string;
}

export interface VivianCrawlResult {
  category: string;
  categoryId: number;
  products: VivianProduct[];
  success: boolean;
  error?: string;
}

const VIVIAN_BASE_URL = 'https://vivian-mall.com';

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

function parsePrice(priceStr: string): string {
  if (!priceStr) return '0';
  const numericValue = priceStr.replace(/[^\d]/g, '');
  return numericValue || '0';
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
    
    const products: VivianProduct[] = [];

    $('li.prd-item, .product-item, .sct_li').each((index, element) => {
      if (products.length >= limit) return false;

      const $el = $(element);
      
      const $link = $el.find('a[href*="item.php"]').first();
      const href = $link.attr('href') || '';
      const productIdMatch = href.match(/it_id=(\d+)/);
      const productId = productIdMatch ? productIdMatch[1] : `vivian_${Date.now()}_${index}`;
      
      const name = $el.find('.prd-name, .name, .item-name, .sct_txt a').text().trim() ||
                   $el.find('a[href*="item.php"]').text().trim() ||
                   $el.find('.title').text().trim();
      
      const priceText = $el.find('.prd-price, .price, .sale-price, .sct_price').text().trim();
      const price = parsePrice(priceText);
      
      const originalPriceText = $el.find('.original-price, .base-price, del').text().trim();
      const originalPrice = originalPriceText ? parsePrice(originalPriceText) : undefined;
      
      let imageUrl = $el.find('img').first().attr('src') || 
                     $el.find('img').first().attr('data-src') || '';
      
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${VIVIAN_BASE_URL}${imageUrl}`;
      }
      
      const sourceUrl = href.startsWith('http') ? href : `${VIVIAN_BASE_URL}${href}`;
      
      if (name && (price !== '0' || imageUrl)) {
        products.push({
          id: productId,
          name: name.substring(0, 200),
          price,
          originalPrice,
          imageUrl,
          sourceUrl,
          category
        });
      }
    });

    if (products.length === 0) {
      $('a[href*="item.php"]').each((index, element) => {
        if (products.length >= limit) return false;
        
        const $el = $(element);
        const href = $el.attr('href') || '';
        const productIdMatch = href.match(/it_id=(\d+)/);
        if (!productIdMatch) return;
        
        const productId = productIdMatch[1];
        const $img = $el.find('img').first();
        const imageUrl = $img.attr('src') || '';
        const name = $img.attr('alt') || $el.text().trim();
        
        const $parent = $el.closest('li, div, article');
        const priceText = $parent.find('.price, [class*="price"]').text() || '';
        const price = parsePrice(priceText);
        
        if (name && imageUrl) {
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${VIVIAN_BASE_URL}${imageUrl}`;
          const fullSourceUrl = href.startsWith('http') ? href : `${VIVIAN_BASE_URL}${href}`;
          
          products.push({
            id: productId,
            name: name.substring(0, 200),
            price: price || '0',
            imageUrl: fullImageUrl,
            sourceUrl: fullSourceUrl,
            category
          });
        }
      });
    }

    console.log(`[Vivian Crawler] Found ${products.length} products in ${CATEGORY_NAMES[categoryId]}`);
    
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
