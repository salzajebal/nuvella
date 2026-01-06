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

// Subcategory keywords for automatic classification - expanded for better matching
const SUBCATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  home_interior: {
    furniture: ['소파', '의자', '테이블', '책상', '침대', '서랍', '수납장', '선반', '행거', '옷장', '화장대', '협탁', '벤치', '스툴', '체어', '데스크', '베드', '침실', '거실', '다이닝', '식탁', '좌식', '리클라이너', '암체어', '콘솔', '사이드테이블', 'sofa', 'chair', 'table', 'desk', 'bed', '쇼파', '거실장', '서재', '붙박이', '장롱', '옷걸이장', '파티션', '칸막이'],
    lighting: ['조명', '램프', 'LED', '스탠드', '무드등', '전구', '펜던트', '샹들리에', '플로어램프', '테이블램프', '벽등', '천장등', '실링', '다운라이트', '간접조명', '인테리어조명', 'light', 'lamp', '라이트', '무드라이트', '취침등', '독서등', '수유등'],
    decor: ['소품', '화병', '조화', '액자', '시계', '거울', '오브제', '장식', '캔들홀더', '트레이', '피규어', '인테리어소품', '데코', '꽃병', '프레임', '벽시계', '탁상시계', '조형물', '인형', '동상', '화분', '플랜트', '행잉', '마크라메', '태피스트리', '모빌'],
    fabric: ['커튼', '러그', '쿠션', '이불', '베개', '담요', '카페트', '매트', '침구', '패브릭', '블라인드', '롤스크린', '암막', '쉬폰', '시어', '레이스커튼', '발', '죽발', '우드블라인드', '카펫', '러너', '방석', '좌방석', '침대커버', '베드스프레드', '이불커버', '베개커버', '차렵이불'],
    wall_decor: ['벽', '월데코', '포스터', '타일', '스티커', '월아트', '벽걸이', '벽장식', '벽화', '월페이퍼', '벽지', '데코타일', '포인트벽지', '시트지', '몰딩', '우드월', '포토월', '갤러리월']
  },
  beauty: {
    skincare: ['스킨', '토너', '에센스', '세럼', '크림', '로션', '앰플', '마스크팩', '클렌징', '선크림', '모이스처', '수분', '보습', '미백', '주름', '안티에이징', '기초', '스킨케어', '화장수', '유액', '에멀젼', '아이크림', '나이트크림', '데이크림', '자외선차단', 'SPF', '선케어', '선블록', '팩', '슬리핑팩', '시트마스크', '필링', '각질', '모공', '피부'],
    makeup: ['립스틱', '립', '파운데이션', '아이섀도', '마스카라', '블러셔', '컨실러', '메이크업', '화장품', '팔레트', '립글로스', '틴트', '립밤', '쿠션', 'BB크림', 'CC크림', '프라이머', '베이스', '파우더', '섀도우', '아이라이너', '아이브로우', '눈썹', '속눈썹', '뷰러', '브러쉬', '퍼프', '메이크업브러쉬', '치크', '하이라이터', '쉐딩', '컨투어링', '립라이너', '매트립', '글로시'],
    fragrance: ['향수', '퍼퓸', '캔들', '디퓨저', '룸스프레이', '인센스', '향', '오드퍼퓸', '오드뚜왈렛', 'EDT', 'EDP', '바디미스트', '헤어미스트', '섬유향수', '방향제', '홈프래그런스', '아로마', '에센셜오일', '리드디퓨저', '차량용향수', '포푸리'],
    bodycare: ['바디', '핸드크림', '풋크림', '바디워시', '바디로션', '스크럽', '입욕제', '바디오일', '바디버터', '핸드워시', '손세정제', '바디클렌저', '샤워젤', '거품제', '입욕소금', '배쓰밤', '바디미스트', '제모', '왁싱', '제모기', '바디케어', '각질제거', '풋케어', '발각질', '핸드케어'],
    haircare: ['샴푸', '린스', '트리트먼트', '헤어', '두피', '염색', '헤어오일', '에센스', '컨디셔너', '헤어팩', '헤어마스크', '탈모', '탈모샴푸', '스타일링', '왁스', '젤', '무스', '스프레이', '드라이샴푸', '헤어세럼', '머릿결', '손상모', '펌', '염색약', '헤어컬러', '새치', '볼륨', '에어리']
  },
  electronics: {
    home_appliance: ['청소기', '공기청정기', '가습기', '제습기', '선풍기', '에어컨', '히터', '살균기', '로봇청소기', '드라이어', '헤어드라이기', '다리미', '세탁기', '건조기', '냉장고', 'TV', '모니터', '노트북', '태블릿', '안마기', '마사지기', '전자레인지', '에어프라이어', '진공청소기', '무선청소기', '스팀청소기', '스티커청소기', '정수기', '냉온정수기', '비데', '온수매트', '전기장판', '온열기', '서큘레이터', '공기순환기', '미니냉장고', '김치냉장고', '전기히터', '라디에이터', '안마의자', '마사지건', '안마봉', '족욕기', '눈마사지기', '목마사지', '어깨마사지'],
    kitchen_appliance: ['에어프라이어', '믹서기', '블렌더', '전기밥솥', '전자레인지', '오븐', '토스터', '커피머신', '정수기', '식기세척기', '전기포트', '인덕션', '전기그릴', '제빙기', '커피메이커', '에스프레소', '캡슐커피', '드립커피', '커피그라인더', '핸드블렌더', '푸드프로세서', '착즙기', '주서기', '전기냄비', '멀티쿠커', '압력밥솥', 'IH밥솥', '전기레인지', '가스레인지', '후드', '렌지후드', '오븐토스터', '스팀오븐', '전기오븐', '음식물처리기'],
    audio: ['스피커', '이어폰', '헤드폰', '블루투스', '사운드바', '오디오', 'AirPods', '무선이어폰', '앰프', '턴테이블', 'TWS', '노이즈캔슬링', '에어팟', '버즈', '헤드셋', '게이밍헤드셋', 'USB스피커', '무선스피커', '포터블스피커', 'AI스피커', '홈시어터', '서라운드', 'DAC', '하이파이', '오디오앰프', 'LP플레이어', '레코드플레이어', '마이크', '콘덴서마이크']
  },
  living: {
    kitchen: ['냄비', '프라이팬', '칼', '도마', '그릇', '접시', '컵', '수저', '조리도구', '키친', '주방', '후라이팬', '웍', '솥', '찜기', '냄비세트', '칼세트', '식기', '식기세트', '밥그릇', '국그릇', '반찬그릇', '찬기', '접시세트', '머그컵', '커피컵', '와인잔', '맥주잔', '유리컵', '텀블러', '보온병', '물병', '젓가락', '숟가락', '포크', '나이프', '수저세트', '국자', '뒤집개', '집게', '주걱', '거품기', '채반', '체', '믹싱볼', '계량컵', '계량스푼', '보관용기', '밀폐용기', '반찬통', '도시락', '주방매트', '싱크대매트', '행주', '앞치마'],
    bathroom: ['욕실', '수건', '샤워', '비누', '치약', '칫솔', '목욕', '욕조', '변기', '세면대', '욕실용품', '샤워기', '샤워헤드', '수전', '욕실매트', '발매트', '욕실수납', '욕실선반', '샴푸대', '비누대', '칫솔꽂이', '휴지걸이', '욕실거울', '세면도구', '목욕용품', '샤워타올', '때밀이', '샤워볼', '목욕가운', '욕실슬리퍼'],
    storage: ['수납', '정리', '박스', '바구니', '선반', '행거', '옷걸이', '보관', '케이스', '수납함', '정리함', '리빙박스', '수납박스', '수납바구니', '빨래바구니', '세탁바구니', '옷정리함', '서랍정리', '칸막이', '정리대', '다용도선반', '틈새선반', '주방선반', '욕실선반', '신발장', '신발선반', '행거랙', '옷걸이랙', '코트행거', '스탠드행거', '압축팩', '진공팩', '옷커버', '이불압축팩'],
    cleaning: ['청소', '걸레', '빗자루', '세제', '스펀지', '세척', '먼지떨이', '밀대', '물걸레', '마른걸레', '청소솔', '변기솔', '욕실청소', '유리닦이', '창문닦이', '세탁세제', '섬유유연제', '표백제', '주방세제', '욕실세제', '락스', '곰팡이제거제', '다목적세제', '청소용품', '청소도구', '쓰레기통', '분리수거함', '휴지통']
  },
  health: {
    supplements: ['비타민', '영양제', '오메가', '유산균', '프로바이오틱스', '콜라겐', '철분', '칼슘', '마그네슘', '종합비타민', '멀티비타민', '비타민C', '비타민D', '비타민B', 'EPA', 'DHA', '오메가3', '루테인', '밀크시슬', '간건강', '눈건강', '뼈건강', '관절건강', 'MSM', '글루코사민', '코엔자임', 'CoQ10', '아연', '셀레늄', '엽산', '임산부영양제', '어린이영양제', '성장기영양제', '면역력', '피로회복', '항산화'],
    drinks: ['홍삼', '즙', '건강음료', '차', '녹즙', '건강즙', '비타민음료', '홍삼액', '홍삼정', '인삼', '흑삼', '녹용', '꿀', '프로폴리스', '석류즙', '양배추즙', '케일즙', '당근즙', '사과즙', '과일즙', '야채즙', '건강주스', '효소', '발효액', '식초', '현미식초', '사과식초', '매실', '오미자', '구기자', '대추차', '생강차', '레몬차', '유자차'],
    fitness: ['덤벨', '요가매트', '운동', '헬스', '스트레칭', '밴드', '푸쉬업', '아령', '케틀벨', '운동기구', '홈트', '홈트레이닝', '필라테스', '요가', '요가블록', '요가스트랩', '폼롤러', '마사지볼', '근육이완', '스트레칭밴드', '고무밴드', '탄력밴드', '철봉', '턱걸이', '복근운동', '싯업', '스쿼트', '런닝머신', '실내자전거', '스텝퍼', '점핑', '줄넘기', '훌라후프', '복싱', '글러브', '권투'],
    diet: ['다이어트', '단백질', '프로틴', '슬리밍', '체중', '쉐이크', '다이어트보조제', '체중관리', '식이섬유', '포만감', '저칼로리', '제로칼로리', '당류제로', '무설탕', '가르시니아', '녹차추출물', 'CLA', 'L카르니틴', '다이어트음료', '다이어트간식', '닭가슴살', '단백질바', '프로틴바', '프로틴쉐이크', '단백질음료', '고단백', '저탄수화물', '키토제닉', '저염']
  },
  luxury: {
    accessories: ['목걸이', '귀걸이', '반지', '팔찌', '브로치', '주얼리', '시계', '선글라스', '스카프', '넥타이', '커프스', '카드지갑', '명함지갑', '키홀더', '열쇠고리', '백참', '헤어핀', '머리핀', '헤어밴드', '벨트', '서스펜더', '장갑', '모자', '캡', '페도라', '베레모', '비니', '머플러', '숄', '케이프', '주얼리세트', '14K', '18K', '골드', '실버', '은', '진주', '다이아몬드', '크리스탈'],
    premium_furniture: ['원목', '대리석', '프리미엄', '이탈리아', '디자이너', '명품가구', '수입가구', '유럽가구', '호두나무', '참나무', '오크', '월넛', '마호가니', '티크', '무늬목', '원목가구', '천연가죽', '이태리가죽', '수입소파', '명품소파', '럭셔리가구', '하이엔드', '모던', '빈티지', '앤틱', '클래식', '북유럽', '스칸디나비안'],
    luxury_items: ['명품', '브랜드', '럭셔리', '프리미엄소품', 'VIP', '선물세트', '기프트세트', '프리미엄세트', '명품소품', '수입', '수입소품', '인테리어명품', '하이엔드소품', '아트소품', '아트피스', '갤러리', '컬렉터', '한정판', '리미티드', 'limited']
  },
  kids: {
    toys: ['장난감', '완구', '블록', '레고', '인형', '로봇', '퍼즐', '보드게임', '피규어', '자동차장난감', '기차', '트랙', '변신로봇', '히어로', '공주', '바비', '실바니안', '뽀로로', '타요', '핑크퐁', '키티', '공룡', '동물인형', '봉제인형', '원목블록', '자석블록', '나노블록', '조립', '만들기', 'RC카', '드론', '리모컨장난감', '물총', '비눗방울', '슬라임', '점토', '클레이', '플레이도'],
    baby: ['유아', '아기', '기저귀', '젖병', '이유식', '유모차', '카시트', '아기옷', '신생아', '유아용품', '아기용품', '수유', '수유쿠션', '수유등', '쪽쪽이', '공갈젖꼭지', '분유', '유아식', '이유식용기', '아기식기', '아기수저', '빨대컵', '아기물병', '유아침대', '아기침대', '범퍼침대', '아기이불', '아기베개', '바운서', '점퍼루', '보행기', '아기띠', '힙시트', '유아목욕', '아기욕조', '유아로션', '베이비로션', '기저귀크림'],
    education: ['교육', '학습', '동화책', '교구', '악기', '그림책', '학습지', '영어', '한글', '수학', '과학', '역사', '위인전', '전래동화', '명작동화', '팝업북', '사운드북', '스티커북', '색칠공부', '그리기', '미술', '크레파스', '색연필', '물감', '스케치북', '교육완구', '학습완구', '코딩', 'STEM', '과학실험', '현미경', '망원경', '피아노', '건반', '리코더', '우쿨렐레', '키즈기타', '드럼', '실로폰', '단소', '하모니카']
  }
};

// Default subcategory for each main category (used when no keyword match found)
const DEFAULT_SUBCATEGORY: Record<string, string> = {
  home_interior: 'decor',
  beauty: 'skincare',
  electronics: 'home_appliance',
  living: 'kitchen',
  health: 'supplements',
  luxury: 'accessories',
  kids: 'toys'
};

function classifySubcategory(productName: string, category: string, description?: string): string {
  const keywords = SUBCATEGORY_KEYWORDS[category];
  if (!keywords) {
    console.log(`[Classification] No keywords for category: ${category}, using default`);
    return DEFAULT_SUBCATEGORY[category] || 'all';
  }
  
  // Combine product name and description for better matching
  const searchText = (productName + ' ' + (description || '')).toLowerCase();
  
  console.log(`[Classification] Classifying: "${productName.substring(0, 40)}..." in ${category}`);
  
  // Score-based matching for better accuracy
  const scores: Record<string, number> = {};
  
  for (const [subcategoryId, subcategoryKeywords] of Object.entries(keywords)) {
    scores[subcategoryId] = 0;
    for (const keyword of subcategoryKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Check if keyword is in the text
      if (searchText.includes(lowerKeyword)) {
        // Give higher score for matches in product name vs description
        const isInName = productName.toLowerCase().includes(lowerKeyword);
        const baseScore = lowerKeyword.length;
        
        if (isInName) {
          // Keywords found in product name are more important (3x weight)
          scores[subcategoryId] += baseScore * 3;
        } else {
          // Keywords found in description get normal weight
          scores[subcategoryId] += baseScore;
        }
      }
    }
  }
  
  // Find subcategory with highest score
  let bestMatch = DEFAULT_SUBCATEGORY[category] || 'all';
  let highestScore = 0;
  
  for (const [subcategoryId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = subcategoryId;
    }
  }
  
  // Log the classification result
  if (highestScore > 0) {
    console.log(`[Classification] → ${bestMatch} (score: ${highestScore})`);
  } else {
    console.log(`[Classification] → ${bestMatch} (default, no keyword match)`);
  }
  
  return bestMatch;
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
    
    const isValidProductImage = (url: string): boolean => {
      if (!url) return false;
      if (url.includes('icon') || url.includes('logo') || url.includes('button')) return false;
      if (url.includes('spacer') || url.includes('blank') || url.includes('loading')) return false;
      if (url.includes('s_star') || url.includes('facebook') || url.includes('twitter')) return false;
      if (url.includes('/skin/') || url.includes('/theme/')) return false;
      if (url.length < 20) return false;
      return url.includes('/data/item/') || 
             url.includes('pstatic.net') || 
             url.includes('proxy-smartstore') ||
             url.includes('godohosting.com') ||
             url.includes('cafe24') ||
             url.includes('makeshop') ||
             url.match(/\.(jpg|jpeg|png|gif|webp)/i) !== null;
    };
    
    const isValidDescriptionImage = (url: string): boolean => {
      if (!url) return false;
      if (url.includes('icon') || url.includes('logo') || url.includes('button')) return false;
      if (url.includes('s_star') || url.includes('facebook') || url.includes('twitter')) return false;
      if (url.includes('/skin/') || url.includes('/theme/')) return false;
      if (url.includes('banner') || url.includes('event')) return false;
      if (url.length < 30) return false;
      const validSources = [
        'pstatic.net', 'proxy-smartstore', 'godohosting.com', 
        'naver.net', 'cafe24.com', 'makeshop', 'imweb.me',
        '/data/', 'cdn.', 'img.', 'image.', 'upload'
      ];
      return validSources.some(src => url.includes(src)) ||
             (url.match(/\.(jpg|jpeg|png|gif|webp)/i) !== null && url.includes('http'));
    };
    
    // 1. Main product gallery images
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
      if (src && src.includes('/data/item/') && isValidProductImage(src)) {
        const fullUrl = absoluteUrl(src);
        const highResUrl = fullUrl.replace(/thumb-([^_]+)_\d+x\d+/, 'thumb-$1_1000x1000');
        if (!seenUrls.has(highResUrl) && !seenUrls.has(fullUrl)) {
          seenUrls.add(highResUrl);
          seenUrls.add(fullUrl);
          imageUrls.push(highResUrl);
        }
      }
    });
    
    // 2. Product detail section images - common Korean e-commerce patterns
    const detailSelectors = [
      '#sit_inf_explan img',
      '.product-detail img',
      '.item-detail img', 
      '.goods-detail img',
      '.detail-content img',
      '#prdDetail img',
      '.se-main-container img',
      '[class*="detail"] img',
      '[class*="description"] img',
      '[id*="detail"] img',
      '.editor-content img',
      '.view-content img',
      '#sit_detail img',
      '.sit_inf_wrap img'
    ];
    
    detailSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const $img = $(el);
        const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-lazy-src');
        if (src && isValidDescriptionImage(src)) {
          const fullUrl = src.startsWith('http') ? src : absoluteUrl(src);
          if (!seenUrls.has(fullUrl)) {
            seenUrls.add(fullUrl);
            descriptionImages.push(fullUrl);
          }
        }
      });
    });
    
    // 3. Naver SmartStore specific images
    $('img.se-inline-image-resource, img.se-image-resource, .se-component img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && isValidDescriptionImage(src)) {
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          descriptionImages.push(src);
        }
      }
    });
    
    // 4. CDN images from various sources
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      const cdnPatterns = [
        'proxy-smartstore', 'shop-phinf.pstatic.net', 'godohosting.com',
        'cafe24.com', 'makeshop.co.kr', 'imweb.me', 'naver.net'
      ];
      if (src && cdnPatterns.some(p => src.includes(p))) {
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          descriptionImages.push(src);
        }
      }
    });
    
    // 5. Extract from inline HTML/scripts (embedded image URLs)
    const imagePatterns = [
      /src=["'](https?:\/\/proxy-smartstore\.naver\.net[^"']+)["']/g,
      /src=["'](https?:\/\/shop-phinf\.pstatic\.net[^"']+)["']/g,
      /src=["'](https?:\/\/[^"']*godohosting\.com[^"']+)["']/g,
      /src=["'](https?:\/\/[^"']*cafe24[^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)["']/gi,
      /src=["'](https?:\/\/[^"']+\/data\/[^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)["']/gi,
      /"(https?:\/\/[^"]+\/data\/item\/[^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/gi,
      /data-src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)["']/gi
    ];
    
    imagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        if (url && isValidDescriptionImage(url) && !seenUrls.has(url)) {
          seenUrls.add(url);
          descriptionImages.push(url);
        }
      }
    });
    
    // 6. Get product description text from multiple sources
    let description = '';
    const descriptionSelectors = [
      '#sit_inf_explan',
      '.product-detail',
      '#sit_inf',
      '.item-description',
      '.goods-description',
      '.detail-text',
      '#prdDetail',
      '.se-text-paragraph',
      '[class*="description"]',
      '.editor-content p',
      '.view-content'
    ];
    
    for (const selector of descriptionSelectors) {
      const text = $(selector).text().trim();
      if (text && text.length > description.length) {
        description = text.replace(/\s+/g, ' ').substring(0, 2000).trim();
      }
    }
    
    // 7. Also extract structured product info
    const productInfoSelectors = [
      '.product-info', '.goods-info', '.item-info',
      'table.info-table td', '.spec-list li'
    ];
    
    let additionalInfo = '';
    productInfoSelectors.forEach(selector => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 5 && text.length < 500) {
          additionalInfo += text + ' ';
        }
      });
    });
    
    if (additionalInfo && !description.includes(additionalInfo.substring(0, 50))) {
      description = (description + ' ' + additionalInfo).trim().substring(0, 2000);
    }
    
    console.log(`[Vivian Crawler] Detail: ${imageUrls.length} gallery, ${descriptionImages.length} description images, ${description.length} chars text`);
    
    return {
      imageUrls: imageUrls.slice(0, 20),
      descriptionImages: descriptionImages.slice(0, 100),
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
          // Auto-classify based on product name AND description for better accuracy
          subcategory = classifySubcategory(name, category, detail.description);
        }
        
        // Ensure subcategory is never 'all' - use default for category
        if (!subcategory || subcategory === 'all') {
          subcategory = DEFAULT_SUBCATEGORY[category] || Object.keys(SUBCATEGORY_KEYWORDS[category] || {})[0] || 'all';
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
