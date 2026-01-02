import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, FileText, Bell } from "lucide-react";
import type { Faq } from "@shared/schema";
import { useKakaoLink } from "@/hooks/use-kakao-link";
import { KakaoConfirmDialog } from "@/components/KakaoConfirmDialog";

const FAQ_CATEGORIES = [
  { id: "order", name: "주문/배송" },
  { id: "buy", name: "매입안내" },
  { id: "price", name: "시세안내" },
  { id: "product", name: "상품문의" },
  { id: "refund", name: "반품/환불" },
  { id: "member", name: "회원/결제" },
];

const DEFAULT_FAQS = [
  { id: "1", category: "order", question: "온라인으로 주문이 가능한가요?", answer: "네, 온라인으로 24시간 주문 가능합니다. 결제 완료 후 1-2 영업일 내에 발송됩니다." },
  { id: "2", category: "order", question: "배송은 얼마나 걸리나요?", answer: "결제 확인 후 1-2 영업일 내에 발송되며, 배송은 보통 1-2일 소요됩니다. 전 상품 무료배송입니다." },
  { id: "5", category: "price", question: "할인가는 언제까지 적용되나요?", answer: "할인가는 프로모션 기간에 따라 달라집니다. 각 상품 상세페이지에서 할인 기간을 확인해주세요." },
  { id: "6", category: "price", question: "포인트 적립은 어떻게 되나요?", answer: "구매 금액의 1%가 포인트로 적립됩니다. 적립된 포인트는 다음 구매 시 사용 가능합니다." },
  { id: "7", category: "product", question: "상품 품질 보증이 있나요?", answer: "모든 상품은 정품 보증이 제공됩니다. 품질 문제 발생 시 7일 이내 교환/환불이 가능합니다." },
  { id: "8", category: "product", question: "선물 포장이 가능한가요?", answer: "네, 선물 포장 서비스를 제공하고 있습니다. 주문 시 요청사항에 기재해주세요." },
  { id: "9", category: "refund", question: "반품이 가능한가요?", answer: "상품 수령 후 7일 이내 교환/반품이 가능합니다. 단순 변심의 경우 왕복 배송비가 발생합니다." },
  { id: "10", category: "member", question: "회원가입 혜택이 있나요?", answer: "회원가입 시 구매 포인트 적립, 할인 쿠폰, 특별 프로모션 등의 혜택을 받으실 수 있습니다." },
];

export default function Support() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<typeof DEFAULT_FAQS>(DEFAULT_FAQS);
  const { openKakaoChat, showConfirmDialog, confirmAndOpenKakao, closeConfirmDialog } = useKakaoLink();

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faqs");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setFaqs(data.data);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <>
      <KakaoConfirmDialog 
        open={showConfirmDialog} 
        onConfirm={confirmAndOpenKakao} 
        onCancel={closeConfirmDialog} 
      />
      <div className="min-h-screen bg-white font-sans">
        <Header />
        
        <main className="container-custom py-12">
          <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-support-title">고객센터</h1>
          <p className="text-gray-500">Blue Black에 대해 궁금한 점을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer">
            <HelpCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">자주묻는질문</h3>
            <p className="text-sm text-gray-500">FAQ에서 빠르게 답변을 찾아보세요</p>
          </div>
          <button 
            onClick={openKakaoChat}
            className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer block w-full"
            data-testid="button-kakao-support"
          >
            <MessageCircle className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">카카오톡 문의</h3>
            <p className="text-sm text-gray-500">카카오톡으로 상담하세요</p>
          </button>
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer">
            <FileText className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">공지사항</h3>
            <p className="text-sm text-gray-500">최신 소식과 이벤트를 확인하세요</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer">
            <Bell className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">이용안내</h3>
            <p className="text-sm text-gray-500">거래 및 이용 방법을 안내합니다</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문 (FAQ)</h2>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              className={activeCategory === "all" ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              전체
            </Button>
            {FAQ_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id ? "bg-amber-500 hover:bg-amber-600" : ""}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                data-testid={`faq-item-${faq.id}`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-bold">Q</span>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="flex gap-3 pt-4">
                      <span className="text-blue-500 font-bold">A</span>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              해당 카테고리에 등록된 FAQ가 없습니다.
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      </div>
    </>
  );
}
