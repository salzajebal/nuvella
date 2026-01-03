export interface CrawlSource {
  site: string;
  url: string;
  platform: 'cafe24' | 'godomall' | 'shopify';
  categories: string[];
}

export interface RawProduct {
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  imageUrl: string;
  imageUrls?: string[];
  description?: string;
  sourceUrl: string;
  sourceSite: string;
  platform: string;
  crawledAt: Date;
}

export interface ProductDraft {
  name: string;
  weight: string;
  purity: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  imageUrl: string;
  imageUrls?: string[];
  category: string;
  subcategory?: string;
  description?: string;
  isBest: boolean;
  isNew: boolean;
  isHot: boolean;
  useFixedPrice: boolean;
  sourceUrl: string;
  sourceSite: string;
}

export interface CrawlRequest {
  category: string;
  subcategory: string;
  site: string;
  limit?: number;
}

export interface CrawlSession {
  id: string;
  status: 'pending' | 'crawling' | 'completed' | 'error';
  products: ProductDraft[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export const CATEGORY_SITE_MAPPING: Record<string, Record<string, CrawlSource[]>> = {
  home_interior: {
    furniture: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['가구'] }
    ],
    lighting: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['조명'] }
    ],
    decor: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['소품'] },
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['인테리어'] }
    ],
    fabric: [
      { site: 'dailylike.co.kr', url: 'https://dailylike.co.kr', platform: 'godomall', categories: ['패브릭'] },
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['패브릭'] }
    ],
    wall_decor: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['액자', '벽걸이'] }
    ]
  },
  beauty: {
    skincare: [
      { site: 'innisfree.com', url: 'https://us.innisfree.com', platform: 'shopify', categories: ['skincare'] }
    ],
    makeup: [
      { site: 'romand.co.kr', url: 'https://romand.co.kr', platform: 'cafe24', categories: ['립', '아이'] }
    ],
    fragrance: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['캔들', '디퓨저'] }
    ],
    bodycare: [
      { site: 'dailylike.co.kr', url: 'https://dailylike.co.kr', platform: 'godomall', categories: ['바디'] }
    ],
    haircare: [
      { site: 'moremo.com', url: 'https://moremo.com', platform: 'shopify', categories: ['hair'] }
    ]
  },
  electronics: {
    home_appliance: [
      { site: 'missdal.com', url: 'https://missdal.com', platform: 'cafe24', categories: ['가전'] }
    ],
    kitchen_appliance: [
      { site: 'missdal.com', url: 'https://missdal.com', platform: 'cafe24', categories: ['주방가전'] }
    ],
    audio: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['오디오', '턴테이블'] }
    ]
  },
  living: {
    kitchen: [
      { site: 'missdal.com', url: 'https://missdal.com', platform: 'cafe24', categories: ['주방'] },
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['주방'] }
    ],
    bathroom: [
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['욕실'] }
    ],
    storage: [
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['수납'] },
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['수납'] }
    ],
    cleaning: [
      { site: 'sosohome.co.kr', url: 'https://sosohome.co.kr', platform: 'cafe24', categories: ['청소'] }
    ]
  },
  health: {
    supplements: [
      { site: 'hurumshop.com', url: 'https://hurumshop.com', platform: 'godomall', categories: ['건강보조제'] }
    ],
    drinks: [
      { site: 'hurumshop.com', url: 'https://hurumshop.com', platform: 'godomall', categories: ['건강음료'] }
    ],
    fitness: [
      { site: 'xexymix.com', url: 'https://xexymix.com', platform: 'godomall', categories: ['운동'] }
    ],
    diet: [
      { site: 'hurumshop.com', url: 'https://hurumshop.com', platform: 'godomall', categories: ['다이어트'] }
    ]
  },
  luxury: {
    accessories: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['악세서리', '보석함'] }
    ],
    premium_furniture: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['프리미엄'] }
    ],
    luxury_items: [
      { site: 'polashop.co.kr', url: 'https://polashop.co.kr', platform: 'cafe24', categories: ['명품소품'] }
    ]
  }
};

export const SUBCATEGORY_NAMES: Record<string, Record<string, string>> = {
  home_interior: {
    furniture: '가구',
    lighting: '조명',
    decor: '인테리어소품',
    fabric: '패브릭',
    wall_decor: '벽장식'
  },
  beauty: {
    skincare: '스킨케어',
    makeup: '메이크업',
    fragrance: '향수/캔들',
    bodycare: '바디케어',
    haircare: '헤어케어'
  },
  electronics: {
    home_appliance: '생활가전',
    kitchen_appliance: '주방가전',
    audio: '오디오'
  },
  living: {
    kitchen: '주방용품',
    bathroom: '욕실용품',
    storage: '수납/정리',
    cleaning: '청소용품'
  },
  health: {
    supplements: '건강보조제',
    drinks: '건강음료',
    fitness: '운동용품',
    diet: '다이어트'
  },
  luxury: {
    accessories: '명품악세서리',
    premium_furniture: '프리미엄가구',
    luxury_items: '명품소품'
  }
};

export const CATEGORY_NAMES: Record<string, string> = {
  home_interior: '홈 인테리어',
  beauty: '뷰티',
  electronics: '가전/디지털',
  living: '생활용품',
  health: '헬스/건강식품',
  luxury: '럭셔리/명품'
};
