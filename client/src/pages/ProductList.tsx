import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useRoute, Link, useSearch } from "wouter";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CATEGORIES, getCategoryById, getSubcategoryName } from "@/lib/categories";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop";

function getProductImage(product: Product): string {
  if (product.imageUrl) return product.imageUrl;
  if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls[0];
  return DEFAULT_IMAGE;
}

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const categoryId = match ? params.category : "all";
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const subcategoryId = searchParams.get("subcategory");
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  
  const categoryData = getCategoryById(categoryId);
  const categoryName = categoryData?.name || "전체 상품";
  const categoryDescription = categoryData?.description || "에스텔라의 모든 상품을 만나보세요";
  const subcategoryName = subcategoryId ? getSubcategoryName(categoryId, subcategoryId) : null;

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
        let url = "/api/products";
        const queryParams = [];
        
        if (categoryId && categoryId !== "all") {
          queryParams.push(`category=${categoryId}`);
        }
        if (subcategoryId) {
          queryParams.push(`subcategory=${subcategoryId}`);
        }
        
        if (queryParams.length > 0) {
          url += "?" + queryParams.join("&");
        }
        
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
  }, [categoryId, subcategoryId]);

  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return '0';
    const priceStr = String(price);
    const numPrice = parseInt(priceStr.replace(/,/g, ''), 10);
    if (isNaN(numPrice)) return priceStr;
    return numPrice.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-8 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 overflow-x-auto">
            <Link href="/" className="hover:text-gray-700 whitespace-nowrap">홈</Link>
            <span>/</span>
            <Link href={`/products/${categoryId}`} className="hover:text-gray-700 whitespace-nowrap">{categoryName}</Link>
            {subcategoryName && (
              <>
                <span>/</span>
                <span className="text-gray-900 whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{subcategoryName}</span>
              </>
            )}
          </div>
          
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-keep" data-testid="text-category-title">
            {subcategoryName || categoryName}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">{categoryDescription}</p>
        </div>

        {categoryData && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              <Link
                href={`/products/${categoryId}`}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full border whitespace-nowrap transition-colors",
                  !subcategoryId
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                )}
                data-testid={`filter-${categoryId}-all`}
              >
                전체
              </Link>
              {categoryData.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/products/${categoryId}?subcategory=${sub.id}`}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full border whitespace-nowrap transition-colors",
                    subcategoryId === sub.id
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  )}
                  data-testid={`filter-${categoryId}-${sub.id}`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="text-xs sm:text-sm text-gray-500">
            총 <span className="font-bold text-gray-900" data-testid="text-product-count">{products.length}</span>개의 상품
          </div>
          <div className="flex gap-2 text-xs sm:text-sm">
            <select className="border border-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:border-gray-900 rounded">
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
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden mb-3 rounded-lg">
                  <img 
                    src={getProductImage(product)} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isBest && (
                      <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-medium rounded">
                        BEST
                      </span>
                    )}
                    {product.isNew && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-1 font-medium rounded">
                        NEW
                      </span>
                    )}
                    {product.isHot && (
                      <span className="bg-orange-500 text-white text-[10px] px-2 py-1 font-medium rounded">
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
          <div className="py-20 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
            <p className="text-sm text-gray-400">관리자 페이지에서 상품을 추가해주세요.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
