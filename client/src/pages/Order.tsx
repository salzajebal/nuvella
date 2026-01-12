import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useDaumPostcodePopup } from "react-daum-postcode";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useKakaoLink } from "@/hooks/use-kakao-link";
import { useMemberInfo } from "@/hooks/useMemberInfo";
import { KakaoConfirmDialog } from "@/components/KakaoConfirmDialog";
import { CheckCircle, Package, User, MapPin, MessageCircle, Search, Clock, Plus, ChevronDown, ChevronUp, Wallet, AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
}

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}

export default function Order() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { kakaoLink, openKakaoChat, showConfirmDialog, confirmAndOpenKakao, closeConfirmDialog } = useKakaoLink();
  const openPostcode = useDaumPostcodePopup();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [recentAddresses, setRecentAddresses] = useState<SavedAddress[]>([]);
  const [showRecentAddresses, setShowRecentAddresses] = useState(false);
  const [addressMode, setAddressMode] = useState<"recent" | "new">("new");
  const { data: memberInfo, isLoggedIn, memberToken } = useMemberInfo();
  const memberPoints = memberInfo?.pointBalance || 0;
  
  const searchParams = new URLSearchParams(window.location.search);
  const quantityParam = parseInt(searchParams.get("quantity") || "1");
  const [quantity] = useState(quantityParam);

  const [formData, setFormData] = useState({
    memberName: "",
    memberEmail: "",
    memberPhone: "",
    memberZipcode: "",
    memberAddress: "",
    memberAddressDetail: "",
    shippingName: "",
    shippingPhone: "",
    shippingZipcode: "",
    shippingAddress: "",
    shippingAddressDetail: "",
    shippingMemo: "",
    sameAsOrderer: true,
  });

  const handleMemberAddressSearch = () => {
    openPostcode({
      onComplete: (data) => {
        let fullAddress = data.address;
        let extraAddress = "";
        
        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }
        
        setFormData(prev => ({
          ...prev,
          memberZipcode: data.zonecode,
          memberAddress: fullAddress,
        }));
      },
    });
  };

  const handleAddressSearch = () => {
    openPostcode({
      onComplete: (data) => {
        let fullAddress = data.address;
        let extraAddress = "";
        
        if (data.addressType === "R") {
          if (data.bname !== "") {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "") {
            extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }
        
        setFormData(prev => ({
          ...prev,
          shippingZipcode: data.zonecode,
          shippingAddress: fullAddress,
        }));
      },
    });
  };

  const handleSelectRecentAddress = (address: SavedAddress) => {
    setFormData(prev => ({
      ...prev,
      shippingName: address.name,
      shippingPhone: address.phone,
      shippingZipcode: address.zipcode,
      shippingAddress: address.address,
      shippingAddressDetail: address.addressDetail,
      sameAsOrderer: false,
    }));
    setShowRecentAddresses(false);
    setAddressMode("recent");
  };

  useEffect(() => {
    const memberName = localStorage.getItem("memberName") || "";
    const memberEmail = localStorage.getItem("memberEmail") || "";
    const storedToken = localStorage.getItem("memberToken");
    
    setFormData(prev => ({
      ...prev,
      memberName,
      memberEmail,
      shippingName: memberName,
    }));
    
    const fetchRecentAddresses = async () => {
      if (!storedToken) return;
      
      try {
        const addressRes = await fetch("/api/members/recent-addresses", {
          headers: {
            "Authorization": `Bearer ${storedToken}`,
          },
        });
        if (addressRes.ok) {
          const data = await addressRes.json();
          if (data.success && data.data) {
            setRecentAddresses(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching recent addresses:", error);
      }
    };
    
    fetchRecentAddresses();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSameAsOrderer = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsOrderer: checked,
      shippingName: checked ? prev.memberName : prev.shippingName,
      shippingPhone: checked ? prev.memberPhone : prev.shippingPhone,
      shippingZipcode: checked ? prev.memberZipcode : prev.shippingZipcode,
      shippingAddress: checked ? prev.memberAddress : prev.shippingAddress,
      shippingAddressDetail: checked ? prev.memberAddressDetail : prev.shippingAddressDetail,
    }));
  };

  useEffect(() => {
    if (formData.sameAsOrderer) {
      setFormData(prev => ({
        ...prev,
        shippingName: prev.memberName,
        shippingPhone: prev.memberPhone,
        shippingZipcode: prev.memberZipcode,
        shippingAddress: prev.memberAddress,
        shippingAddressDetail: prev.memberAddressDetail,
      }));
    }
  }, [formData.memberName, formData.memberPhone, formData.memberZipcode, formData.memberAddress, formData.memberAddressDetail, formData.sameAsOrderer]);

  const calculateTotal = () => {
    if (!product) return "0";
    const priceStr = String(product.price || '0');
    const price = parseInt(priceStr.replace(/,/g, ""));
    return (price * quantity).toLocaleString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    if (!formData.memberName || !formData.memberPhone) {
      toast({
        title: "입력 오류",
        description: "주문자 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.shippingName || !formData.shippingPhone || !formData.shippingAddress) {
      toast({
        title: "입력 오류",
        description: "배송지 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const memberId = localStorage.getItem("memberId");
      const memberToken = localStorage.getItem("memberToken");
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(memberToken ? { "Authorization": `Bearer ${memberToken}` } : {}),
        },
        body: JSON.stringify({
          memberId: memberId || null,
          memberName: formData.memberName,
          memberPhone: formData.memberPhone,
          memberZipcode: formData.memberZipcode,
          memberAddress: formData.memberAddress,
          memberAddressDetail: formData.memberAddressDetail,
          shippingName: formData.shippingName,
          shippingPhone: formData.shippingPhone,
          shippingZipcode: formData.shippingZipcode,
          shippingAddress: formData.shippingAddress,
          shippingAddressDetail: formData.shippingAddressDetail,
          shippingMemo: formData.shippingMemo,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity,
          totalAmount: calculateTotal(),
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrderNumber(data.data.orderNumber);
        setOrderComplete(true);
      } else {
        throw new Error(data.error || "주문 처리 중 오류가 발생했습니다.");
      }
    } catch (error: any) {
      toast({
        title: "주문 오류",
        description: error.message || "주문 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
            <Button onClick={() => setLocation("/products")}>상품 목록으로 돌아가기</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                주문이 완료되었습니다
              </h1>
              
              <p className="text-gray-600 mb-8">
                소중한 후기를 남겨주세요!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                <Button
                  onClick={() => setLocation(`/products/${product.id}`)}
                  className="sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 text-lg"
                  data-testid="link-write-review"
                >
                  리뷰 후기 쓰러가기
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="sm:w-auto"
                >
                  홈으로 돌아가기
                </Button>
                <Button
                  onClick={() => setLocation("/profile")}
                  className="sm:w-auto"
                >
                  주문 내역 확인
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <KakaoConfirmDialog 
        open={showConfirmDialog} 
        onConfirm={confirmAndOpenKakao} 
        onCancel={closeConfirmDialog} 
      />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 py-6 sm:py-10">
          <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            주문서 작성
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                주문 상품
              </h2>
              
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-gray-50 rounded-lg border overflow-hidden shrink-0">
                  <img
                    src={product.imageUrl || "/images/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.weight} / {product.purity}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">수량: {quantity}개</span>
                    <span className="font-bold text-primary text-lg">{calculateTotal()}원</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                주문하시는 분
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="memberName">이름 *</Label>
                  <Input
                    id="memberName"
                    name="memberName"
                    value={formData.memberName}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    required
                    data-testid="input-member-name"
                  />
                </div>
                <div>
                  <Label htmlFor="memberPhone">연락처 *</Label>
                  <Input
                    id="memberPhone"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    required
                    data-testid="input-member-phone"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="memberZipcode">우편번호</Label>
                  <div className="flex gap-2">
                    <Input
                      id="memberZipcode"
                      name="memberZipcode"
                      value={formData.memberZipcode}
                      onChange={handleInputChange}
                      placeholder="우편번호"
                      readOnly
                      className="flex-1 bg-gray-50"
                      data-testid="input-member-zipcode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMemberAddressSearch}
                      className="flex items-center gap-2 whitespace-nowrap"
                      data-testid="button-member-address-search"
                    >
                      <MapPin className="w-4 h-4" />
                      주소 찾기
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="memberAddress">주소</Label>
                  <Input
                    id="memberAddress"
                    name="memberAddress"
                    value={formData.memberAddress}
                    onChange={handleInputChange}
                    placeholder="주소"
                    readOnly
                    className="bg-gray-50"
                    data-testid="input-member-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="memberAddressDetail">상세주소</Label>
                  <Input
                    id="memberAddressDetail"
                    name="memberAddressDetail"
                    value={formData.memberAddressDetail}
                    onChange={handleInputChange}
                    placeholder="상세주소 입력"
                    data-testid="input-member-address-detail"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                받으시는 분
              </h2>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant={formData.sameAsOrderer ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSameAsOrderer(true)}
                  className="flex items-center gap-2"
                  data-testid="button-same-as-orderer"
                >
                  <User className="w-4 h-4" />
                  주문자와 동일
                </Button>
                {recentAddresses.length > 0 && (
                  <Button
                    type="button"
                    variant={showRecentAddresses ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowRecentAddresses(!showRecentAddresses);
                      if (!showRecentAddresses) {
                        setFormData(prev => ({ ...prev, sameAsOrderer: false }));
                      }
                    }}
                    className="flex items-center gap-2"
                    data-testid="button-toggle-recent-addresses"
                  >
                    <Clock className="w-4 h-4" />
                    최근 배송지
                    {showRecentAddresses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  type="button"
                  variant={addressMode === "new" && !showRecentAddresses && !formData.sameAsOrderer ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowRecentAddresses(false);
                    setAddressMode("new");
                    setFormData(prev => ({
                      ...prev,
                      sameAsOrderer: false,
                      shippingName: "",
                      shippingPhone: "",
                      shippingZipcode: "",
                      shippingAddress: "",
                      shippingAddressDetail: "",
                    }));
                  }}
                  className="flex items-center gap-2"
                  data-testid="button-new-address"
                >
                  <Plus className="w-4 h-4" />
                  신규 배송지
                </Button>
              </div>

              {recentAddresses.length > 0 && showRecentAddresses && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">최근 배송지 선택</p>
                  {recentAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectRecentAddress(addr)}
                      className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-primary hover:bg-amber-50 transition-colors"
                      data-testid={`button-select-address-${addr.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{addr.name}</div>
                          <div className="text-sm text-gray-600">{addr.phone}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            [{addr.zipcode}] {addr.address} {addr.addressDetail}
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shippingName">받는 분 *</Label>
                  <Input
                    id="shippingName"
                    name="shippingName"
                    value={formData.shippingName}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    required
                    data-testid="input-shipping-name"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingPhone">연락처 *</Label>
                  <Input
                    id="shippingPhone"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    required
                    data-testid="input-shipping-phone"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingZipcode">우편번호 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="shippingZipcode"
                      name="shippingZipcode"
                      value={formData.shippingZipcode}
                      onChange={handleInputChange}
                      placeholder="우편번호"
                      readOnly
                      className="flex-1 bg-gray-50"
                      data-testid="input-shipping-zipcode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddressSearch}
                      className="flex items-center gap-2 whitespace-nowrap"
                      data-testid="button-address-search"
                    >
                      <Search className="w-4 h-4" />
                      주소 검색
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingAddress">주소 *</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="주소 검색 버튼을 클릭하세요"
                    required
                    readOnly
                    className="bg-gray-50"
                    data-testid="input-shipping-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingAddressDetail">상세주소</Label>
                  <Input
                    id="shippingAddressDetail"
                    name="shippingAddressDetail"
                    value={formData.shippingAddressDetail}
                    onChange={handleInputChange}
                    placeholder="동/호수, 건물명 등 상세주소 입력"
                    data-testid="input-shipping-address-detail"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingMemo">배송 메모</Label>
                  <Textarea
                    id="shippingMemo"
                    name="shippingMemo"
                    value={formData.shippingMemo}
                    onChange={handleInputChange}
                    placeholder="배송 시 요청사항을 입력해주세요"
                    rows={3}
                    data-testid="input-shipping-memo"
                  />
                </div>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  로그인 필요
                </h3>
                <p className="text-red-800 text-sm">
                  포인트 결제를 위해 로그인이 필요합니다. 로그인 후 주문해주세요.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-go-login"
                >
                  로그인하기
                </Button>
              </div>
            )}

            {isLoggedIn && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  포인트 결제
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">보유 포인트</span>
                    <span className="font-bold text-lg">{memberPoints.toLocaleString()}원</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">결제 금액</span>
                    <span className="font-bold text-lg text-primary">-{calculateTotal()}원</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">결제 후 잔액</span>
                      <span className={`font-bold text-lg ${memberPoints >= parseInt(calculateTotal().replace(/,/g, "")) ? "text-green-600" : "text-red-600"}`}>
                        {(memberPoints - parseInt(calculateTotal().replace(/,/g, ""))).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  
                  {memberPoints < parseInt(calculateTotal().replace(/,/g, "")) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>포인트가 부족합니다. 충전 후 결제해주세요.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>총 결제금액</span>
                <span className="text-primary text-2xl">{calculateTotal()}원</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !isLoggedIn || memberPoints < parseInt(calculateTotal().replace(/,/g, ""))}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-submit-order"
            >
              {submitting ? "결제 처리 중..." : `포인트로 결제하기 (${calculateTotal()}원)`}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
}
