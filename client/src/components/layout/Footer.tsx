import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 border-t border-gray-300">
      <div className="border-b border-gray-300">
        <div className="container-custom px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">서비스이용약관</a>
              <a href="#" className="hover:text-gray-900 transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-gray-900 transition-colors">이메일무단수집거부</a>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/support" className="hover:text-gray-900 transition-colors">FAQ</Link>
              <Link href="/support" className="hover:text-gray-900 transition-colors">1:1문의</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-custom px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <div className="mb-4">
              <span 
                className="text-lg sm:text-xl font-bold text-gray-800"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                NUVELLA
              </span>
            </div>
            <div className="text-xs sm:text-sm space-y-1 text-gray-600">
              <p><span className="text-gray-500">누벨라</span> | 대표 : 박도이</p>
              <p>사업자등록번호 : 387-36-01448 | 업태 : 도매 및 소매업 | 종목 : 전자상거래업</p>
              <p>통신판매업 : 2025-안양만안-1400 | 관할세무서 : 안양세무서</p>
              <p>주소 : 경기도 안양시 만안구 병목안로 2, 1103호 A482</p>
              <p>E-mail : support@nuvella.com</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-4">사이트 이용문의</h3>
            <div className="text-xs sm:text-sm space-y-1 text-gray-600 mb-4">
              <p>상담시간 : 평일 09:00 ~ 18:00 토요일 09:00 ~ 12:00</p>
              <p>휴일안내 : 일요일 및 공휴일은 휴무</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-200 py-3">
        <div className="container-custom px-4">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center">
            Copyright © 2025 Nuvella. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
