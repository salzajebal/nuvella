import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Heart, ChevronRight, Truck, Shield, Award, RotateCcw, ShoppingBag, Star, Edit3, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Review } from "@shared/schema";

const CATEGORY_IMAGES: Record<string, string> = {
  home_interior: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&h=800&fit=crop",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop",
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=800&fit=crop",
  living: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop",
  health: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800&h=800&fit=crop",
  luxury: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop",
  kids: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop",
  baby: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop";

function getProductImage(product: Product | null, url?: string | null): string {
  if (url && !url.includes('placehold.co')) return url;
  if (product?.imageUrl && !product.imageUrl.includes('placehold.co')) return product.imageUrl;
  if (product?.imageUrls && product.imageUrls.length > 0 && !product.imageUrls[0].includes('placehold.co')) return product.imageUrls[0];
  if (product?.category) return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
  return DEFAULT_IMAGE;
}

const PRODUCT_DETAILS: Record<string, { features: string[]; specs: { label: string; value: string }[]; notice: string }> = {
  home_interior: {
    features: [
      "프리미엄 품질의 홈 인테리어 제품",
      "세련된 북유럽 스타일 디자인",
      "내구성이 뛰어난 고급 소재 사용",
      "전문 디자이너의 제품 큐레이션",
      "친환경 소재로 안전하게 사용",
      "1년 품질 보증 서비스"
    ],
    specs: [
      { label: "스타일", value: "모던/북유럽" },
      { label: "소재", value: "프리미엄 등급" },
      { label: "보증", value: "1년 품질 보증" },
      { label: "배송", value: "무료 배송" }
    ],
    notice: "홈 인테리어 제품은 공간의 분위기를 바꿔줍니다. 고객님의 취향에 맞는 제품을 선택하세요."
  },
  beauty: {
    features: [
      "피부과 전문의 추천 성분",
      "무자극 테스트 완료",
      "비건/크루얼티프리 제품",
      "피부 타입별 맞춤 솔루션",
      "고농축 에센스 함유",
      "즉각적인 효과 확인 가능"
    ],
    specs: [
      { label: "타입", value: "모든 피부 타입" },
      { label: "용량", value: "제품별 상이" },
      { label: "테스트", value: "무자극 테스트 완료" },
      { label: "인증", value: "비건 인증" }
    ],
    notice: "뷰티 제품은 개인의 피부 상태에 따라 효과가 다를 수 있습니다. 민감한 피부의 경우 패치 테스트 후 사용을 권장합니다."
  },
  electronics: {
    features: [
      "최신 기술 적용 스마트 기기",
      "에너지 효율 1등급 제품",
      "직관적인 사용자 인터페이스",
      "무상 A/S 서비스 제공",
      "정품 인증 및 품질 보증",
      "전문 기사 설치 가능"
    ],
    specs: [
      { label: "에너지", value: "효율 1등급" },
      { label: "A/S", value: "1년 무상 서비스" },
      { label: "인증", value: "KC 인증 완료" },
      { label: "설치", value: "전문 기사 설치" }
    ],
    notice: "가전제품은 전문 기사 설치를 권장합니다. A/S 문의는 고객센터로 연락해주세요."
  },
  living: {
    features: [
      "일상을 편리하게 만드는 실용적 제품",
      "고품질 소재로 오래 사용 가능",
      "세련된 디자인과 기능성 겸비",
      "환경을 생각한 친환경 제품",
      "다용도로 활용 가능",
      "합리적인 가격대"
    ],
    specs: [
      { label: "용도", value: "다용도" },
      { label: "소재", value: "친환경 소재" },
      { label: "내구성", value: "장기 사용 가능" },
      { label: "디자인", value: "모던 스타일" }
    ],
    notice: "생활용품은 일상을 더 편리하게 만들어줍니다. 다양한 용도로 활용해보세요."
  },
  health: {
    features: [
      "식약처 인증 건강기능식품",
      "GMP 인증 시설에서 생산",
      "천연 원료 100% 사용",
      "체계적인 품질 관리 시스템",
      "전문 영양사 추천 제품",
      "섭취 방법 안내 포함"
    ],
    specs: [
      { label: "인증", value: "식약처 인증" },
      { label: "원료", value: "천연 원료" },
      { label: "생산", value: "GMP 시설" },
      { label: "용량", value: "제품별 상이" }
    ],
    notice: "건강기능식품은 질병의 예방 및 치료를 위한 의약품이 아닙니다. 개인 건강 상태에 따라 전문가와 상담 후 섭취하시기 바랍니다."
  },
  luxury: {
    features: [
      "명품 브랜드 정품 보증",
      "프리미엄 가죽/소재 사용",
      "장인 정신이 담긴 수작업",
      "정품 인증서 및 보증서 발급",
      "고급 패키지 포함",
      "A/S 서비스 제공"
    ],
    specs: [
      { label: "인증", value: "정품 보증서" },
      { label: "소재", value: "프리미엄 등급" },
      { label: "제작", value: "수작업 마감" },
      { label: "A/S", value: "브랜드 공식 A/S" }
    ],
    notice: "럭셔리 제품은 정품 보증서와 함께 배송됩니다. A/S는 브랜드 공식 서비스센터를 이용해주세요."
  },
  kids: {
    features: [
      "유해물질 없는 안전한 소재",
      "KC 안전 인증 완료 제품",
      "아이 발달 단계에 맞춘 설계",
      "부드러운 촉감과 안전한 모서리",
      "쉽게 세척 가능한 소재",
      "교육적 효과를 고려한 디자인"
    ],
    specs: [
      { label: "인증", value: "KC 안전 인증" },
      { label: "소재", value: "무독성 안전 소재" },
      { label: "연령", value: "제품별 권장 연령" },
      { label: "세척", value: "물세척 가능" }
    ],
    notice: "유아용품은 사용 전 반드시 권장 연령을 확인해주세요. 아이가 사용 시 보호자의 관찰이 필요합니다."
  }
};

interface ReviewableOrder {
  id: string;
  orderNumber: string;
  productName: string;
  createdAt: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [autoOpenReview, setAutoOpenReview] = useState(false);
  const [detailTab, setDetailTab] = useState<"product" | "reviews">("product");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    content: ""
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [editReviewForm, setEditReviewForm] = useState({
    rating: 5,
    title: "",
    content: ""
  });
  const currentMemberId = localStorage.getItem("memberId");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/products/${id}/reviews`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    const checkCanReview = async () => {
      const token = localStorage.getItem("memberToken");
      if (!token) return;
      
      try {
        const res = await fetch(`/api/products/${id}/can-review`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCanReview(data.data.canReview);
          setReviewableOrders(data.data.orders);
          if (data.data.orders.length > 0) {
            setSelectedOrderId(data.data.orders[0].id);
          }
        }
      } catch (error) {
        console.error("Error checking review eligibility:", error);
      }
    };

    if (id) {
      fetchReviews();
      checkCanReview();
    }
  }, [id]);

  // Auto-open review modal when writeReview=1 query param is present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("writeReview") === "1") {
      setAutoOpenReview(true);
    }
  }, []);

  // Open review modal when we have reviewable orders and autoOpenReview is true
  useEffect(() => {
    if (autoOpenReview && canReview && reviewableOrders.length > 0) {
      setShowReviewModal(true);
      setAutoOpenReview(false);
      // Clean up the URL
      window.history.replaceState({}, "", `/product/${id}`);
    }
  }, [autoOpenReview, canReview, reviewableOrders, id]);

  const handleSubmitReview = async () => {
    if (!selectedOrderId || !reviewForm.title || !reviewForm.content) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    if (reviewForm.content.length < 50) {
      toast({
        title: "입력 오류",
        description: "후기 내용은 50자 이상 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("memberToken");
      const memberNickname = localStorage.getItem("memberNickname") || localStorage.getItem("memberName") || "회원";
      
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          productId: id,
          authorName: memberNickname,
          rating: reviewForm.rating,
          title: reviewForm.title,
          content: reviewForm.content
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "후기 작성 완료",
          description: "소중한 후기를 남겨주셔서 감사합니다."
        });
        setShowReviewModal(false);
        setReviewForm({ rating: 5, title: "", content: "" });
        
        const reviewsRes = await fetch(`/api/products/${id}/reviews`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }
        
        setReviewableOrders(prev => prev.filter(o => o.id !== selectedOrderId));
        setCanReview(reviewableOrders.length > 1);
      } else {
        throw new Error(data.error || "후기 작성에 실패했습니다.");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "후기 작성에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenEditReview = (review: Review) => {
    setEditingReview(review);
    setEditReviewForm({
      rating: review.rating || 5,
      title: review.title,
      content: review.content
    });
    setShowEditReviewModal(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview || !editReviewForm.title || !editReviewForm.content) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (editReviewForm.content.length < 50) {
      toast({
        title: "입력 오류",
        description: "후기 내용은 50자 이상 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem("memberToken");
      const res = await fetch(`/api/member/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: editReviewForm.rating,
          title: editReviewForm.title,
          content: editReviewForm.content
        })
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "수정 완료",
          description: "후기가 수정되었습니다."
        });
        setShowEditReviewModal(false);
        setEditingReview(null);
        
        // Refresh reviews
        const reviewsRes = await fetch(`/api/products/${id}/reviews`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }
      } else {
        throw new Error(data.error || "후기 수정에 실패했습니다.");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "후기 수정에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("정말 후기를 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("memberToken");
      const res = await fetch(`/api/member/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "삭제 완료",
          description: "후기가 삭제되었습니다."
        });
        
        // Refresh reviews
        const reviewsRes = await fetch(`/api/products/${id}/reviews`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }
      } else {
        throw new Error(data.error || "후기 삭제에 실패했습니다.");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "후기 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleAddToCart = () => {
    toast({
      title: "장바구니에 담았습니다",
      description: `${product?.name} ${quantity}개가 장바구니에 추가되었습니다.`,
    });
  };

  const handleBuyNow = () => {
    setLocation(`/order/${id}?quantity=${quantity}`);
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return '0';
    const priceStr = String(price);
    const numPrice = parseInt(priceStr.replace(/,/g, ''), 10);
    if (isNaN(numPrice)) return priceStr;
    return numPrice.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">상품 정보를 불러오는 중...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
            <Link href="/products" className="text-gray-700 hover:underline">
              상품 목록으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const details = PRODUCT_DETAILS[product.category] || PRODUCT_DETAILS.living;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 pb-28 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto">
            <Link href="/" className="hover:text-gray-900 whitespace-nowrap">홈</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link href="/products" className="hover:text-gray-900 whitespace-nowrap">상품</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-gray-900 truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={(() => {
                    const urls = product.imageUrls && product.imageUrls.length > 0 
                      ? product.imageUrls.filter(u => u && !u.includes('placehold.co')) 
                      : [];
                    if (urls.length > 0) return urls[selectedImageIndex] || urls[0];
                    return getProductImage(product);
                  })()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                {(() => {
                  const urls = product.imageUrls && product.imageUrls.length > 0 
                    ? product.imageUrls.filter(u => u && !u.includes('placehold.co')) 
                    : [];
                  const displayUrls = urls.length > 0 ? urls : [getProductImage(product)];
                  return displayUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className={`w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 overflow-hidden cursor-pointer border-2 flex-shrink-0 ${
                        selectedImageIndex === index ? 'border-gray-900' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={url || getProductImage(product)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium">BEST</span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium">NEW</span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 break-keep">{product.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 break-keep">{product.description}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-4 sm:py-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {product.originalPrice && (
                    <span className="text-sm sm:text-lg text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}원
                    </span>
                  )}
                  {product.discountPercent && product.discountPercent > 0 && (
                    <span className="text-sm sm:text-lg text-red-500 font-bold">
                      {product.discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="price-product-detail">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-base sm:text-lg text-gray-500">원</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">무료 배송</p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-gray-500 text-xs sm:text-sm">수량</span>
                <div className="flex items-center border border-gray-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-500 hover:bg-gray-50 text-sm"
                    data-testid="button-quantity-minus"
                  >
                    -
                  </button>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 border-x border-gray-200 min-w-[40px] sm:min-w-[50px] text-center text-sm" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-500 hover:bg-gray-50 text-sm"
                    data-testid="button-quantity-plus"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14"
                  onClick={handleAddToCart}
                  data-testid="button-add-cart"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  장바구니
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 bg-gray-900 hover:bg-gray-800"
                  onClick={handleBuyNow}
                  data-testid="button-buy-now"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  구매하기
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => toast({ title: "찜 목록에 추가되었습니다" })}
                  data-testid="button-wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">무료배송</span>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">정품보증</span>
                </div>
                <div className="text-center">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">품질인증</span>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gray-600 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">교환/반품</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-gray-200 pt-8">
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setDetailTab("product")}
                className={`flex-1 py-4 text-center font-bold text-lg transition-all ${
                  detailTab === "product"
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                data-testid="tab-product-details"
              >
                상품 상세 정보
              </button>
              <button
                onClick={() => setDetailTab("reviews")}
                className={`flex-1 py-4 text-center font-bold text-lg transition-all ${
                  detailTab === "reviews"
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                data-testid="tab-reviews"
              >
                사용후기 ({reviews.length})
              </button>
            </div>

            {detailTab === "product" && (
            <div>
            
            {product.descriptionImageUrls && product.descriptionImageUrls.length > 0 && (
              <div className="mb-12 space-y-2">
                {Array.from(new Set(product.descriptionImageUrls))
                  .filter((imgUrl) => {
                    const lowerUrl = imgUrl.toLowerCase();
                    if (lowerUrl.includes('vivian-mall.com/data/common/')) return false;
                    if (lowerUrl.includes('vivian-mall.com/data/item/') && 
                        (lowerUrl.includes('thumb-') || lowerUrl.includes('_60x60') || 
                         lowerUrl.includes('_150x150') || lowerUrl.includes('_160x160'))) return false;
                    if (lowerUrl.includes('clois-shop.com/data/common/')) return false;
                    if (lowerUrl.includes('logo')) return false;
                    if (lowerUrl.includes('banner')) return false;
                    if (lowerUrl.includes('top_')) return false;
                    if (lowerUrl.includes('header')) return false;
                    if (lowerUrl.includes('tit_proinfo')) return false;
                    if (lowerUrl.includes('keyvisual')) return false;
                    if (lowerUrl.includes('danawa.com')) return false;
                    if (lowerUrl.match(/\/\d+\.(jpg|png|gif|webp)$/)) return false;
                    return true;
                  })
                  .map((imgUrl, index) => (
                  <img 
                    key={index}
                    src={imgUrl}
                    alt={`${product.name} 상세이미지 ${index + 1}`}
                    className="w-full max-w-3xl mx-auto"
                    loading="lazy"
                    style={{ imageRendering: 'auto' }}
                  />
                ))}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">상품 특징</h3>
                <ul className="space-y-3">
                  {details.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                      <span className="text-gray-900 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-4">상품 스펙</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="w-full text-sm">
                    <tbody>
                      {details.specs.map((spec, i) => (
                        <tr key={i} className="border-b border-gray-200 last:border-0">
                          <td className="py-3 text-gray-500 w-24">{spec.label}</td>
                          <td className="py-3 font-medium text-gray-900">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-12">
              <h3 className="font-bold text-gray-900 mb-3">안내사항</h3>
              <p className="text-gray-700 leading-relaxed text-sm">{details.notice}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">배송 및 교환/반품 안내</h3>
              <p className="text-gray-600 text-sm">상세페이지 참조</p>
            </div>
            </div>
            )}

            {detailTab === "reviews" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  사용후기 ({reviews.length})
                </h2>
                <Button 
                  onClick={() => {
                    if (canReview) {
                      setShowReviewModal(true);
                    } else {
                      toast({
                        title: "구매자만 후기 작성 가능",
                        description: "해당 상품을 구매하신 분만 후기를 작성할 수 있습니다.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="gap-2"
                  data-testid="button-write-review"
                >
                  <Edit3 className="w-4 h-4" />
                  후기 작성
                </Button>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">아직 작성된 후기가 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-2">첫 번째 후기를 작성해보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-5" data-testid={`review-item-${review.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{review.authorName}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (review.rating || 5) 
                                    ? "text-yellow-400 fill-yellow-400" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {review.displayDate 
                              ? new Date(review.displayDate).toLocaleDateString("ko-KR")
                              : review.createdAt 
                                ? new Date(review.createdAt).toLocaleDateString("ko-KR")
                                : ""
                            }
                          </span>
                          {currentMemberId && (review as any).memberId === currentMemberId && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-gray-500 hover:text-blue-600"
                                onClick={() => handleOpenEditReview(review)}
                                data-testid={`button-edit-review-${review.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-gray-500 hover:text-red-600"
                                onClick={() => handleDeleteReview(review.id)}
                                data-testid={`button-delete-review-${review.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40 p-4">
            <div className="flex gap-3 max-w-lg mx-auto">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={handleAddToCart}
              >
                장바구니
              </Button>
              <Button
                className="flex-1 h-12 bg-gray-900 hover:bg-gray-800"
                onClick={handleBuyNow}
              >
                구매하기
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>사용후기 작성</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reviewableOrders.length > 1 && (
              <div>
                <Label>주문 선택</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                >
                  {reviewableOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <Label>별점</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewForm.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="review-title">제목</Label>
              <Input
                id="review-title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="후기 제목을 입력하세요"
                className="mt-1"
                data-testid="input-review-title"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="review-content">내용</Label>
                <span className={`text-xs ${reviewForm.content.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                  {reviewForm.content.length}/50자 이상
                </span>
              </div>
              <Textarea
                id="review-content"
                value={reviewForm.content}
                onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="상품 사용 후기를 작성해주세요 (최소 50자 이상)"
                className="mt-1"
                rows={4}
                data-testid="input-review-content"
              />
              {reviewForm.content.length > 0 && reviewForm.content.length < 50 && (
                <p className="text-xs text-red-500 mt-1">
                  {50 - reviewForm.content.length}자 더 입력해주세요
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReviewModal(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewForm.content.length < 50}
              data-testid="button-submit-review"
            >
              {submittingReview ? "작성 중..." : "후기 등록"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditReviewModal} onOpenChange={setShowEditReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>후기 수정</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>별점</Label>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditReviewForm(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= editReviewForm.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-review-title">제목</Label>
              <Input
                id="edit-review-title"
                value={editReviewForm.title}
                onChange={(e) => setEditReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="후기 제목을 입력하세요"
                className="mt-1"
                data-testid="input-edit-review-title"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-review-content">내용</Label>
                <span className={`text-xs ${editReviewForm.content.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                  {editReviewForm.content.length}/50자 이상
                </span>
              </div>
              <Textarea
                id="edit-review-content"
                value={editReviewForm.content}
                onChange={(e) => setEditReviewForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="상품 사용 후기를 작성해주세요 (최소 50자 이상)"
                className="mt-1"
                rows={4}
                data-testid="input-edit-review-content"
              />
              {editReviewForm.content.length > 0 && editReviewForm.content.length < 50 && (
                <p className="text-xs text-red-500 mt-1">
                  {50 - editReviewForm.content.length}자 더 입력해주세요
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setShowEditReviewModal(false); setEditingReview(null); }}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateReview}
              disabled={editReviewForm.content.length < 50}
              data-testid="button-update-review"
            >
              수정 완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
