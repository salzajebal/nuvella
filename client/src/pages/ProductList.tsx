import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useRoute, Link } from "wouter";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEFAULT_CATEGORIES = [
  { id: "home_interior", name: "홈 인테리어", description: "감각적인 홈 인테리어 제품을 만나보세요" },
  { id: "beauty", name: "뷰티", description: "뷰티 & 스킨케어 베스트 아이템" },
  { id: "electronics", name: "가전/디지털", description: "최신 가전 및 디지털 제품" },
  { id: "living", name: "생활용품", description: "실용적인 생활용품 모음" },
  { id: "health", name: "헬스/건강식품", description: "건강을 위한 선택" },
  { id: "luxury", name: "럭셔리/명품", description: "프리미엄 럭셔리 컬렉션" },
  { id: "baby", name: "유아/완구", description: "아이를 위한 특별한 선물" },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop";

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const categoryId = match ? params.category : "all";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  const categoryInfo = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || { name: "전체 상품", description: "블루블랙의 모든 상품을 만나보세요" };

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(product.id);
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      weight: product.weight,
      purity: product.purity,
    });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist 
        ? `${product.name}이(가) 삭제되었습니다.` 
        : `${product.name}이(가) 찜 목록에 추가되었습니다.`,
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = categoryId === "all" 
          ? "/api/products" 
          : `/api/products?category=${categoryId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    setLoading(true);
    fetchProducts();
  }, [categoryId]);

  const formatPrice = (price: string) => {
    const numPrice = parseInt(price.replace(/,/g, ''), 10);
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" data-testid="text-category-title">
            {categoryInfo.name}
          </h1>
          <p className="text-gray-500 text-sm">{categoryInfo.description}</p>
        </div>
        
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <div className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-900" data-testid="text-product-count">{products.length}</span>개의 상품
          </div>
          <div className="flex gap-2 text-sm">
            <select className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900">
              <option>신상품순</option>
              <option>낮은가격순</option>
              <option>높은가격순</option>
              <option>인기상품순</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">상품을 불러오는 중...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <Link 
                key={product.id}
                href={`/product/${product.id}`}
                className="group cursor-pointer"
                data-testid={`card-product-${product.id}`}
              >
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden mb-3">
                  <img 
                    src={product.imageUrl || DEFAULT_IMAGE} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isBest && (
                      <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium">
                        BEST
                      </span>
                    )}
                    {product.isNew && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-1 font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className={cn(
                      "absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white",
                      isInWishlist(product.id) && "text-red-500"
                    )} 
                    onClick={(e) => handleWishlistToggle(e, product)}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current")} />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm text-gray-900 line-clamp-2 group-hover:underline">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}원
                      </span>
                    )}
                    {product.discountPercent && product.discountPercent > 0 && (
                      <span className="text-xs text-red-500 font-medium">
                        {product.discountPercent}%
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-bold text-gray-900" data-testid={`price-product-${product.id}`}>
                    {formatPrice(product.price)}원
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-gray-50">
            <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
            <p className="text-sm text-gray-400">관리자 페이지에서 상품을 추가해주세요.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
