import { Search, ShoppingCart, Menu, LogOut, User, ChevronDown, ChevronRight, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/categories";

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setActiveCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleCategoryEnter = (categoryId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(categoryId);
    setIsDropdownOpen(true);
  };

  const handleCategoryLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
      setActiveCategory(null);
    }, 150);
  };

  const handleDropdownEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <header className="w-full bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="container-custom py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center cursor-pointer flex-shrink-0">
          <img 
            src="/images/lumia-logo.png"
            alt="Lumia"
            className="h-12 sm:h-14 md:h-16 w-auto"
            data-testid="logo-lumia"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" ref={dropdownRef}>
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleCategoryEnter(category.id)}
              onMouseLeave={handleCategoryLeave}
            >
              <Link 
                href={`/products/${category.id}`}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap",
                  location.startsWith(`/products/${category.id}`) && "text-gray-900 font-semibold bg-gray-50"
                )}
                data-testid={`nav-${category.id}`}
              >
                {category.name}
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  activeCategory === category.id && "rotate-180"
                )} />
              </Link>
              
              {isDropdownOpen && activeCategory === category.id && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleCategoryLeave}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <Link 
                      href={`/products/${category.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                      onClick={() => setIsDropdownOpen(false)}
                      data-testid={`dropdown-${category.id}-all`}
                    >
                      {category.name} 전체보기
                    </Link>
                  </div>
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/products/${category.id}?subcategory=${sub.id}`}
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setIsDropdownOpen(false)}
                      data-testid={`dropdown-${category.id}-${sub.id}`}
                    >
                      {sub.name}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9" 
            data-testid="button-search"
            onClick={() => setShowSearch(true)}
          >
            <Search className="w-5 h-5 text-gray-700" />
          </Button>
          
          {showSearch && (
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={() => setShowSearch(false)}>
              <div className="bg-white w-full py-4 px-4" onClick={(e) => e.stopPropagation()}>
                <div className="container-custom flex items-center gap-3">
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="상품명을 검색하세요"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-lg"
                        data-testid="input-search"
                      />
                    </div>
                    <Button type="submit" className="h-12 px-6" data-testid="button-search-submit">
                      검색
                    </Button>
                  </form>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowSearch(false)}
                    data-testid="button-search-close"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
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

          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 flex-nowrap">
            {memberName ? (
              <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                <Link href="/profile" className="hover:text-gray-900 flex items-center gap-1 whitespace-nowrap">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{memberName}님</span>
                </Link>
                <span className="text-gray-300 flex-shrink-0">|</span>
                <button onClick={handleLogout} className="hover:text-gray-900 flex items-center gap-1 whitespace-nowrap">
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2 flex-nowrap">
                <Link href="/login" className="hover:text-gray-900 whitespace-nowrap inline-block" data-testid="link-login">로그인</Link>
                <span className="text-gray-300 flex-shrink-0">|</span>
                <Link href="/terms" className="hover:text-gray-900 whitespace-nowrap inline-block" data-testid="link-signup">회원가입</Link>
              </div>
            )}
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 touch-manipulation">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto">
                <div className="mt-8">
                  <Link href="/" className="block mb-6">
                    <img 
                      src="/images/lumia-logo.png"
                      alt="Lumia"
                      className="h-12 w-auto"
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
                  
                  <nav className="flex flex-col gap-1">
                    {CATEGORIES.map((category) => (
                      <MobileCategoryItem key={category.id} category={category} />
                    ))}
                    
                    <div className="border-t pt-4 mt-4 space-y-3">
                      {memberName ? (
                        <>
                          <Link href="/profile" className="block text-base font-medium text-gray-600">마이페이지</Link>
                          <button onClick={handleLogout} className="flex items-center gap-2 text-base font-medium text-gray-500">
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-row items-center gap-3 flex-nowrap">
                          <Link href="/login" className="text-base font-medium text-gray-600 whitespace-nowrap inline-block">로그인</Link>
                          <span className="text-gray-300 flex-shrink-0">|</span>
                          <Link href="/terms" className="text-base font-medium text-gray-600 whitespace-nowrap inline-block">회원가입</Link>
                        </div>
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

function MobileCategoryItem({ category }: { category: typeof CATEGORIES[0] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <Link 
          href={`/products/${category.id}`}
          className="flex-1 text-base font-medium text-gray-700 hover:text-gray-900 py-3"
        >
          {category.name}
        </Link>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-500 hover:text-gray-700"
          data-testid={`mobile-expand-${category.id}`}
        >
          <ChevronDown className={cn(
            "w-5 h-5 transition-transform",
            isExpanded && "rotate-180"
          )} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="pl-4 pb-3 space-y-1">
          {category.subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/products/${category.id}?subcategory=${sub.id}`}
              className="block py-2 text-sm text-gray-600 hover:text-gray-900"
              data-testid={`mobile-${category.id}-${sub.id}`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
