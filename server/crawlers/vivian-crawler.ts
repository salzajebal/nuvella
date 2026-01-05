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
  
  // Check for dollar sign
  const dollarMatch = cleanedStr.match(/\$\s*([\d.]+)/);
  if (dollarMatch) {
    const usdAmount = parseFloat(dollarMatch[1]);
    if (!isNaN(usdAmount) && usdAmount > 0) {
      const krwAmount = convertUsdToKrw(usdAmount);
      return String(krwAmount);
    }
  }
  
  // Extract numeric value - KRW prices on vivian-mall are prefixed with ₩
  const numericMatch = cleanedStr.match(/₩?\s*([\d,]+)/);
  if (numericMatch) {
    const valueStr = numericMatch[1].replace(/,/g, '');
    const value = parseFloat(valueStr);
    if (!isNaN(value)) {
      // Already in KRW if >= 1000 or has ₩ symbol
      if (priceStr.includes('₩') || priceStr.includes('원') || value >= 1000) {
        return String(Math.round(value));
      }
      // Otherwise assume USD and convert
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
      console.error(`[Vivian Crawler] Fetch attempt ${i + 1} failed for ${url}:`, error);
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
    
    // Main product images - gallery/slider images
    $('#sit_pvi img, .product-image img, .sit_pvi_big img, .swiper-slide img, .item-photo img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo') && fullUrl.includes('/data/')) {
          seenUrls.add(fullUrl);
          imageUrls.push(fullUrl);
        }
      }
    });
    
    // Thumbnail images
    $('.sit_pvi_thumb img, .thumbnail img, .thumb-list img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo') && fullUrl.includes('/data/')) {
          seenUrls.add(fullUrl);
          imageUrls.push(fullUrl);
        }
      }
    });
    
    // Description images - inside product detail/info section
    $('#sit_inf img, #sit_inf_explan img, .product-detail-content img, .detail-info img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const fullUrl = absoluteUrl(src);
        if (!seenUrls.has(fullUrl) && !fullUrl.includes('icon') && !fullUrl.includes('logo') && !fullUrl.includes('button')) {
          seenUrls.add(fullUrl);
          descriptionImages.push(fullUrl);
        }
      }
    });
    
    // Get product description
    let description = '';
    const descText = $('#sit_inf, .product-detail, .sit_inf_explan').text().trim();
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
  const categoryName = CATEGORY_NAMES[categoryId];
  
  if (!category) {
    console.error(`[Vivian Crawler] Unknown category ID: ${categoryId}`);
    return {
      category: '',
      categoryId,
      products: [],
      success: false,
      error: `Unknown category ID: ${categoryId}`
    };
  }

  console.log(`[Vivian Crawler] === Starting category crawl ===`);
  console.log(`[Vivian Crawler] Category ID: ${categoryId}`);
  console.log(`[Vivian Crawler] Category Name: ${categoryName}`);
  console.log(`[Vivian Crawler] Estella Category: ${category}`);
  console.log(`[Vivian Crawler] Limit: ${limit}`);

  try {
    // Fetch multiple pages to get more products
    const allProducts: VivianProduct[] = [];
    let page = 1;
    const maxPages = 30; // Safety cap to prevent infinite loops
    const seenProductIds = new Set<string>();
    
    while (allProducts.length < limit && page <= maxPages) {
      const url = `${VIVIAN_BASE_URL}/shop/list.php?ca_id=${categoryId}&page=${page}`;
      console.log(`[Vivian Crawler] Fetching page ${page}: ${url}`);
      
      let html: string;
      try {
        html = await fetchWithRetry(url);
      } catch (error) {
        console.error(`[Vivian Crawler] Failed to fetch page ${page}:`, error);
        break;
      }
      
      const $ = cheerio.load(html);
      let foundOnPage = 0;
      
      // Each product is in div.item-list
      const items = $('div.item-list');
      console.log(`[Vivian Crawler] Found ${items.length} items on page ${page}`);
      
      if (items.length === 0) {
        // No more products found
        break;
      }
      
      for (let i = 0; i < items.length && allProducts.length < limit; i++) {
        const element = items[i];
        const $el = $(element);
        
        // Get product link
        const $link = $el.find('a[href*="item.php"]').first();
        const href = $link.attr('href') || '';
        
        // Extract product ID from URL
        const productIdMatch = href.match(/it_id=(\d+)/);
        const productId = productIdMatch ? productIdMatch[1] : `vivian_${Date.now()}_${i}`;
        
        // Skip if we've already seen this product (prevents duplicates across pages)
        if (seenProductIds.has(productId)) {
          continue;
        }
        seenProductIds.add(productId);
        
        // Get product name from h5.product-name
        const name = $el.find('.product-name a').text().trim() ||
                     $el.find('.product-name').text().trim() ||
                     $el.find('h5 a').text().trim();
        
        if (!name) {
          console.log(`[Vivian Crawler] Skipping item without name`);
          continue;
        }
        
        // Get price from .title-price
        const priceText = $el.find('.title-price').text().trim() ||
                          $el.find('.product-price').text().trim();
        const price = parseAndConvertPrice(priceText);
        
        // Get original price if exists (strikethrough price)
        const originalPriceText = $el.find('.origin-price del, .original-price').text().trim();
        const originalPrice = originalPriceText ? parseAndConvertPrice(originalPriceText) : undefined;
        
        // Get image from .first-img img or any img in item
        let imageUrl = $el.find('.first-img img').attr('src') ||
                       $el.find('.product-img img').attr('src') ||
                       $el.find('img').first().attr('src') || '';
        
        imageUrl = absoluteUrl(imageUrl);
        
        // Build source URL
        const sourceUrl = href.startsWith('http') ? href : absoluteUrl(href);
        
        if (!imageUrl || !sourceUrl) {
          console.log(`[Vivian Crawler] Skipping item without image or link: ${name}`);
          continue;
        }
        
        // Fetch detail page for more images
        console.log(`[Vivian Crawler] Fetching details for: ${name}`);
        const detail = await fetchProductDetail(sourceUrl);
        
        // Combine images - use main image plus detail images
        const allImageUrls = [imageUrl];
        detail.imageUrls.forEach(url => {
          if (!allImageUrls.includes(url)) {
            allImageUrls.push(url);
          }
        });
        
        const product: VivianProduct = {
          id: productId,
          name,
          price,
          originalPrice,
          imageUrl,
          imageUrls: allImageUrls,
          descriptionImages: detail.descriptionImages,
          sourceUrl,
          category,
          description: detail.description || `${CATEGORY_NAMES[categoryId]} 상품입니다.`
        };
        
        allProducts.push(product);
        foundOnPage++;
        console.log(`[Vivian Crawler] ✓ Added: "${name.substring(0, 30)}..." → ${category} (₩${parseInt(price).toLocaleString()})`);
        
        // Small delay between detail page fetches to be polite
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      console.log(`[Vivian Crawler] Page ${page}: Found ${foundOnPage} products, total: ${allProducts.length}`);
      page++;
    }
    
    console.log(`[Vivian Crawler] === Category Complete ===`);
    console.log(`[Vivian Crawler] ${CATEGORY_NAMES[categoryId]} (${category}): ${allProducts.length} products`);
    console.log(`[Vivian Crawler] ========================`);
    
    return {
      category,
      categoryId,
      products: allProducts,
      success: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Vivian Crawler] Error crawling category ${categoryId}:`, errorMessage);
    return {
      category,
      categoryId,
      products: [],
      success: false,
      error: errorMessage
    };
  }
}

export async function crawlAllVivianCategories(productsPerCategory: number = 20): Promise<VivianCrawlResult[]> {
  const categoryIds = Object.keys(CATEGORY_MAPPING).map(Number);
  const results: VivianCrawlResult[] = [];
  
  console.log(`[Vivian Crawler] Starting batch crawl for ${categoryIds.length} categories, ${productsPerCategory} products each`);
  
  for (const categoryId of categoryIds) {
    console.log(`[Vivian Crawler] Crawling category: ${CATEGORY_NAMES[categoryId]}`);
    const result = await crawlVivianCategory(categoryId, productsPerCategory);
    results.push(result);
    
    // Small delay between categories
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);
  console.log(`[Vivian Crawler] Batch crawl complete: ${totalProducts} total products from ${categoryIds.length} categories`);
  
  return results;
}

export function getVivianCategoryIds(): number[] {
  return Object.keys(CATEGORY_MAPPING).map(Number);
}

export function getVivianCategoryName(categoryId: number): string {
  return CATEGORY_NAMES[categoryId] || `카테고리 ${categoryId}`;
}
