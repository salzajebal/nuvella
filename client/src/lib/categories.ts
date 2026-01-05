export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  vivianCaId: number;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: "home_interior",
    name: "홈 인테리어",
    description: "감각적인 홈 인테리어 제품을 만나보세요",
    vivianCaId: 10,
    subcategories: [
      { id: "furniture", name: "가구" },
      { id: "lighting", name: "조명" },
      { id: "decor", name: "인테리어소품" },
      { id: "fabric", name: "패브릭" },
      { id: "wall_decor", name: "벽장식" },
    ]
  },
  {
    id: "beauty",
    name: "뷰티",
    description: "뷰티 & 스킨케어 베스트 아이템",
    vivianCaId: 20,
    subcategories: [
      { id: "skincare", name: "스킨케어" },
      { id: "makeup", name: "메이크업" },
      { id: "fragrance", name: "향수/캔들" },
      { id: "bodycare", name: "바디케어" },
      { id: "haircare", name: "헤어케어" },
    ]
  },
  {
    id: "electronics",
    name: "가전/디지털",
    description: "최신 가전 및 디지털 제품",
    vivianCaId: 30,
    subcategories: [
      { id: "home_appliance", name: "생활가전" },
      { id: "kitchen_appliance", name: "주방가전" },
      { id: "audio", name: "오디오" },
    ]
  },
  {
    id: "living",
    name: "생활용품",
    description: "실용적인 생활용품 모음",
    vivianCaId: 40,
    subcategories: [
      { id: "kitchen", name: "주방용품" },
      { id: "bathroom", name: "욕실용품" },
      { id: "storage", name: "수납/정리" },
      { id: "cleaning", name: "청소용품" },
    ]
  },
  {
    id: "health",
    name: "헬스/건강식품",
    description: "건강을 위한 선택",
    vivianCaId: 50,
    subcategories: [
      { id: "supplements", name: "건강보조제" },
      { id: "drinks", name: "건강음료" },
      { id: "fitness", name: "운동용품" },
      { id: "diet", name: "다이어트" },
    ]
  },
  {
    id: "luxury",
    name: "럭셔리/명품",
    description: "프리미엄 럭셔리 컬렉션",
    vivianCaId: 60,
    subcategories: [
      { id: "accessories", name: "명품악세서리" },
      { id: "premium_furniture", name: "프리미엄가구" },
      { id: "luxury_items", name: "명품소품" },
    ]
  },
  {
    id: "kids",
    name: "유아/완구",
    description: "아이들을 위한 특별한 선물",
    vivianCaId: 70,
    subcategories: [
      { id: "toys", name: "완구" },
      { id: "baby", name: "유아용품" },
      { id: "education", name: "교육/학습" },
    ]
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

export function getCategoryByVivianId(caId: number): Category | undefined {
  return CATEGORIES.find(cat => cat.vivianCaId === caId);
}

export function getSubcategoryName(categoryId: string, subcategoryId: string): string {
  const category = getCategoryById(categoryId);
  if (!category) return subcategoryId;
  const sub = category.subcategories.find(s => s.id === subcategoryId);
  return sub?.name || subcategoryId;
}
