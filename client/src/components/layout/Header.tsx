import { Search, ShoppingCart, Menu, LogOut, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: '홈 인테리어', path: '/products/home_interior' },
  { name: '뷰티', path: '/products/beauty' },
  { name: '가전/디지털', path: '/products/electronics' },
  { name: '생활용품', path: '/products/living' },
  { name: '헬스/건강식품', path: '/products/health' },
  { name: '럭셔리/명품', path: '/products/luxury' },
  { name: '유아/완구', path: '/products/baby' },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const name = localStorage.getItem("memberName");
      setMemberName(name);
    };
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    const interval = setInterval(checkLoginStatus, 1000);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    setMemberName(null);
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    setLocation("/");
  };

  return (
    <header className="w-full bg-white sticky top-0 z-50">
      <div className="container-custom py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center cursor-pointer flex-shrink-0">
          <img 
            src="/images/estella-logo.jpg"
            alt="Estella"
            className="h-8 sm:h-10 md:h-12 w-auto"
            data-testid="logo-estella"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path} 
              className={cn(
                "text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap",
                location === item.path && "text-gray-900 font-semibold"
              )}
              data-testid={`nav-${item.path.split('/').pop()}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="w-9 h-9" data-testid="button-search">
            <Search className="w-5 h-5 text-gray-700" />
          </Button>
          
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative w-9 h-9" data-testid="button-cart">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" data-testid="text-cart-count">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Button>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            {memberName ? (
              <>
                <Link href="/profile" className="hover:text-gray-900 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {memberName}님
                </Link>
                <span className="text-gray-300">|</span>
                <button onClick={handleLogout} className="hover:text-gray-900 flex items-center gap-1">
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-900" data-testid="link-login">로그인</Link>
                <span className="text-gray-300">|</span>
                <Link href="/signup" className="hover:text-gray-900" data-testid="link-signup">회원가입</Link>
              </>
            )}
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 touch-manipulation">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
                <div className="mt-8">
                  <Link href="/" className="block mb-6">
                    <img 
                      src="/images/estella-logo.jpg"
                      alt="Estella"
                      className="h-8 w-auto"
                    />
                  </Link>
                  
                  {memberName && (
                    <div className="pb-4 border-b mb-4">
                      <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {memberName}님
                      </div>
                    </div>
                  )}
                  
                  <nav className="flex flex-col gap-3">
                    {navItems.map((item) => (
                      <Link 
                        key={item.name} 
                        href={item.path} 
                        className="text-base font-medium text-gray-700 hover:text-gray-900 py-1"
                      >
                        {item.name}
                      </Link>
                    ))}
                    
                    <div className="border-t pt-4 mt-2 space-y-3">
                      {memberName ? (
                        <>
                          <Link href="/profile" className="block text-base font-medium text-gray-600">마이페이지</Link>
                          <button onClick={handleLogout} className="flex items-center gap-2 text-base font-medium text-gray-500">
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" className="block text-base font-medium text-gray-600">로그인</Link>
                          <Link href="/signup" className="block text-base font-medium text-gray-600">회원가입</Link>
                        </>
                      )}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
