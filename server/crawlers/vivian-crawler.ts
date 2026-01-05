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
  subcategory: string;
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

// Subcategory keywords for automatic classification
const SUBCATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  home_interior: {
    furniture: ['소파', '의자', '테이블', '책상', '침대', '서랍', '수납장', '선반', '행거', '옷장', '화장대', '협탁'],
    lighting: ['조명', '램프', 'LED', '스탠드', '무드등', '전구', '펜던트', '샹들리에'],
    decor: ['소품', '화병', '조화', '액자', '시계', '거울', '오브제', '장식', '캔들홀더', '트레이'],
    fabric: ['커튼', '러그', '쿠션', '이불', '베개', '담요', '카페트', '매트', '침구', '패브릭'],
    wall_decor: ['벽', '월데코', '포스터', '타일', '스티커', '월아트']
  },
  beauty: {
    skincare: ['스킨', '토너', '에센스', '세럼', '크림', '로션', '앰플', '마스크팩', '클렌징', '선크림', '모이스처'],
    makeup: ['립스틱', '립', '파운데이션', '아이섀도', '마스카라', '블러셔', '컨실러', '메이크업', '화장품', '팔레트'],
    fragrance: ['향수', '퍼퓸', '캔들', '디퓨저', '룸스프레이', '인센스', '향'],
    bodycare: ['바디', '핸드크림', '풋크림', '바디워시', '바디로션', '스크럽', '입욕제'],
    haircare: ['샴푸', '린스', '트리트먼트', '헤어', '두피', '염색', '헤어오일', '에센스']
  },
  electronics: {
    home_appliance: ['청소기', '공기청정기', '가습기', '제습기', '선풍기', '에어컨', '히터', '살균기', '로봇청소기', '드라이어', '헤어드라이기', '다리미', '세탁기', '건조기', '냉장고', 'TV', '모니터', '노트북', '태블릿', '안마기', '마사지기'],
    kitchen_appliance: ['에어프라이어', '믹서기', '블렌더', '전기밥솥', '전자레인지', '오븐', '토스터', '커피머신', '정수기', '식기세척기', '전기포트', '인덕션', '전기그릴', '제빙기'],
    audio: ['스피커', '이어폰', '헤드폰', '블루투스', '사운드바', '오디오', 'AirPods', '무선이어폰', '앰프', '턴테이블']
  },
  living: {
    kitchen: ['냄비', '프라이팬', '칼', '도마', '그릇', '접시', '컵', '수저', '조리도구', '키친', '주방'],
    bathroom: ['욕실', '수건', '샤워', '비누', '치약', '칫솔', '목욕', '욕조', '변기'],
    storage: ['수납', '정리', '박스', '바구니', '선반', '행거', '옷걸이', '보관', '케이스'],
    cleaning: ['청소', '걸레', '빗자루', '세제', '스펀지', '세척', '먼지떨이']
  },
  health: {
    supplements: ['비타민', '영양제', '오메가', '유산균', '프로바이오틱스', '콜라겐', '철분', '칼슘', '마그네슘'],
    drinks: ['홍삼', '즙', '건강음료', '차', '녹즙', '건강즙', '비타민음료'],
    fitness: ['덤벨', '요가매트', '운동', '헬스', '스트레칭', '밴드', '푸쉬업', '아령', '케틀벨'],
    diet: ['다이어트', '단백질', '프로틴', '슬리밍', '체중', '쉐이크']
  },
  luxury: {
    accessories: ['목걸이', '귀걸이', '반지', '팔찌', '브로치', '주얼리', '시계', '선글라스', '스카프'],
    premium_furniture: ['원목', '대리석', '프리미엄', '이탈리아', '디자이너', '명품가구'],
    luxury_items: ['명품', '브랜드', '럭셔리', '프리미엄소품', 'VIP']
  },
  kids: {
    toys: ['장난감', '완구', '블록', '레고', '인형', '로봇', '퍼즐', '보드게임', '피규어'],
    baby: ['유아', '아기', '기저귀', '젖병', '이유식', '유모차', '카시트', '아기옷', '신생아'],
    education: ['교육', '학습', '동화책', '교구', '악기', '그림책', '학습지', '영어']
  }
};

function classifySubcategory(productName: string, category: string): string {
  const keywords = SUBCATEGORY_KEYWORDS[category];
  if (!keywords) return 'all';
  
  const lowerName = productName.toLowerCase();
  
  // Score-based matching for better accuracy
  const scores: Record<string, number> = {};
  
  for (const [subcategoryId, subcategoryKeywords] of Object.entries(keywords)) {
    scores[subcategoryId] = 0;
    for (const keyword of subcategoryKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerName.includes(lowerKeyword)) {
        // Longer keyword matches are more specific, give higher score
        scores[subcategoryId] += lowerKeyword.length;
      }
    }
  }
  
  // Find subcategory with highest score
  let bestMatch = 'all';
  let highestScore = 0;
  
  for (const [subcategoryId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = subcategoryId;
    }
  }
  
  // Only return a match if we actually found keywords
  if (highestScore > 0) {
    return bestMatch;
  }
  
  // Return 'all' if no match found (will use admin-selected subcategory)
  return 'all';
}

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
    console.log(`[Vivian Crawler] Fetching detail page: ${sourceUrl}`);
    const html = await fetchWithRetry(sourceUrl);
    const $ = cheerio.load(html);
    
    const imageUrls: string[] = [];
    const descriptionImages: string[] = [];
    const seenUrls = new Set<string>();
    
    // Helper to check if URL is valid product image
    const isValidProductImage = (url: string): boolean => {
      if (!url) return false;
      // Skip UI/icon images
      if (url.includes('icon') || url.includes('logo') || url.includes('button')) return false;
      if (url.includes('spacer') || url.includes('blank') || url.includes('loading')) return false;
      if (url.includes('s_star') || url.includes('facebook') || url.includes('twitter')) return false;
      if (url.includes('/skin/') || url.includes('/theme/')) return false;
      // Must be product image or from known CDNs
      return url.includes('/data/item/') || 
             url.includes('pstatic.net') || 
             url.includes('proxy-smartstore') ||
             url.includes('godohosting.com') ||
             url.match(/\.(jpg|jpeg|png|gif|webp)/i) !== null;
    };
    
    // Helper to check if URL is valid description image (from Naver SmartStore or similar)
    const isValidDescriptionImage = (url: string): boolean => {
      if (!url) return false;
      // Skip UI/icon images
      if (url.includes('icon') || url.includes('logo') || url.includes('button')) return false;
      if (url.includes('s_star') || url.includes('facebook') || url.includes('twitter')) return false;
      if (url.includes('/skin/') || url.includes('/theme/')) return false;
      // Accept images from known CDNs or product data
      return url.includes('pstatic.net') || 
             url.includes('proxy-smartstore') ||
             url.includes('godohosting.com') ||
             url.includes('naver.net') ||
             (url.includes('/data/') && url.match(/\.(jpg|jpeg|png|gif|webp)/i) !== null);
    };
    
    // Main product images - gallery/slider images
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
      if (src && src.includes('/data/item/') && isValidProductImage(src)) {
        const fullUrl = absoluteUrl(src);
        // Get high-res version by checking for thumb- prefix
        const highResUrl = fullUrl.replace(/thumb-([^_]+)_\d+x\d+/, 'thumb-$1_1000x1000');
        if (!seenUrls.has(highResUrl) && !seenUrls.has(fullUrl)) {
          seenUrls.add(highResUrl);
          seenUrls.add(fullUrl);
          imageUrls.push(highResUrl);
        }
      }
    });
    
    // Description images - specifically target Naver SmartStore images
    // These have classes like .se-inline-image-resource, .se-image-resource
    $('img.se-inline-image-resource, img.se-image-resource').each((_, el) => {
      const src = $(el).attr('src');
      if (src && isValidDescriptionImage(src)) {
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          descriptionImages.push(src);
        }
      }
    });
    
    // Also look for images from proxy-smartstore.naver.net and shop-phinf.pstatic.net
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && (src.includes('proxy-smartstore') || src.includes('shop-phinf.pstatic.net') || src.includes('godohosting.com'))) {
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          descriptionImages.push(src);
        }
      }
    });
    
    // Also extract from inline HTML (some images might be in raw HTML strings)
    const smartStoreMatches = html.match(/src="(https:\/\/proxy-smartstore\.naver\.net[^"]+)"/g) || [];
    const pstaticMatches = html.match(/src="(https:\/\/shop-phinf\.pstatic\.net[^"]+)"/g) || [];
    const godoMatches = html.match(/src="(https?:\/\/[^"]*godohosting\.com[^"]+)"/g) || [];
    
    [...smartStoreMatches, ...pstaticMatches, ...godoMatches].forEach(match => {
      const urlMatch = match.match(/src="([^"]+)"/);
      if (urlMatch && urlMatch[1]) {
        const url = urlMatch[1];
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          descriptionImages.push(url);
        }
      }
    });
    
    // Get product description text
    let description = '';
    // Try to get text from product info section
    const descText = $('#sit_inf_explan').text().trim() || 
                     $('.product-detail').text().trim() ||
                     $('#sit_inf').text().trim();
    if (descText) {
      // Clean up whitespace and limit length
      description = descText.replace(/\s+/g, ' ').substring(0, 1000).trim();
    }
    
    console.log(`[Vivian Crawler] Detail: ${imageUrls.length} gallery images, ${descriptionImages.length} description images`);
    
    return {
      imageUrls: imageUrls.slice(0, 20),
      descriptionImages: descriptionImages.slice(0, 50),
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

export interface CrawlOptions {
  categoryId: number;
  limit?: number;
  subcategory?: string; // Admin-selected subcategory (overrides auto-classification)
  targetCategory?: string; // Admin-selected target category (overrides vivian category mapping)
}

export async function crawlVivianCategory(categoryId: number, limit: number = 0, options?: { subcategory?: string; targetCategory?: string }): Promise<VivianCrawlResult> {
  const category = options?.targetCategory || CATEGORY_MAPPING[categoryId];
  const categoryName = CATEGORY_NAMES[categoryId];
  const forcedSubcategory = options?.subcategory; // If provided, all products get this subcategory
  
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

  // limit = 0 means fetch ALL products
  const fetchAll = limit === 0;
  const effectiveLimit = fetchAll ? Number.MAX_SAFE_INTEGER : limit;

  console.log(`[Vivian Crawler] === Starting category crawl ===`);
  console.log(`[Vivian Crawler] Category ID: ${categoryId}`);
  console.log(`[Vivian Crawler] Category Name: ${categoryName}`);
  console.log(`[Vivian Crawler] Estella Category: ${category}`);
  console.log(`[Vivian Crawler] Forced Subcategory: ${forcedSubcategory || 'auto-classify'}`);
  console.log(`[Vivian Crawler] Limit: ${fetchAll ? 'ALL (unlimited)' : limit}`);

  try {
    // Fetch multiple pages to get more products
    const allProducts: VivianProduct[] = [];
    let page = 1;
    const maxPages = 500; // High cap for safety but allows many pages
    const seenProductIds = new Set<string>();
    let consecutiveEmptyPages = 0;
    
    while (allProducts.length < effectiveLimit && page <= maxPages) {
      const url = `${VIVIAN_BASE_URL}/shop/list.php?ca_id=${categoryId}&page=${page}`;
      console.log(`[Vivian Crawler] Fetching page ${page}: ${url} (total so far: ${allProducts.length})`);
      
      let html: string;
      try {
        html = await fetchWithRetry(url);
      } catch (error) {
        console.error(`[Vivian Crawler] Failed to fetch page ${page}:`, error);
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 3) {
          console.log(`[Vivian Crawler] 3 consecutive failures, stopping`);
          break;
        }
        page++;
        continue;
      }
      
      const $ = cheerio.load(html);
      let foundOnPage = 0;
      let newProductsOnPage = 0;
      
      // Each product is in div.item-list
      const items = $('div.item-list');
      console.log(`[Vivian Crawler] Found ${items.length} items on page ${page}`);
      
      if (items.length === 0) {
        // No more products found
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 2) {
          console.log(`[Vivian Crawler] No more products found, stopping`);
          break;
        }
        page++;
        continue;
      }
      
      consecutiveEmptyPages = 0;
      
      for (let i = 0; i < items.length && allProducts.length < effectiveLimit; i++) {
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
        
        // Use forced subcategory if provided, otherwise auto-classify
        let subcategory: string;
        if (forcedSubcategory && forcedSubcategory !== 'all') {
          // Admin selected a specific subcategory
          subcategory = forcedSubcategory;
        } else {
          // Auto-classify based on product name
          subcategory = classifySubcategory(name, category);
          // If auto-classification failed and no forced subcategory, use 'all'
          if (subcategory === 'all' && !forcedSubcategory) {
            subcategory = 'all';
          }
        }
        
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
          subcategory,
          description: detail.description || `${CATEGORY_NAMES[categoryId]} 상품입니다.`
        };
        
        allProducts.push(product);
        foundOnPage++;
        newProductsOnPage++;
        const subcatLabel = forcedSubcategory ? `[강제:${subcategory}]` : subcategory;
        console.log(`[Vivian Crawler] ✓ Added: "${name.substring(0, 30)}..." → ${category}/${subcatLabel} (₩${parseInt(price).toLocaleString()})`);
        
        // Small delay between detail page fetches to be polite
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`[Vivian Crawler] Page ${page}: ${newProductsOnPage} new products (${foundOnPage} total on page), running total: ${allProducts.length}`);
      
      // If no new products found on this page, we may have reached the end
      if (newProductsOnPage === 0) {
        console.log(`[Vivian Crawler] No new products on page ${page}, stopping`);
        break;
      }
      
      // Small delay between pages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
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
