import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ChevronRight, Truck, Shield, Award, RotateCcw, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop";

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

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-900">홈</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-gray-900">상품</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={
                    product.imageUrls && product.imageUrls.length > 0
                      ? product.imageUrls[selectedImageIndex] || product.imageUrls[0]
                      : product.imageUrl || DEFAULT_IMAGE
                  }
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl || DEFAULT_IMAGE]).map((url, index) => (
                  <div 
                    key={index} 
                    className={`w-16 h-16 bg-gray-100 overflow-hidden cursor-pointer border-2 ${
                      selectedImageIndex === index ? 'border-gray-900' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={url || DEFAULT_IMAGE}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-xs px-2 py-1 font-medium">BEST</span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 font-medium">NEW</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600">{product.description}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-6">
                <div className="flex items-center gap-2">
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}원
                    </span>
                  )}
                  {product.discountPercent && product.discountPercent > 0 && (
                    <span className="text-lg text-red-500 font-bold">
                      {product.discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900" data-testid="price-product-detail">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-lg text-gray-500">원</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">무료 배송</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm">수량</span>
                <div className="flex items-center border border-gray-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50"
                    data-testid="button-quantity-minus"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-200 min-w-[50px] text-center" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50"
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

              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">무료배송</span>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">정품보증</span>
                </div>
                <div className="text-center">
                  <Award className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">품질인증</span>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">교환/반품</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-900 inline-block">
              상품 상세 정보
            </h2>
            
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
              <h3 className="font-bold text-gray-900 mb-4">배송 및 교환/반품 안내</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">배송 안내</h4>
                  <ul className="space-y-1">
                    <li>• 배송비: 전 상품 무료 배송</li>
                    <li>• 배송 기간: 결제 확인 후 1~3일 이내</li>
                    <li>• 배송사: CJ대한통운</li>
                    <li>• 도서/산간 지역 추가 배송비 발생</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">교환/반품 안내</h4>
                  <ul className="space-y-1">
                    <li>• 상품 수령 후 7일 이내 교환/반품 가능</li>
                    <li>• 단순 변심 시 왕복 배송비 고객 부담</li>
                    <li>• 제품 하자 시 무료 교환 및 반품</li>
                    <li>• 고객센터 문의: 1:1 채팅 상담</li>
                  </ul>
                </div>
              </div>
            </div>
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

      <Footer />
    </div>
  );
}
