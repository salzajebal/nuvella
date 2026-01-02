import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 sm:pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span 
                className="text-2xl text-white"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontWeight: 700 }}
              >
                Estella
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-md">
              에스텔라는 최고의 품질과 합리적인 가격으로 다양한 라이프스타일 제품을 제공합니다.
              홈 인테리어, 뷰티, 가전, 생활용품 등 다양한 카테고리의 엄선된 상품을 만나보세요.
            </p>
            <div className="text-xs space-y-1 text-gray-500">
              <p><span className="text-gray-400">상호:</span> 에스텔라 (Estella)</p>
              <p><span className="text-gray-400">대표:</span> 김지애</p>
              <p><span className="text-gray-400">사업자등록번호:</span> 504-19-23773</p>
              <p><span className="text-gray-400">사업자등록일:</span> 2017-02-03</p>
              <p><span className="text-gray-400">업태:</span> 도매 및 소매업</p>
              <p><span className="text-gray-400">종목:</span> 전자상거래업</p>
              <p><span className="text-gray-400">통신판매업번호:</span> 2017-대구북구-0090</p>
              <p><span className="text-gray-400">주소:</span> 대구광역시 북구 유통단지로 60, 1146호</p>
              <p><span className="text-gray-400">전화:</span> 053-323-3694</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm">카테고리</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/home_interior" className="hover:text-white transition-colors">홈 인테리어</Link></li>
              <li><Link href="/products/beauty" className="hover:text-white transition-colors">뷰티</Link></li>
              <li><Link href="/products/electronics" className="hover:text-white transition-colors">가전/디지털</Link></li>
              <li><Link href="/products/living" className="hover:text-white transition-colors">생활용품</Link></li>
              <li><Link href="/products/health" className="hover:text-white transition-colors">헬스/건강식품</Link></li>
              <li><Link href="/products/luxury" className="hover:text-white transition-colors">럭셔리/명품</Link></li>
              <li><Link href="/products/baby" className="hover:text-white transition-colors">유아/완구</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4 text-sm">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/support" className="hover:text-white transition-colors">고객센터</Link></li>
              <li><Link href="/notices" className="hover:text-white transition-colors">공지사항</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">상품후기</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p>Copyright © 2025 Estella. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-gray-600">SSL 보안</span>
            <span className="text-gray-600">안전결제</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
