import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import type { Review } from "@shared/schema";

function BrandSection() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block border border-gray-300 px-4 py-2">
              <span className="text-sm text-gray-600">블루블랙</span>
            </div>
            <h2 
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              블루블랙
            </h2>
            <Link href="/products">
              <Button 
                variant="outline" 
                className="rounded-full px-6 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
                data-testid="button-view-more"
              >
                자세히보기
              </Button>
            </Link>
          </div>
          
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                background: "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #1E90FF 100%)",
                opacity: 0.3
              }}
            />
            <div className="relative grid grid-cols-2 gap-4 p-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop" 
                    alt="Beauty product" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-600 line-clamp-2">아네트 레비쉬 미라클 듀얼 세럼 13g</p>
                  <div className="mt-2">
                    <span className="text-xs text-gray-400 line-through">34,000원</span>
                    <span className="text-sm font-bold text-gray-900 ml-2">28,900원</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop" 
                    alt="Beauty product" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-600 line-clamp-2">오아드 포어 퍼펙팅 미라클 쿠션 2 colors</p>
                  <div className="mt-2">
                    <span className="text-xs text-gray-400 line-through">45,000원</span>
                    <span className="text-sm font-bold text-gray-900 ml-2">39,000원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewProductsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8">
          최신상품
        </h2>
        <ProductGrid showCategoryFilter={false} limit={4} isNew={true} />
      </div>
    </section>
  );
}

function PopularProductsSection() {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8">
          인기상품
        </h2>
        <ProductGrid showCategoryFilter={false} limit={4} isBest={true} />
      </div>
    </section>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews?limit=6");
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };
    fetchReviews();
  }, []);

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(
    currentPage * reviewsPerPage,
    (currentPage + 1) * reviewsPerPage
  );

  const goToPrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  if (reviews.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8">
          상품후기
        </h2>
        
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentReviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white border border-gray-100 rounded-lg p-6"
                data-testid={`card-review-${review.id}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {review.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.title}</p>
                    <p className="text-xs text-gray-500">{review.productName}</p>
                  </div>
                </div>
                
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3">{review.content}</p>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={goToPrev}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                data-testid="button-review-prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentPage ? "bg-gray-900" : "bg-gray-300"
                  }`}
                  data-testid={`button-review-dot-${i}`}
                />
              ))}
              
              <button
                onClick={goToNext}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                data-testid="button-review-next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Header />
      
      <main>
        <Hero />
        <BrandSection />
        <NewProductsSection />
        <PopularProductsSection />
        <ReviewsSection />
        
        <section className="py-12 sm:py-16">
          <div className="container-custom">
            <ProductGrid title="전체 상품" showCategoryFilter={true} />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
