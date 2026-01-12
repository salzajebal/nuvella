import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";

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

function NewProductsSection() {
  return (
    <section className="py-8 sm:py-12">
      <div className="container-custom">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
          최신상품
        </h2>
        <ProductGrid showCategoryFilter={false} limit={4} isNew={true} />
      </div>
    </section>
  );
}

function PopularProductsSection() {
  return (
    <section className="py-8 sm:py-12 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
          인기상품
        </h2>
        <ProductGrid showCategoryFilter={false} limit={4} isBest={true} />
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
    <section className="py-8 sm:py-12 border-t border-gray-200">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">사용자 리뷰</h2>
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
            <Link key={review.id} href={`/products/${review.productId}`}>
              <div 
                className="flex-shrink-0 w-[180px] sm:w-[200px] cursor-pointer group"
                data-testid={`card-review-${review.id}`}
              >
                <div className="aspect-square bg-gray-100 mb-3 overflow-hidden">
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

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Header />
      
      <main>
        <NewProductsSection />
        <PopularProductsSection />
        <ReviewsSection />
      </main>
      
      <Footer />
    </div>
  );
}
