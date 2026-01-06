import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MessageCircle, CheckCircle, Clock, XCircle, ExternalLink, Wallet, Banknote, AlertCircle, ArrowUpCircle, ArrowDownCircle, Gift, History, Plus, Minus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DepositRequest {
  id: string;
  amount: number;
  depositorName: string;
  status: string;
  requestedAt: string;
  adminNote?: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  requestedAt: string;
  adminNote?: string;
}

interface PointTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal" | "history">("deposit");
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [depositFormData, setDepositFormData] = useState({
    amount: "",
    depositorName: "",
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  const memberToken = localStorage.getItem("memberToken");
  const memberName = localStorage.getItem("memberName");
  const memberEmail = localStorage.getItem("memberEmail");
  const memberId = localStorage.getItem("memberId");

  useEffect(() => {
    if (!memberToken) {
      toast({
        title: "로그인 필요",
        description: "포인트 관리를 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [memberToken, setLocation, toast]);

  const { data: kakaoTalkLink } = useQuery<string>({
    queryKey: ["/api/settings/kakaoTalkLink"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/kakaoTalkLink");
        if (!res.ok) return "";
        const result = await res.json();
        return result.data?.value || "";
      } catch {
        return "";
      }
    },
    enabled: !!memberToken,
  });

  const { data: depositRequests = [], isLoading: isLoadingDeposits } = useQuery<DepositRequest[]>({
    queryKey: ["/api/members/deposit-requests"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/deposit-requests", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!memberToken,
  });

  const { data: withdrawalRequests = [], isLoading: isLoadingWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/members/withdrawal-requests"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/withdrawal-requests", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!memberToken,
  });

  const { data: pointBalance = 0 } = useQuery<number>({
    queryKey: ["/api/members/me", "pointBalance"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/me", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return 0;
        const result = await res.json();
        return result.data?.pointBalance || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!memberToken,
    refetchInterval: 5000,
  });

  const { data: pointTransactions = [] } = useQuery<PointTransaction[]>({
    queryKey: ["/api/members/point-transactions"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/point-transactions", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!memberToken,
  });

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !memberName || !memberEmail) {
      toast({
        title: "오류",
        description: "로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(depositFormData.amount);
    if (isNaN(amount) || amount < 10000) {
      toast({
        title: "금액 오류",
        description: "최소 10,000원 이상 입금 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setDepositLoading(true);
    try {
      const res = await fetch("/api/members/deposit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          amount,
          bankName: "카카오톡문의",
          accountNumber: "카카오톡문의",
          depositorName: depositFormData.depositorName,
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "입금신청이 완료되었습니다. 입금 확인 후 포인트가 충전됩니다.",
        });
        setDepositFormData({ amount: "", depositorName: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/members/deposit-requests"] });
      } else {
        const data = await res.json();
        throw new Error(data.error || "신청 실패");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "입금신청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !memberName || !memberEmail) {
      toast({
        title: "오류",
        description: "로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseInt(withdrawalAmount);
    if (isNaN(amountValue) || amountValue < 10000) {
      toast({
        title: "금액 오류",
        description: "최소 10,000원 이상 출금 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    if (amountValue > pointBalance) {
      toast({
        title: "잔액 부족",
        description: "보유 포인트보다 많은 금액은 출금할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setWithdrawalLoading(true);
    try {
      const res = await fetch("/api/members/withdrawal-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          amount: amountValue,
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "출금신청이 완료되었습니다. 관리자 승인 후 처리됩니다.",
        });
        setWithdrawalAmount("");
        queryClient.invalidateQueries({ queryKey: ["/api/members/withdrawal-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      } else {
        const data = await res.json();
        throw new Error(data.error || "신청 실패");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "출금신청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            승인
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            거절
          </span>
        );
      default:
        return null;
    }
  };

  if (!memberToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 py-6 md:py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900">포인트 관리</h1>

          <div className="mb-6 md:mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-6 shadow-lg text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Wallet className="w-8 h-8 text-white" />
                <span className="text-white text-lg font-medium">내 보유 포인트</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white" data-testid="deposit-page-point-balance">
                {pointBalance.toLocaleString()}P
              </div>
              <p className="text-amber-100 text-sm mt-2">충전 및 환급이 가능한 포인트입니다</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "deposit" | "withdrawal" | "history")} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="deposit" className="flex items-center gap-2 text-base" data-testid="tab-deposit">
                <ArrowDownCircle className="w-4 h-4" />
                포인트 충전
              </TabsTrigger>
              <TabsTrigger value="withdrawal" className="flex items-center gap-2 text-base" data-testid="tab-withdrawal">
                <ArrowUpCircle className="w-4 h-4" />
                포인트 환급
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 text-base" data-testid="tab-history">
                <Gift className="w-4 h-4" />
                지급 내역
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <Card className="shadow-lg border-yellow-300">
                  <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      고객센터 안내
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      상세안내는 카카오톡 고객센터로 연락바랍니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center space-y-6">
                      <div className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                        <p className="text-lg font-medium text-gray-800 mb-4">
                          입금 관련 상세 안내는<br />
                          <span className="text-xl font-bold text-yellow-700">카카오톡 고객센터</span>로<br />
                          연락 바랍니다.
                        </p>
                        
                        {kakaoTalkLink ? (
                          <a
                            href={kakaoTalkLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block transition-transform hover:scale-105"
                            data-testid="link-kakao-customer-service"
                          >
                            <div className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl shadow-lg flex items-center gap-3 transition-colors">
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.54-.8 2.87-.83 3.1 0 0-.02.13.07.18.09.05.19.02.19.02.25-.04 2.9-1.9 4.1-2.67.65.1 1.31.17 2 .17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
                              </svg>
                              <span className="text-lg">카카오톡 상담하기</span>
                              <ExternalLink className="w-5 h-5" />
                            </div>
                          </a>
                        ) : (
                          <div className="bg-gray-100 text-gray-500 py-4 px-8 rounded-xl">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">카카오톡 링크가 설정되지 않았습니다.</p>
                            <p className="text-xs mt-1">관리자에게 문의해주세요.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>영업시간: 평일 09:00 ~ 18:00</p>
                        <p>점심시간: 12:00 ~ 13:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-gray-200">
                  <CardHeader>
                    <CardTitle>포인트충전 신청서</CardTitle>
                    <CardDescription>
                      카카오톡 상담 후 아래 양식을 작성해주세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!kakaoTalkLink ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">카카오톡 고객센터가 설정되지 않았습니다.</p>
                        <p className="text-sm mt-2">관리자에게 문의해주세요.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleDepositSubmit} className="space-y-5">
                        <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                          <p className="font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            카카오톡 상담을 먼저 진행해주세요
                          </p>
                          <p className="mt-1 text-yellow-700">입금 계좌 및 상세 안내를 받으신 후 신청서를 작성해주세요.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="amount" className="text-gray-700 font-medium">입금 금액</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="최소 10,000원"
                            value={depositFormData.amount}
                            onChange={(e) => setDepositFormData({ ...depositFormData, amount: e.target.value })}
                            required
                            min="10000"
                            step="1000"
                            className="h-11"
                            data-testid="input-deposit-amount"
                          />
                          {depositFormData.amount && (
                            <p className="text-sm text-amber-600">
                              {parseInt(depositFormData.amount).toLocaleString()}원
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="depositorName" className="text-gray-700 font-medium">입금자명</Label>
                          <Input
                            id="depositorName"
                            type="text"
                            placeholder="실제 입금하신 분의 성함"
                            value={depositFormData.depositorName}
                            onChange={(e) => setDepositFormData({ ...depositFormData, depositorName: e.target.value })}
                            required
                            className="h-11"
                            data-testid="input-depositor-name"
                          />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <p className="font-medium mb-2">입금 전 확인사항</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>카카오톡에서 안내받은 계좌로 입금해주세요.</li>
                            <li>입금자명과 신청서의 이름이 일치해야 합니다.</li>
                            <li>입금 확인까지 영업일 기준 1-2일 소요됩니다.</li>
                          </ul>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                          disabled={depositLoading}
                          data-testid="button-submit-deposit"
                        >
                          {depositLoading ? "신청 중..." : "입금신청 하기"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-8 shadow-lg">
                <CardHeader>
                  <CardTitle>나의 입금신청 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {depositRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      입금신청 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {depositRequests.map((request) => (
                        <div 
                          key={request.id} 
                          className={`p-4 border rounded-lg ${
                            request.status === "pending"
                              ? "border-yellow-200 bg-yellow-50"
                              : request.status === "approved"
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {request.amount.toLocaleString()}원
                              </div>
                              <div className="text-sm text-gray-600">
                                입금자: {request.depositorName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(request.requestedAt).toLocaleString("ko-KR")}
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(request.status)}
                              {request.adminNote && (
                                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                                  {request.adminNote}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdrawal">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <Card className="shadow-lg border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5" />
                      환급 안내
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      환급 신청 전 확인사항
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          환급 유의사항
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                          <li>최소 환급 금액은 <span className="font-bold">10,000원</span>입니다.</li>
                          <li>환급 신청 후 관리자 승인이 필요합니다.</li>
                          <li>승인 후 처리됩니다.</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <h4 className="font-medium text-amber-800 mb-2">환급 처리 안내</h4>
                        <p className="text-sm text-amber-700">
                          환급 신청 후 관리자 승인이 완료되면 처리됩니다.
                          승인 여부는 아래 '환급 신청 내역'에서 확인하실 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Banknote className="w-5 h-5" />
                      포인트환급 신청서
                    </CardTitle>
                    <CardDescription>
                      환급할 금액을 입력해주세요
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="withdrawalAmount" className="text-gray-700 font-medium">환급 금액</Label>
                        <Input
                          id="withdrawalAmount"
                          type="number"
                          placeholder="최소 10,000원"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          required
                          min="10000"
                          max={pointBalance}
                          step="1000"
                          className="h-11 text-lg"
                          data-testid="input-withdrawal-amount"
                        />
                        {withdrawalAmount && (
                          <p className="text-sm text-amber-600">
                            {parseInt(withdrawalAmount).toLocaleString()}원
                            {parseInt(withdrawalAmount) > pointBalance && (
                              <span className="text-red-500 ml-2">(잔액 초과)</span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                        <p className="font-medium mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          환급 안내
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>환급 신청 후 관리자 승인 후 처리됩니다.</li>
                          <li>승인 여부는 아래 내역에서 확인하실 수 있습니다.</li>
                        </ul>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                        disabled={withdrawalLoading || pointBalance < 10000}
                        data-testid="button-submit-withdrawal"
                      >
                        {withdrawalLoading ? "신청 중..." : pointBalance < 10000 ? "잔액 부족" : "환급신청 하기"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-8 shadow-lg">
                <CardHeader>
                  <CardTitle>나의 환급 신청 내역</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawalRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      환급 신청 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {withdrawalRequests.map((request) => (
                        <div 
                          key={request.id} 
                          className={`p-4 border rounded-lg ${
                            request.status === "pending"
                              ? "border-yellow-200 bg-yellow-50"
                              : request.status === "approved"
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {request.amount.toLocaleString()}원
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(request.requestedAt).toLocaleString("ko-KR")}
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(request.status)}
                              {request.adminNote && (
                                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                                  {request.adminNote}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    포인트 지급 내역
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    이벤트 당첨금, 관리자 지급 등 포인트 변동 내역
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {pointTransactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">포인트 지급 내역이 없습니다.</p>
                      <p className="text-sm mt-2">이벤트 당첨금이나 관리자 지급 시 여기에 표시됩니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pointTransactions.map((transaction) => (
                        <div 
                          key={transaction.id} 
                          className={`p-4 border rounded-lg ${
                            transaction.amount > 0
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                transaction.amount > 0 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-red-100 text-red-600"
                              }`}>
                                {transaction.amount > 0 ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className={`text-lg font-bold ${
                                  transaction.amount > 0 ? "text-green-700" : "text-red-700"
                                }`}>
                                  {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()}P
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {transaction.description || (
                                    transaction.type === "admin_adjust" ? "관리자 조정" :
                                    transaction.type === "deposit" ? "포인트 충전" :
                                    transaction.type === "withdrawal" ? "포인트 환급" :
                                    transaction.type === "purchase" ? "상품 구매" :
                                    transaction.type
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(transaction.createdAt).toLocaleString("ko-KR")}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                잔액
                              </div>
                              <div className="text-base font-semibold text-gray-700">
                                {transaction.balanceAfter.toLocaleString()}P
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
