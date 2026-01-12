import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatKRW } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Home as HomeIcon, Sparkles, Tv, ShoppingBag, Heart, Crown, Baby } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  imageUrl?: string;
  imageUrls?: string[];
  category: string;
  isBest?: boolean;
  isNew?: boolean;
}

interface ReviewWithProduct {
  id: string;
  title: string;
  content: string;
  authorName: string;
  rating: number;
  productId: string;
  productName: string;
  productImage?: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: "home_interior", name: "홈 인테리어", icon: HomeIcon },
  { id: "beauty", name: "뷰티", icon: Sparkles },
  { id: "electronics", name: "가전/디지털", icon: Tv },
  { id: "living", name: "생활용품", icon: ShoppingBag },
  { id: "health", name: "헬스/건강식품", icon: Heart },
  { id: "luxury", name: "럭셔리/명품", icon: Crown },
  { id: "kids", name: "유아/완구", icon: Baby },
];

function CategorySidebar() {
  return (
    <div className="hidden lg:block w-[200px] flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-900 text-white px-4 py-3 font-bold text-sm">
          MAIN CATEGORIES
        </div>
        <div className="grid grid-cols-2 gap-px bg-gray-200">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link key={cat.id} href={`/products/${cat.id}`}>
                <div 
                  className="bg-white p-3 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                  data-testid={`category-link-${cat.id}`}
                >
                  <IconComponent className="w-6 h-6 text-gray-600" />
                  <span className="text-xs text-gray-700 text-center leading-tight">{cat.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MainHeroSection() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?isNew=true&limit=4");
        const data = await res.json();
        if (data.success) {
          setFeaturedProducts(data.data.products || data.data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (featuredProducts.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredProducts.length]);

  const currentProduct = featuredProducts[currentIndex];

  if (!currentProduct) {
    return (
      <div className="flex-1 bg-gray-100 rounded-lg min-h-[400px] flex items-center justify-center">
        <span className="text-gray-400">상품 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <Link href={`/product/${currentProduct.id}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentProduct.name}</h2>
              {currentProduct.discountPercent && currentProduct.discountPercent > 0 && (
                <p className="text-red-600 font-bold text-lg mb-3">최대 {currentProduct.discountPercent}% OFF</p>
              )}
              <p className="text-gray-600 text-sm mb-4">새롭게 입고된 인기 상품을 만나보세요.</p>
              
              <div className="flex gap-2 mt-4">
                {featuredProducts.slice(0, 4).map((p, idx) => (
                  <button
                    key={p.id}
                    data-testid={`button-hero-thumbnail-${idx}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentIndex(idx);
                    }}
                    className={`w-12 h-12 border-2 rounded overflow-hidden ${idx === currentIndex ? 'border-gray-900' : 'border-gray-200'}`}
                  >
                    <img 
                      src={p.imageUrl || p.imageUrls?.[0] || "https://via.placeholder.com/48"} 
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="w-full md:w-[280px] aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <img 
                src={currentProduct.imageUrl || currentProduct.imageUrls?.[0] || "https://via.placeholder.com/280"} 
                alt={currentProduct.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </Link>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        {featuredProducts.slice(1, 3).map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={product.imageUrl || product.imageUrls?.[0] || "https://via.placeholder.com/80"} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                {product.discountPercent && product.discountPercent > 0 && (
                  <p className="text-red-600 text-xs font-medium">최대 {product.discountPercent}% OFF</p>
                )}
                <p className="text-gray-500 text-xs mt-1 line-clamp-1">다양한 상품을 만나보세요</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RightSidebar() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("beauty");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?category=${activeCategory}&isBest=true&limit=3`);
        const data = await res.json();
        if (data.success) {
          const items = data.data.products || data.data || [];
          setProducts(items.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [activeCategory]);

  const categoryTabs = [
    { id: "beauty", name: "뷰티" },
    { id: "home_interior", name: "홈 인테리어" },
    { id: "living", name: "생활용품" },
    { id: "health", name: "헬스/건강식품" },
  ];

  return (
    <div className="hidden xl:block w-[240px] flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-900 text-white px-4 py-3">
          <span className="font-bold text-sm">상품 판매 순위</span>
        </div>
        
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              data-testid={`button-ranking-tab-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        <div className="p-3 space-y-3">
          {products.map((product, idx) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                data-testid={`card-ranking-${idx + 1}`}
              >
                <span className="text-lg font-bold text-gray-400 w-5">{idx + 1}.</span>
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={product.imageUrl || product.imageUrls?.[0] || "https://via.placeholder.com/48"} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold text-red-600 mt-1">₩ {formatKRW(product.price)}</p>
                </div>
              </div>
            </Link>
          ))}
          {products.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">상품이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("beauty");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?category=${activeCategory}&limit=4`);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.products || data.data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [activeCategory]);

  const categoryTabs = [
    { id: "beauty", name: "뷰티" },
    { id: "home_interior", name: "홈 인테리어" },
    { id: "living", name: "생활용품" },
    { id: "health", name: "헬스/건강식품" },
  ];

  return (
    <section className="py-8">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">주요 카테고리 상품</h2>
          <div className="flex gap-2">
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                data-testid={`button-category-tab-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-sm px-3 py-1 transition-colors ${
                  activeCategory === cat.id 
                    ? 'text-gray-900 font-bold border-b-2 border-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                data-testid={`card-category-product-${product.id}`}
              >
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img 
                    src={product.imageUrl || product.imageUrls?.[0] || "https://via.placeholder.com/200"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-base font-bold text-gray-900">₩ {formatKRW(product.price)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?isBest=true&limit=8");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data.products || data.data || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">인기상품</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors rounded"
              data-testid="button-popular-prev"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors rounded"
              data-testid="button-popular-next"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <div 
                className="flex-shrink-0 w-[200px] bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                data-testid={`card-popular-${product.id}`}
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <img 
                    src={product.imageUrl || product.imageUrls?.[0] || "https://via.placeholder.com/200"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">신상</span>
                    )}
                    {product.isBest && (
                      <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded">인기</span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-base font-bold text-gray-900">₩ {formatKRW(product.price)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews?limit=10");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const reviewsWithProducts = await Promise.all(
            data.data.map(async (review: any) => {
              try {
                const productRes = await fetch(`/api/products/${review.productId}`);
                const productData = await productRes.json();
                return {
                  ...review,
                  productImage: productData.success ? productData.data.imageUrl : null
                };
              } catch {
                return { ...review, productImage: null };
              }
            })
          );
          setReviews(reviewsWithProducts);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (reviews.length === 0) return null;

  return (
    <section className="py-8 border-t border-gray-200">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">사용자 리뷰</h2>
            <div className="w-8 h-0.5 bg-red-500 ml-2"></div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              data-testid="button-review-prev"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              data-testid="button-review-next"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <Link href="/products">
              <button
                className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                data-testid="button-review-more"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </Link>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reviews.map((review) => (
            <Link key={review.id} href={`/product/${review.productId}`}>
              <div 
                className="flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer group"
                data-testid={`card-review-${review.id}`}
              >
                <div className="aspect-square bg-gray-100 mb-3 overflow-hidden rounded-lg">
                  {review.productImage ? (
                    <img 
                      src={review.productImage} 
                      alt={review.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">이미지 없음</span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                  {review.title || review.productName}
                </h3>
                
                <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                  {review.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileCategoryBar() {
  return (
    <div className="lg:hidden bg-white border-b border-gray-200 overflow-x-auto">
      <div className="flex px-4 py-3 gap-4">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <Link key={cat.id} href={`/products/${cat.id}`}>
              <div 
                className="flex flex-col items-center gap-1 min-w-[60px]"
                data-testid={`mobile-category-${cat.id}`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-[10px] text-gray-600 text-center whitespace-nowrap">{cat.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">
      <Header />
      
      <MobileCategoryBar />
      
      <main className="container-custom py-6">
        <div className="flex gap-6">
          <CategorySidebar />
          <MainHeroSection />
          <RightSidebar />
        </div>
      </main>
      
      <CategoryProductsSection />
      <PopularProductsSection />
      <ReviewsSection />
      
      <Footer />
    </div>
  );
}
