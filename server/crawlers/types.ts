export interface CrawlSource {
  site: string;
  url: string;
  platform: 'cafe24' | 'godomall' | 'shopify' | 'custom';
  categories: string[];
  directUrl?: string;
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
  descriptionImageUrls?: string[];
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
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['홈인테리어'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=10' }
    ],
    furniture: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['가구'] }
    ],
    lighting: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['조명'] }
    ],
    decor: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['인테리어소품'] }
    ],
    fabric: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['패브릭'] }
    ],
    wall_decor: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=10', platform: 'custom', categories: ['벽장식'] }
    ]
  },
  beauty: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['뷰티'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=20' }
    ],
    skincare: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['스킨케어'] }
    ],
    makeup: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['메이크업'] }
    ],
    fragrance: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['향수/캔들'] }
    ],
    bodycare: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['바디케어'] }
    ],
    haircare: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=20', platform: 'custom', categories: ['헤어케어'] }
    ]
  },
  electronics: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=30', platform: 'custom', categories: ['가전/디지털'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=30' }
    ],
    home_appliance: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=30', platform: 'custom', categories: ['생활가전'] }
    ],
    kitchen_appliance: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=30', platform: 'custom', categories: ['주방가전'] }
    ],
    audio: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=30', platform: 'custom', categories: ['오디오'] }
    ]
  },
  living: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=40', platform: 'custom', categories: ['생활용품'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=40' }
    ],
    kitchen: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=40', platform: 'custom', categories: ['주방용품'] }
    ],
    bathroom: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=40', platform: 'custom', categories: ['욕실용품'] }
    ],
    storage: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=40', platform: 'custom', categories: ['수납/정리'] }
    ],
    cleaning: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=40', platform: 'custom', categories: ['청소용품'] }
    ]
  },
  health: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=50', platform: 'custom', categories: ['헬스/건강식품'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=50' }
    ],
    supplements: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=50', platform: 'custom', categories: ['건강보조제'] }
    ],
    drinks: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=50', platform: 'custom', categories: ['건강음료'] }
    ],
    fitness: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=50', platform: 'custom', categories: ['운동용품'] }
    ],
    diet: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=50', platform: 'custom', categories: ['다이어트'] }
    ]
  },
  luxury: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=60', platform: 'custom', categories: ['럭셔리/명품'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=60' }
    ],
    accessories: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=60', platform: 'custom', categories: ['명품악세서리'] }
    ],
    premium_furniture: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=60', platform: 'custom', categories: ['프리미엄가구'] }
    ],
    luxury_items: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=60', platform: 'custom', categories: ['명품소품'] }
    ]
  },
  kids: {
    all: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=70', platform: 'custom', categories: ['유아/완구'], directUrl: 'https://vivian-mall.com/shop/list.php?ca_id=70' }
    ],
    toys: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=70', platform: 'custom', categories: ['완구'] }
    ],
    baby: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=70', platform: 'custom', categories: ['유아용품'] }
    ],
    education: [
      { site: 'vivian-mall.com', url: 'https://vivian-mall.com/shop/list.php?ca_id=70', platform: 'custom', categories: ['교육/학습'] }
    ]
  }
};

export const SUBCATEGORY_NAMES: Record<string, Record<string, string>> = {
  home_interior: {
    all: '전체',
    furniture: '가구',
    lighting: '조명',
    decor: '인테리어소품',
    fabric: '패브릭',
    wall_decor: '벽장식'
  },
  beauty: {
    all: '전체',
    skincare: '스킨케어',
    makeup: '메이크업',
    fragrance: '향수/캔들',
    bodycare: '바디케어',
    haircare: '헤어케어'
  },
  electronics: {
    all: '전체',
    home_appliance: '생활가전',
    kitchen_appliance: '주방가전',
    audio: '오디오'
  },
  living: {
    all: '전체',
    kitchen: '주방용품',
    bathroom: '욕실용품',
    storage: '수납/정리',
    cleaning: '청소용품'
  },
  health: {
    all: '전체',
    supplements: '건강보조제',
    drinks: '건강음료',
    fitness: '운동용품',
    diet: '다이어트'
  },
  luxury: {
    all: '전체',
    accessories: '명품악세서리',
    premium_furniture: '프리미엄가구',
    luxury_items: '명품소품'
  },
  kids: {
    all: '전체',
    toys: '완구',
    baby: '유아용품',
    education: '교육/학습'
  }
};

export const CATEGORY_NAMES: Record<string, string> = {
  home_interior: '홈 인테리어',
  beauty: '뷰티',
  electronics: '가전/디지털',
  living: '생활용품',
  health: '헬스/건강식품',
  luxury: '럭셔리/명품',
  kids: '유아/완구'
};
