import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Search as SearchIcon, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";

export default function Search() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      searchProducts(initialQuery);
    }
  }, [initialQuery]);

  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
      searchProducts(query.trim());
    }
  };

  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      home_interior: "홈 인테리어",
      beauty: "뷰티",
      electronics: "가전/디지털",
      living: "생활용품",
      health: "헬스/건강식품",
      luxury: "럭셔리/명품",
      kids: "유아/완구",
    };
    return categories[categoryId] || categoryId;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <main className="container-custom py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <SearchIcon className="w-6 h-6" />
            상품 검색
          </h1>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="상품명을 입력하세요"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  data-testid="input-search-query"
                />
              </div>
              <Button type="submit" className="h-12 px-6" data-testid="button-search">
                검색
              </Button>
            </div>
          </form>

          {initialQuery && (
            <p className="text-gray-600 mb-4">
              "<span className="font-bold text-gray-900">{initialQuery}</span>" 검색 결과 
              <span className="font-bold text-primary ml-1">{products.length}건</span>
            </p>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              검색 중...
            </div>
          ) : products.length === 0 && initialQuery ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">검색 결과가 없습니다.</p>
              <p className="text-sm text-gray-400">다른 검색어로 시도해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="aspect-square bg-gray-50 relative">
                    <img
                      src={product.imageUrl || "/images/placeholder.png"}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {product.isBest && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                        BEST
                      </span>
                    )}
                    {product.isNew && (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {getCategoryName(product.category || "")}
                    </p>
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <p className="font-bold text-primary">
                      {parseInt(product.price || "0").toLocaleString()}원
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
