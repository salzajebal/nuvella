import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { User, Lock, Mail, Smile, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("agreed") !== "true") {
      setLocation("/terms");
    }
  }, [searchString, setLocation]);
  const [loading, setLoading] = useState(false);
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    email: "",
  });

  const checkUsername = async () => {
    if (!formData.username || formData.username.length < 4) {
      toast({ title: "오류", description: "아이디는 4자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/members/check-username?username=${formData.username}`);
      const data = await res.json();
      if (data.available) {
        setUsernameChecked(true);
        toast({ title: "확인 완료", description: "사용 가능한 아이디입니다." });
      } else {
        toast({ title: "사용 불가", description: "이미 사용 중인 아이디입니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "중복 확인에 실패했습니다.", variant: "destructive" });
    }
  };

  const checkNickname = async () => {
    if (!formData.nickname || formData.nickname.length < 2) {
      toast({ title: "오류", description: "닉네임은 2자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/members/check-nickname?nickname=${formData.nickname}`);
      const data = await res.json();
      if (data.available) {
        setNicknameChecked(true);
        toast({ title: "확인 완료", description: "사용 가능한 닉네임입니다." });
      } else {
        toast({ title: "사용 불가", description: "이미 사용 중인 닉네임입니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "중복 확인에 실패했습니다.", variant: "destructive" });
    }
  };

  const checkEmail = async () => {
    if (!formData.email) {
      setEmailChecked(true);
      return;
    }
    try {
      const res = await fetch(`/api/members/check-email?email=${formData.email}`);
      const data = await res.json();
      if (data.available) {
        setEmailChecked(true);
        toast({ title: "확인 완료", description: "사용 가능한 이메일입니다." });
      } else {
        toast({ title: "사용 불가", description: "이미 사용 중인 이메일입니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "중복 확인에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameChecked) {
      toast({ title: "중복 확인 필요", description: "아이디 중복체크를 해주세요.", variant: "destructive" });
      return;
    }

    if (!nicknameChecked) {
      toast({ title: "중복 확인 필요", description: "닉네임 중복체크를 해주세요.", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast({ title: "비밀번호 불일치", description: "비밀번호와 비밀번호 확인이 일치하지 않습니다.", variant: "destructive" });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: "비밀번호 오류", description: "비밀번호는 8자 이상이어야 합니다.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname,
          email: formData.email || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "회원가입 완료", description: "회원가입이 완료되었습니다. 로그인해주세요." });
        setLocation("/login");
      } else {
        toast({ title: "회원가입 실패", description: data.error || "회원가입 처리 중 오류가 발생했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "회원가입 처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <main className="container-custom py-8 sm:py-16 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-sm sm:text-base text-gray-500">에클라샵 회원이 되어 다양한 혜택을 누리세요</p>
          </div>

          <div className="bg-white shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit}>
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h2 className="font-bold text-gray-800">사이트 이용정보 입력</h2>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">아이디 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="아이디를 입력해주세요"
                        className="pl-10 h-11 rounded-none"
                        value={formData.username}
                        onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setUsernameChecked(false); }}
                        data-testid="input-username"
                        required
                      />
                    </div>
                    <Button type="button" variant="outline" className="h-11 px-4 rounded-none" onClick={checkUsername}>
                      <Check className="w-4 h-4 mr-1" />중복체크
                    </Button>
                  </div>
                  <p className="text-xs text-red-500 mt-1">Note: 아이디 입력 후 <span className="font-bold">중복체크 필수</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="비밀번호"
                        className="pl-10 h-11 rounded-none"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        data-testid="input-password"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="비밀번호 확인"
                        className="pl-10 h-11 rounded-none"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                        data-testid="input-password-confirm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h2 className="font-bold text-gray-800">개인정보 입력</h2>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름 <span className="text-red-500">*</span></label>
                  <div className="relative max-w-md">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="이름"
                      className="pl-10 h-11 rounded-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">닉네임 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 max-w-md">
                    <div className="relative flex-1">
                      <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="닉네임"
                        className="pl-10 h-11 rounded-none"
                        value={formData.nickname}
                        onChange={(e) => { setFormData({ ...formData, nickname: e.target.value }); setNicknameChecked(false); }}
                        data-testid="input-nickname"
                        required
                      />
                    </div>
                    <Button type="button" variant="outline" className="h-11 px-4 rounded-none" onClick={checkNickname}>
                      <Check className="w-4 h-4 mr-1" />중복체크
                    </Button>
                  </div>
                  <p className="text-xs text-red-500 mt-1">Note: 닉네임 입력 후 <span className="font-bold">중복체크 필수</span></p>
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <p className="text-xs text-red-600 font-medium">Note: 공백없이 한글,영문,숫자만 입력 가능 (한글2자, 영문4자 이상) | 닉네임을 바꾸시면 앞으로 60일 이내에는 변경 할 수 없습니다.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <div className="flex gap-2 max-w-md">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="이메일 (선택사항)"
                        className="pl-10 h-11 rounded-none"
                        value={formData.email}
                        onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setEmailChecked(false); }}
                        data-testid="input-email"
                      />
                    </div>
                    <Button type="button" variant="outline" className="h-11 px-4 rounded-none" onClick={checkEmail}>
                      <Check className="w-4 h-4 mr-1" />중복체크
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Note: 이메일 입력 후 중복체크 필수 (미입력시 생략 가능)</p>
                </div>
              </div>

              <div className="p-6">
                <Button 
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-none text-base font-bold"
                  disabled={loading}
                  data-testid="button-signup"
                >
                  {loading ? "가입 중..." : "회원가입"}
                </Button>
              </div>
            </form>

            <div className="py-4 text-center border-t border-gray-100">
              <span className="text-gray-500">이미 회원이신가요?</span>{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
