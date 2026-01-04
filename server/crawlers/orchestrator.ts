import { Cafe24Adapter } from './adapters/cafe24';
import { GodomallAdapter } from './adapters/godomall';
import { ShopifyAdapter } from './adapters/shopify';
import { BaseCrawlerAdapter } from './adapters/base';
import { crawlProductsWithPuppeteer } from './puppeteer-crawler';
import { 
  CrawlRequest, 
  CrawlSession, 
  ProductDraft, 
  RawProduct,
  CATEGORY_SITE_MAPPING,
  CATEGORY_NAMES,
  SUBCATEGORY_NAMES 
} from './types';

const crawlSessions = new Map<string, CrawlSession>();

const SESSION_EXPIRY_MS = 30 * 60 * 1000;

function generateSessionId(): string {
  return `crawl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cleanupExpiredSessions(): void {
  const now = Date.now();
  const entries = Array.from(crawlSessions.entries());
  for (const [id, session] of entries) {
    if (now - session.startedAt.getTime() > SESSION_EXPIRY_MS) {
      crawlSessions.delete(id);
    }
  }
}

function getAdapter(platform: string, site: string, url: string): BaseCrawlerAdapter {
  switch (platform) {
    case 'cafe24':
      return new Cafe24Adapter(site, url);
    case 'godomall':
      return new GodomallAdapter(site, url);
    case 'shopify':
      return new ShopifyAdapter(site, url);
    default:
      return new Cafe24Adapter(site, url);
  }
}

function transformToProductDraft(raw: RawProduct, category: string, subcategory: string): ProductDraft {
  return {
    name: raw.name,
    weight: '',
    purity: '',
    price: raw.price,
    originalPrice: raw.originalPrice,
    discountPercent: raw.discountPercent,
    imageUrl: raw.imageUrl,
    imageUrls: raw.imageUrls,
    category,
    subcategory,
    description: raw.description || `${raw.sourceSite}에서 가져온 상품입니다.`,
    isBest: false,
    isNew: true,
    isHot: false,
    useFixedPrice: true,
    sourceUrl: raw.sourceUrl,
    sourceSite: raw.sourceSite
  };
}

export async function getCrawlSources(): Promise<{
  categories: { id: string; name: string; subcategories: { id: string; name: string; sites: string[] }[] }[]
}> {
  const categories = [];
  
  for (const [categoryId, subcategories] of Object.entries(CATEGORY_SITE_MAPPING)) {
    const categoryName = CATEGORY_NAMES[categoryId] || categoryId;
    const subcategoryList = [];
    
    for (const [subcategoryId, sources] of Object.entries(subcategories)) {
      const subcategoryName = SUBCATEGORY_NAMES[categoryId]?.[subcategoryId] || subcategoryId;
      const sites = sources.map(s => s.site);
      
      subcategoryList.push({
        id: subcategoryId,
        name: subcategoryName,
        sites: Array.from(new Set(sites))
      });
    }
    
    categories.push({
      id: categoryId,
      name: categoryName,
      subcategories: subcategoryList
    });
  }
  
  return { categories };
}

export async function startCrawl(request: CrawlRequest): Promise<{ sessionId: string }> {
  cleanupExpiredSessions();
  
  const sessionId = generateSessionId();
  const session: CrawlSession = {
    id: sessionId,
    status: 'pending',
    products: [],
    startedAt: new Date()
  };
  
  crawlSessions.set(sessionId, session);
  
  executeCrawl(sessionId, request).catch(error => {
    const s = crawlSessions.get(sessionId);
    if (s) {
      s.status = 'error';
      s.error = error instanceof Error ? error.message : String(error);
      s.completedAt = new Date();
    }
  });
  
  return { sessionId };
}

async function executeCrawl(sessionId: string, request: CrawlRequest): Promise<void> {
  const session = crawlSessions.get(sessionId);
  if (!session) return;
  
  session.status = 'crawling';
  
  try {
    const { category, subcategory, site, limit = 20 } = request;
    
    const categoryMapping = CATEGORY_SITE_MAPPING[category];
    if (!categoryMapping) {
      throw new Error(`Unknown category: ${category}`);
    }
    
    const subcategoryMapping = categoryMapping[subcategory];
    if (!subcategoryMapping) {
      throw new Error(`Unknown subcategory: ${subcategory}`);
    }
    
    const source = subcategoryMapping.find(s => s.site === site);
    if (!source) {
      throw new Error(`Site ${site} not found for ${category}/${subcategory}`);
    }
    
    let rawProducts: RawProduct[] = [];
    
    console.log(`Starting Puppeteer crawl for ${site}...`);
    const keyword = source.categories[0] || subcategory;
    rawProducts = await crawlProductsWithPuppeteer(site, keyword, limit, subcategory);
    
    if (rawProducts.length === 0) {
      console.log(`Puppeteer crawl returned no results, falling back to adapter...`);
      const adapter = getAdapter(source.platform, source.site, source.url);
      rawProducts = await adapter.fetchProducts(source.categories, limit);
    }
    
    const drafts = rawProducts.map(raw => transformToProductDraft(raw, category, subcategory));
    
    session.products = drafts;
    session.status = 'completed';
    session.completedAt = new Date();
  } catch (error) {
    session.status = 'error';
    session.error = error instanceof Error ? error.message : String(error);
    session.completedAt = new Date();
  }
}

export function getCrawlSession(sessionId: string): CrawlSession | null {
  return crawlSessions.get(sessionId) || null;
}

export function getCrawlResults(sessionId: string, page: number = 1, pageSize: number = 20): {
  session: CrawlSession | null;
  products: ProductDraft[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const session = crawlSessions.get(sessionId);
  if (!session) {
    return { session: null, products: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const products = session.products.slice(start, end);
  
  return {
    session,
    products,
    total: session.products.length,
    page,
    pageSize,
    totalPages: Math.ceil(session.products.length / pageSize)
  };
}

export function deleteCrawlSession(sessionId: string): boolean {
  return crawlSessions.delete(sessionId);
}
