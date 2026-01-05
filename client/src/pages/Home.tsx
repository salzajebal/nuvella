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
    <section className="py-12 sm:py-16 bg-gradient-to-r from-gold-50 via-white to-gold-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-block border border-gold-400 px-4 py-2 bg-gold-50">
              <span className="text-sm text-gold-700">ESTELLA</span>
            </div>
            <h2 
              className="text-3xl sm:text-4xl font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              에스텔라
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              프리미엄 라이프스타일을 위한 엄선된 상품들을 만나보세요.
              홈 인테리어부터 뷰티, 럭셔리까지 당신의 일상을 특별하게 합니다.
            </p>
            <Link href="/products">
              <Button 
                variant="outline" 
                className="rounded-full px-6 border-gold-600 text-gold-700 hover:bg-gold-600 hover:text-white"
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
                background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 50%, #B8860B 100%)",
                opacity: 0.15
              }}
            />
            <div className="relative grid grid-cols-2 gap-4 p-4">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop" 
                    alt="홈 인테리어" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-600 line-clamp-2">프리미엄 홈 인테리어 컬렉션</p>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-gold-700">홈 인테리어</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop" 
                    alt="뷰티" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-600 line-clamp-2">럭셔리 뷰티 & 스킨케어</p>
                  <div className="mt-2">
                    <span className="text-sm font-bold text-gold-700">뷰티</span>
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
