import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CATEGORIES = [
  { id: "home_interior", name: "홈 인테리어" },
  { id: "beauty", name: "뷰티" },
  { id: "electronics", name: "가전/디지털" },
  { id: "living", name: "생활용품" },
  { id: "health", name: "헬스/건강식품" },
  { id: "luxury", name: "럭셔리/명품" },
  { id: "kids", name: "유아/완구" },
];

const CATEGORY_IMAGES: Record<string, string> = {
  home_interior: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&h=500&fit=crop",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop",
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop",
  living: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop",
  health: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=500&h=500&fit=crop",
  luxury: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=500&fit=crop",
  kids: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&h=500&fit=crop",
  baby: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&h=500&fit=crop",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop";

function getProductImage(product: Product): string {
  if (product.imageUrl && !product.imageUrl.includes('placehold.co')) {
    return product.imageUrl;
  }
  if (product.imageUrls && product.imageUrls.length > 0 && !product.imageUrls[0].includes('placehold.co')) {
    return product.imageUrls[0];
  }
  return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
}

interface ProductGridProps {
  title?: string;
  showCategoryFilter?: boolean;
  limit?: number;
  category?: string;
  isBest?: boolean;
  isNew?: boolean;
}

export function ProductGrid({ 
  title, 
  showCategoryFilter = true, 
  limit,
  category: initialCategory,
  isBest,
  isNew
}: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

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

  const fetchProducts = async () => {
    try {
      let url = "/api/products";
      const params = new URLSearchParams();
      
      if (activeCategory !== "all") {
        params.set("category", activeCategory);
      }
      if (isBest) {
        params.set("isBest", "true");
      }
      if (isNew) {
        params.set("isNew", "true");
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        let productList = data.data;
        if (limit) {
          productList = productList.slice(0, limit);
        }
        setProducts(productList);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [activeCategory]);

  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return '0';
    const priceStr = String(price);
    const numPrice = parseInt(priceStr.replace(/,/g, ''), 10);
    if (isNaN(numPrice)) return priceStr;
    return numPrice.toLocaleString();
  };

  return (
    <section className="py-8 sm:py-12">
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8" data-testid="text-section-title">
          {title}
        </h2>
      )}
      
      {showCategoryFilter && (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2">
            <button 
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium transition-all border-b-2",
                activeCategory === "all" 
                  ? "border-gray-900 text-gray-900" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
              data-testid="button-category-all"
            >
              전체
            </button>
            {DEFAULT_CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-medium transition-all border-b-2",
                  activeCategory === cat.id 
                    ? "border-gray-900 text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-900"
                )}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="text-gray-500 text-sm">상품을 불러오는 중...</div>
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
                  src={getProductImage(product)} 
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
                  {product.isHot && (
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-1 font-medium">
                      HOT
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
        <div className="py-16 text-center bg-gray-50">
          <p className="text-gray-500 text-sm">등록된 상품이 없습니다.</p>
        </div>
      )}
    </section>
  );
}
