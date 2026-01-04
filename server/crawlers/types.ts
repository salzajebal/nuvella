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
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['가구', '소파', '책상', '의자'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['가구', '테이블', '수납가구'] }
    ],
    lighting: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['조명', 'LED조명', '스탠드'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['조명', '무드등'] }
    ],
    decor: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['인테리어소품', '화병', '조화'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['데코', '소품'] }
    ],
    fabric: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['커튼', '러그', '쿠션'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['패브릭', '침구'] }
    ],
    wall_decor: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['액자', '벽시계', '벽장식'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['월데코', '액자'] }
    ]
  },
  beauty: {
    skincare: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['스킨케어', '에센스', '크림'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['스킨케어', '세럼'] }
    ],
    makeup: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['메이크업', '립스틱', '파운데이션'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['메이크업', '립틴트'] }
    ],
    fragrance: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['향수', '디퓨저', '캔들'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['향수', '퍼퓸'] }
    ],
    bodycare: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['바디케어', '바디로션', '바디워시'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['바디', '핸드크림'] }
    ],
    haircare: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['헤어케어', '샴푸', '트리트먼트'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['헤어', '에센스'] }
    ]
  },
  electronics: {
    home_appliance: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['가전', '청소기', '공기청정기'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['생활가전', '청소기'] }
    ],
    kitchen_appliance: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['주방가전', '에어프라이어', '믹서기'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['주방가전', '전기밥솥'] }
    ],
    audio: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['블루투스스피커', '이어폰', '헤드폰'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['음향기기', '스피커'] }
    ]
  },
  living: {
    kitchen: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['주방용품', '냄비', '프라이팬'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['주방', '식기'] }
    ],
    bathroom: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['욕실용품', '수건', '욕실선반'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['욕실', '화장실'] }
    ],
    storage: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['수납', '수납박스', '옷장정리'] },
      { site: 'ohou.se', url: 'https://ohou.se', platform: 'custom', categories: ['수납', '정리함'] }
    ],
    cleaning: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['청소용품', '걸레', '청소도구'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['청소', '세제'] }
    ]
  },
  health: {
    supplements: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['영양제', '비타민', '오메가3'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['건강기능식품', '영양제'] }
    ],
    drinks: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['건강음료', '홍삼', '비타민음료'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['건강음료', '즙'] }
    ],
    fitness: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['운동용품', '요가매트', '덤벨'] },
      { site: '11st.co.kr', url: 'https://www.11st.co.kr', platform: 'custom', categories: ['헬스', '운동기구'] }
    ],
    diet: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['다이어트', '단백질', '체중관리'] },
      { site: 'oliveyoung.co.kr', url: 'https://www.oliveyoung.co.kr', platform: 'custom', categories: ['다이어트', '슬리밍'] }
    ]
  },
  luxury: {
    accessories: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['주얼리', '목걸이', '귀걸이'] },
      { site: '29cm.co.kr', url: 'https://www.29cm.co.kr', platform: 'custom', categories: ['악세서리', '주얼리'] }
    ],
    premium_furniture: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['프리미엄가구', '원목가구', '디자인가구'] },
      { site: '29cm.co.kr', url: 'https://www.29cm.co.kr', platform: 'custom', categories: ['가구', '리빙'] }
    ],
    luxury_items: [
      { site: 'coupang.com', url: 'https://www.coupang.com', platform: 'custom', categories: ['명품소품', '프리미엄', '디자이너'] },
      { site: '29cm.co.kr', url: 'https://www.29cm.co.kr', platform: 'custom', categories: ['럭셔리', '프리미엄'] }
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
