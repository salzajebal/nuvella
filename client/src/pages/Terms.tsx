import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Terms() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const agreeAll = agreeTerms && agreePrivacy;

  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
  };

  const handleProceed = () => {
    if (!agreeTerms || !agreePrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "모든 약관에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }
    setLocation("/signup?agreed=true");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <main className="container-custom py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">약관동의</h1>
            <div className="text-sm text-gray-500">
              <span>Home</span> / <span>회원가입</span> / <span className="text-gray-900">약관동의</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 mb-4">
            <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
              <h2 className="font-bold text-gray-800">회원가입약관</h2>
            </div>
            <div className="p-5">
              <div className="h-48 overflow-y-auto text-sm text-gray-600 bg-white border border-gray-100 p-4 mb-4">
                <p className="font-medium mb-2">제 1 장 : 총칙</p>
                <p className="font-medium mb-2">제 2 장 : 서비스 이용계약</p>
                <p className="font-medium mb-2">제 3 장 : 계약당사자의 의무</p>
                <p className="font-medium mb-2">제 4 장 : 서비스 이용</p>
                <p className="font-medium mb-2">제 5 장 : 계약해지 및 이용제한</p>
                <p className="font-medium mb-4">제 6 장 : 기타</p>
                
                <p className="font-medium mb-2">제1장 총 칙</p>
                <p className="font-medium mb-2">제1조(목적)</p>
                <p className="mb-4">이 약관은 본 사이트(이하 "회사"라 한다)에서 제공하는 모든 서비스(이하 "서비스"라 한다)의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
                
                <p className="font-medium mb-2">제2조(정의)</p>
                <p className="mb-4">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <p className="mb-2">1. "회원"이라 함은 본 약관에 동의하고, 서비스 이용 자격을 부여받은 자를 말합니다.</p>
                <p className="mb-2">2. "아이디(ID)"라 함은 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인하는 문자와 숫자의 조합을 말합니다.</p>
                <p className="mb-4">3. "비밀번호"라 함은 회원이 부여받은 아이디와 일치되는 회원임을 확인하고 회원의 권익보호를 위해 회원 자신이 설정한 문자와 숫자의 조합을 말합니다.</p>
                
                <p className="font-medium mb-2">제3조(약관의 효력과 변경)</p>
                <p className="mb-2">1. 이 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</p>
                <p className="mb-2">2. 이 약관의 내용은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력을 발생합니다.</p>
                <p className="mb-4">3. 회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 제2항과 같은 방법으로 공지함으로써 효력을 발생합니다.</p>
              </div>
              <div className="flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-gray-300 rounded"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">회원가입약관의 내용에 동의합니다.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 mb-4">
            <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
              <h2 className="font-bold text-gray-800">개인정보처리방침안내</h2>
            </div>
            <div className="p-5">
              <div className="h-48 overflow-y-auto text-sm text-gray-600 bg-white border border-gray-100 p-4 mb-4">
                <p className="mb-4">본 사이트(이하 "회사"라 한다)는 고객님의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호"에 관한 법률을 준수하고 있습니다.</p>
                
                <p className="mb-4">회사는 개인정보취급방침을 통하여 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.</p>
                
                <p className="mb-4">회사는 개인정보취급방침을 개정하는 경우 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.</p>
                
                <p className="font-medium mb-2">■ 수집하는 개인정보 항목</p>
                <p className="mb-4">회사는 회원가입, 상담, 서비스 신청 등등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                <p className="mb-4">○ 수집항목 : 이름 , 생년월일 , 성별 , 로그인ID , 비밀번호 , 비밀번호 질문과 답변 , 이메일 , 서비스 이용기록 , 접속 로그 , 쿠키 , 접속 IP 정보 , 결제기록</p>
                
                <p className="font-medium mb-2">■ 개인정보의 수집 및 이용목적</p>
                <p className="mb-2">회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                <p className="mb-2">- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산</p>
                <p className="mb-2">- 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지</p>
                <p className="mb-4">- 마케팅 및 광고에 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</p>
                
                <p className="font-medium mb-2">■ 개인정보의 보유 및 이용기간</p>
                <p className="mb-4">회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
              </div>
              <div className="flex justify-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-gray-300 rounded"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">개인정보처리방침안내의 내용에 동의합니다.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 mb-6">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary border-gray-300 rounded"
                checked={agreeAll}
                onChange={(e) => handleAgreeAll(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">전체 약관에 동의합니다.</span>
            </label>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleProceed}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-none"
              data-testid="button-proceed-signup"
            >
              <Check className="w-4 h-4 mr-2" />
              회원가입
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
