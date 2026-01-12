import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { 
  Plus, Pencil, Trash2, Check, X, RefreshCw, Database, 
  LogOut, Users, Package, BarChart3, Eye, EyeOff,
  Lock, User, Mail, Phone, CheckCircle, XCircle,
  Star, FileText, Bell, Calendar, Search,
  Wallet, Clock, Snowflake, Unlock, Settings, Link2, Upload,
  MessageCircle, Send, Circle, Volume2, Zap, Download, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Member, Review, Notice, ChatConversation, ChatMessage, Order } from "@shared/schema";
import { ShoppingCart } from "lucide-react";
import { useRef, useCallback } from "react";
import { AdminSearchPanel } from "@/components/admin/AdminSearchPanel";
import { PointSearchPanel } from "@/components/admin/PointSearchPanel";

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log("Audio notification not supported");
  }
};

const CATEGORY_OPTIONS = [
  { id: "home_interior", name: "홈 인테리어" },
  { id: "beauty", name: "뷰티" },
  { id: "electronics", name: "가전/디지털" },
  { id: "living", name: "생활용품" },
  { id: "health", name: "헬스/건강식품" },
  { id: "luxury", name: "럭셔리/명품" },
  { id: "kids", name: "유아/완구" },
];

interface AdminStats {
  totalProducts: number;
  totalMembers: number;
  totalCategories: number;
  productsByCategory: { id: string; name: string; count: number }[];
}

interface AdminDepositRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  bankName: string;
  accountNumber?: string;
  depositorName: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
}

interface AdminWithdrawalRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  birthdate?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "members" | "orders" | "deposits" | "withdrawals" | "points" | "reviews" | "notices" | "chat" | "settings" | "crawling">("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(0);
  const [memberSearchFilters, setMemberSearchFilters] = useState<{
    searchField: string;
    searchValue: string;
    isActive: boolean | null;
    isFrozen: boolean | null;
    dateFrom: string;
    dateTo: string;
  } | null>(null);
  const [depositPage, setDepositPage] = useState(0);
  const [withdrawalPage, setWithdrawalPage] = useState(0);
  const itemsPerPage = 10;
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoValue, setMemoValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [productFilter, setProductFilter] = useState("all");
  
  const [formData, setFormData] = useState({
    name: "",
    weight: "",
    purity: "",
    price: "",
    originalPrice: "",
    discountPercent: 0,
    category: "beauty",
    isBest: false,
    isNew: false,
    isHot: false,
    useFixedPrice: false,
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
  });

  const [memberFormData, setMemberFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
    memo: "",
    isActive: true,
    isAdmin: false,
  });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFormData, setReviewFormData] = useState({
    authorName: "",
    productName: "",
    rating: 5,
    title: "",
    content: "",
    imageUrl: "",
    isVisible: true,
    displayDate: new Date().toISOString().slice(0, 16),
  });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeFormData, setNoticeFormData] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
    isVisible: true,
    displayDate: new Date().toISOString().slice(0, 16),
    viewCount: 0,
  });
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [showAddNoticeForm, setShowAddNoticeForm] = useState(false);

  const [depositRequests, setDepositRequests] = useState<AdminDepositRequest[]>([]);
  const [depositFilter, setDepositFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [depositSearch, setDepositSearch] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const [withdrawalRequests, setWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [withdrawalAdminNote, setWithdrawalAdminNote] = useState("");
  
  const [pointMemberId, setPointMemberId] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");
  const [pointAction, setPointAction] = useState<"add" | "subtract">("add");
  const [pointMemberSearch, setPointMemberSearch] = useState("");
  const [pointMemberListSearch, setPointMemberListSearch] = useState("");
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [pointTransactions, setPointTransactions] = useState<{id: string; memberId: string; type: string; amount: number; balanceAfter: number; description: string | null; createdAt: string | null; memberName?: string; memberUsername?: string}[]>([]);
  const [pointSearch, setPointSearch] = useState("");
  const [pointPage, setPointPage] = useState(0);
  const [pointSearchFilters, setPointSearchFilters] = useState<{
    searchField: string;
    searchValue: string;
    type: string;
    dateFrom: string;
    dateTo: string;
  } | null>(null);

  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled">("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [orderEditData, setOrderEditData] = useState({
    memberName: "",
    memberEmail: "",
    memberPhone: "",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingAddressDetail: "",
    shippingZipcode: "",
    shippingMemo: "",
    adminNote: "",
  });

  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatNotification, setChatNotification] = useState<{show: boolean; memberName: string; message: string; conversationId: string} | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"adjust" | "freeze" | null>(null);
  
  const [siteSettings, setSiteSettings] = useState<{
    kakaoTalkLink: string;
  }>({ kakaoTalkLink: "https://open.kakao.com/o/samplelink" });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  const [depositAccountSettings, setDepositAccountSettings] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [depositAccountLoading, setDepositAccountLoading] = useState(false);

  const [reviewSettings, setReviewSettings] = useState({
    showOnHomepage: false,
    instantApproval: false,
  });
  const [reviewSettingsLoading, setReviewSettingsLoading] = useState(false);

  const [flashDeposit, setFlashDeposit] = useState(false);
  const [flashWithdrawal, setFlashWithdrawal] = useState(false);

  const [crawlingCategory, setCrawlingCategory] = useState<string | null>(null);
  const [crawlingProgress, setCrawlingProgress] = useState<{
    status: 'idle' | 'crawling' | 'importing' | 'completed' | 'error';
    currentCategory?: string;
    crawledCount: number;
    importedCount: number;
    totalCategories: number;
    completedCategories: number;
    message: string;
    categoryProgress: { [key: string]: { crawled: number; imported: number; status: string } };
  }>({
    status: 'idle',
    crawledCount: 0,
    importedCount: 0,
    totalCategories: 0,
    completedCategories: 0,
    message: '',
    categoryProgress: {},
  });
  const [crawlLimit, setCrawlLimit] = useState(20);

  useEffect(() => {
    const filteredLength = selectedMemberForHistory 
      ? pointTransactions.filter(tx => tx.memberId === selectedMemberForHistory).length
      : pointTransactions.length;
    const maxPage = Math.max(0, Math.ceil(filteredLength / itemsPerPage) - 1);
    if (pointPage > maxPage) {
      setPointPage(maxPage);
    }
  }, [pointTransactions, selectedMemberForHistory, pointPage]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken(token);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.authenticated) {
        setAuthToken(token);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch (error) {
      localStorage.removeItem("adminToken");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        setAuthToken(data.token);
        setIsAuthenticated(true);
        toast({ title: "로그인 성공", description: "관리자 페이지에 오신 것을 환영합니다." });
      } else {
        toast({ title: "로그인 실패", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "로그인 처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("adminToken");
    setAuthToken(null);
    setIsAuthenticated(false);
    toast({ title: "로그아웃", description: "로그아웃되었습니다." });
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      }
    });
  };

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (filters?: typeof memberSearchFilters) => {
    try {
      let url = "/api/admin/members";
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.searchField && filters.searchValue) {
          params.append("searchField", filters.searchField);
          params.append("searchValue", filters.searchValue);
        }
        if (filters.isActive !== null) {
          params.append("isActive", String(filters.isActive));
        }
        if (filters.isFrozen !== null) {
          params.append("isFrozen", String(filters.isFrozen));
        }
        if (filters.dateFrom) {
          params.append("dateFrom", filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append("dateTo", filters.dateTo);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
        setMemberPage(0);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchPointTransactions = async (filters?: typeof pointSearchFilters) => {
    try {
      let url = "/api/admin/point-transactions";
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.searchField && filters.searchValue) {
          params.append("searchField", filters.searchField);
          params.append("searchValue", filters.searchValue);
        }
        if (filters.type) {
          params.append("type", filters.type);
        }
        if (filters.dateFrom) {
          params.append("dateFrom", filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append("dateTo", filters.dateTo);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (data.success) {
        setPointTransactions(data.data);
        setPointPage(0);
      }
    } catch (error) {
      console.error("Error fetching point transactions:", error);
    }
  };

  const fetchDepositRequests = async () => {
    try {
      const url = depositFilter === "all" 
        ? "/api/admin/deposit-requests" 
        : `/api/admin/deposit-requests?status=${depositFilter}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (data.success) {
        setDepositRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
    }
  };

  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/deposit-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "승인 완료", description: "입금신청이 승인되었습니다." });
        fetchDepositRequests();
        setAdminNote("");
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/deposit-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "거부 완료", description: "입금신청이 거부되었습니다." });
        fetchDepositRequests();
        setAdminNote("");
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const url = withdrawalFilter === "all" 
        ? "/api/admin/withdrawal-requests" 
        : `/api/admin/withdrawal-requests?status=${withdrawalFilter}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (data.success) {
        setWithdrawalRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    if (!confirm("정말로 이 환급 신청을 승인하시겠습니까? 승인 후에는 취소할 수 없습니다.")) {
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/admin/withdrawal-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminNote: withdrawalAdminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "승인 완료", description: "출금신청이 승인되었습니다." });
        fetchWithdrawalRequests();
        setWithdrawalAdminNote("");
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/withdrawal-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote: withdrawalAdminNote }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "거부 완료", description: "출금신청이 거부되었습니다." });
        fetchWithdrawalRequests();
        setWithdrawalAdminNote("");
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/orders");
      const data = await res.json();
      if (data.success) {
        setAdminOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "주문 상태가 업데이트되었습니다." });
        fetchOrders();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "결제 상태가 업데이트되었습니다." });
        fetchOrders();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setOrderEditData({
      memberName: order.memberName || "",
      memberEmail: order.memberEmail || "",
      memberPhone: order.memberPhone || "",
      shippingName: order.shippingName || "",
      shippingPhone: order.shippingPhone || "",
      shippingAddress: order.shippingAddress || "",
      shippingAddressDetail: order.shippingAddressDetail || "",
      shippingZipcode: order.shippingZipcode || "",
      shippingMemo: order.shippingMemo || "",
      adminNote: order.adminNote || "",
    });
    setEditingOrder(false);
    setShowOrderDetailModal(true);
  };

  const handleSaveOrderEdit = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetchWithAuth(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        body: JSON.stringify(orderEditData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "주문 정보가 수정되었습니다." });
        fetchOrders();
        setShowOrderDetailModal(false);
        setSelectedOrder(null);
        setEditingOrder(false);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleAdjustPoints = async (memberId: string) => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast({ title: "오류", description: "유효한 금액을 입력해주세요.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/adjust-points`, {
        method: "POST",
        body: JSON.stringify({ amount, reason: adjustReason || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: data.message });
        fetchMembers();
        setAdjustAmount("");
        setAdjustReason("");
        setSelectedMemberForAction(null);
        setActionType(null);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleFreezeMember = async (memberId: string) => {
    if (!freezeReason.trim()) {
      toast({ title: "오류", description: "동결 사유를 입력해주세요.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/freeze`, {
        method: "POST",
        body: JSON.stringify({ reason: freezeReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "계정이 동결되었습니다." });
        fetchMembers();
        setFreezeReason("");
        setSelectedMemberForAction(null);
        setActionType(null);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleUnfreezeMember = async (memberId: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/unfreeze`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "계정 동결이 해제되었습니다." });
        fetchMembers();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/notices");
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchProducts();
      fetchMembers();
      fetchDepositRequests();
      fetchWithdrawalRequests();
      fetchReviews();
      fetchNotices();
      fetchSiteSettings();
      fetchPointTransactions();
    }
  }, [isAuthenticated]);
  
  const fetchSiteSettings = async () => {
    try {
      const res = await fetch("/api/settings/kakaoTalkLink");
      const data = await res.json();
      if (data.success && data.data) {
        setSiteSettings(prev => ({ ...prev, kakaoTalkLink: data.data.value }));
      }
    } catch (error) {
      console.log("Settings not found, using defaults");
    }
    
    try {
      const res = await fetch("/api/settings/deposit-account");
      if (res.ok) {
        const data = await res.json();
        setDepositAccountSettings({
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountHolder: data.accountHolder || "",
        });
      }
    } catch (error) {
      console.log("Deposit account settings not found");
    }
    
    await fetchReviewSettings();
  };

  const saveSiteSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings/kakaoTalkLink", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: siteSettings.kakaoTalkLink,
          description: "카카오톡 오픈채팅 링크"
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "카카오톡 링크가 저장되었습니다." });
      } else {
        toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const saveDepositAccountSettings = async () => {
    setDepositAccountLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings/deposit-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositAccountSettings),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "입금 계좌 정보가 저장되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setDepositAccountLoading(false);
    }
  };

  const fetchReviewSettings = async () => {
    try {
      const showRes = await fetch("/api/settings/review_show_on_homepage");
      const showData = await showRes.json();
      if (showData.success && showData.data) {
        setReviewSettings(prev => ({ ...prev, showOnHomepage: showData.data.value === "true" }));
      }
    } catch (error) {
      console.log("Review show setting not found, using default");
    }
    
    try {
      const approvalRes = await fetch("/api/settings/review_instant_approval");
      const approvalData = await approvalRes.json();
      if (approvalData.success && approvalData.data) {
        setReviewSettings(prev => ({ ...prev, instantApproval: approvalData.data.value === "true" }));
      }
    } catch (error) {
      console.log("Review approval setting not found, using default");
    }
  };

  const saveReviewSettings = async () => {
    setReviewSettingsLoading(true);
    try {
      await fetchWithAuth("/api/admin/settings/review_show_on_homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: reviewSettings.showOnHomepage ? "true" : "false",
          description: "홈페이지 상품후기 표시 여부"
        }),
      });
      
      await fetchWithAuth("/api/admin/settings/review_instant_approval", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: reviewSettings.instantApproval ? "true" : "false",
          description: "상품후기 즉시승인 여부"
        }),
      });
      
      toast({ title: "성공", description: "후기 설정이 저장되었습니다." });
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setReviewSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === "deposits") {
      fetchDepositRequests();
    }
  }, [depositFilter, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "withdrawals") {
      fetchWithdrawalRequests();
    }
  }, [withdrawalFilter, activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "orders") {
      fetchOrders();
    }
  }, [orderFilter, activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !chatSocketRef.current) {
      connectChatWebSocket();
      fetchChatConversations();
    }
    
    return () => {
      if (chatSocketRef.current && !isAuthenticated) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
        setChatSocket(null);
        setIsChatConnected(false);
      }
    };
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated && activeTab === "chat") {
      fetchChatConversations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "settings") {
      fetchSiteSettings();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const connectChatWebSocket = useCallback(() => {
    if (chatSocketRef.current) {
      chatSocketRef.current.close();
      chatSocketRef.current = null;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      setIsChatConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        senderType: "admin",
        senderName: "관리자",
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "conversations":
          setChatConversations(data.data);
          break;
        case "history":
          setChatMessages(data.data);
          break;
        case "message":
          setChatMessages(prev => [...prev, data.data]);
          fetchChatConversations();
          if (data.data.senderType === "user" || data.data.senderType === "member") {
            playNotificationSound();
            setChatNotification({
              show: true,
              memberName: data.data.senderName || "고객",
              message: data.data.message,
              conversationId: data.data.conversationId,
            });
            setTimeout(() => setChatNotification(null), 5000);
          }
          break;
        case "new_message":
          fetchChatConversations();
          if (data.data && (data.data.senderType === "user" || data.data.senderType === "member")) {
            playNotificationSound();
            setChatNotification({
              show: true,
              memberName: data.data.senderName || "고객",
              message: data.data.message || "새 메시지가 도착했습니다.",
              conversationId: data.data.conversationId,
            });
            setTimeout(() => setChatNotification(null), 5000);
          }
          break;
        case "read":
          break;
        case "new_deposit":
          playNotificationSound();
          setFlashDeposit(true);
          fetchDepositRequests();
          setTimeout(() => setFlashDeposit(false), 5000);
          break;
        case "new_withdrawal":
          playNotificationSound();
          setFlashWithdrawal(true);
          fetchWithdrawalRequests();
          setTimeout(() => setFlashWithdrawal(false), 5000);
          break;
      }
    };

    ws.onclose = () => {
      setIsChatConnected(false);
      if (chatSocketRef.current === ws) {
        chatSocketRef.current = null;
        setTimeout(() => {
          if (isAuthenticated) {
            connectChatWebSocket();
          }
        }, 3000);
      }
    };

    ws.onerror = () => {
      setIsChatConnected(false);
    };

    setChatSocket(ws);
  }, []);

  const fetchChatConversations = async () => {
    try {
      const res = await fetchWithAuth("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setChatConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const selectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setChatMessages([]);
    
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        type: "join",
        conversationId: conversation.id,
        senderType: "admin",
        senderName: "관리자",
      }));
      
      chatSocket.send(JSON.stringify({
        type: "read",
        conversationId: conversation.id,
      }));
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !chatSocket) return;

    if (chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        type: "message",
        conversationId: selectedConversation.id,
        senderType: "admin",
        senderName: "관리자",
        message: newMessage.trim(),
      }));
      setNewMessage("");
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const res = await fetchWithAuth(`/api/chat/conversations/${conversationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상담이 종료되었습니다." });
        fetchChatConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setChatMessages([]);
        }
      }
    } catch (error) {
      toast({ title: "오류", description: "상담 종료에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSeedData = async () => {
    try {
      const res = await fetchWithAuth("/api/seed-full", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "오류", description: "데이터 생성에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleCrawlCategory = async (categoryId: string) => {
    if (crawlingProgress.status === 'crawling' || crawlingProgress.status === 'importing') {
      toast({ title: "알림", description: "이미 크롤링이 진행 중입니다.", variant: "destructive" });
      return;
    }

    setCrawlingCategory(categoryId);
    setCrawlingProgress(prev => ({
      ...prev,
      status: 'crawling',
      currentCategory: categoryId,
      message: `${CATEGORY_OPTIONS.find(c => c.id === categoryId)?.name || categoryId} 카테고리 크롤링 중...`,
      categoryProgress: {
        ...prev.categoryProgress,
        [categoryId]: { crawled: 0, imported: 0, status: 'crawling' }
      }
    }));

    try {
      const res = await fetchWithAuth("/api/admin/crawling/vivian-category", {
        method: "POST",
        body: JSON.stringify({ categoryId: getCategoryIdNumber(categoryId), limit: crawlLimit }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Category crawl response error:", res.status, errorText);
        throw new Error(`서버 오류 (${res.status})`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setCrawlingProgress(prev => ({
          ...prev,
          status: 'completed',
          message: `${data.categoryName}: ${data.crawledCount}개 크롤링, ${data.importedCount}개 저장 완료`,
          categoryProgress: {
            ...prev.categoryProgress,
            [categoryId]: { crawled: data.crawledCount, imported: data.importedCount, status: 'completed' }
          }
        }));
        toast({ 
          title: "크롤링 완료", 
          description: `${data.categoryName}: ${data.importedCount}개 상품이 저장되었습니다.` 
        });
        fetchProducts();
        fetchStats();
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (error) {
      setCrawlingProgress(prev => ({
        ...prev,
        status: 'error',
        message: `크롤링 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        categoryProgress: {
          ...prev.categoryProgress,
          [categoryId]: { crawled: 0, imported: 0, status: 'error' }
        }
      }));
      toast({ title: "오류", description: "크롤링에 실패했습니다.", variant: "destructive" });
    } finally {
      setCrawlingCategory(null);
    }
  };

  const handleCrawlAllCategories = async () => {
    if (crawlingProgress.status === 'crawling' || crawlingProgress.status === 'importing') {
      toast({ title: "알림", description: "이미 크롤링이 진행 중입니다.", variant: "destructive" });
      return;
    }

    setCrawlingProgress({
      status: 'crawling',
      crawledCount: 0,
      importedCount: 0,
      totalCategories: CATEGORY_OPTIONS.length,
      completedCategories: 0,
      message: '전체 카테고리 크롤링 시작...',
      categoryProgress: {},
    });

    try {
      const res = await fetchWithAuth("/api/admin/crawling/batch-vivian", {
        method: "POST",
        body: JSON.stringify({ productsPerCategory: crawlLimit }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Batch crawl response error:", res.status, errorText);
        throw new Error(`서버 오류 (${res.status}): ${errorText.substring(0, 100)}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setCrawlingProgress({
          status: 'completed',
          crawledCount: data.totalCrawled,
          importedCount: data.totalImported,
          totalCategories: CATEGORY_OPTIONS.length,
          completedCategories: CATEGORY_OPTIONS.length,
          message: `전체 크롤링 완료: ${data.totalCrawled}개 크롤링, ${data.totalImported}개 저장`,
          categoryProgress: data.categoryResults?.reduce((acc: any, r: any) => ({
            ...acc,
            [r.category]: { crawled: r.crawled, imported: r.imported, status: 'completed' }
          }), {}) || {},
        });
        toast({ 
          title: "전체 크롤링 완료", 
          description: `${data.totalImported}개 상품이 저장되었습니다.` 
        });
        fetchProducts();
        fetchStats();
      } else {
        throw new Error(data.error || "크롤링 실패");
      }
    } catch (error) {
      setCrawlingProgress(prev => ({
        ...prev,
        status: 'error',
        message: `크롤링 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      }));
      toast({ title: "오류", description: "전체 크롤링에 실패했습니다.", variant: "destructive" });
    }
  };

  const getCategoryIdNumber = (categoryId: string): number => {
    const mapping: { [key: string]: number } = {
      'home_interior': 10,
      'beauty': 20,
      'electronics': 30,
      'living': 40,
      'health': 50,
      'luxury': 60,
      'kids': 70,
    };
    return mapping[categoryId] || 10;
  };

  const handleCreate = async () => {
    try {
      const res = await fetchWithAuth("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 추가되었습니다." });
        setShowAddForm(false);
        setFormData({ name: "", weight: "", purity: "", price: "", originalPrice: "", discountPercent: 0, category: "beauty", isBest: false, isNew: false, isHot: false, useFixedPrice: false, description: "", imageUrl: "", imageUrls: [] });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 수정되었습니다." });
        setEditingId(null);
        setShowEditProductModal(false);
        fetchProducts();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    console.log("handleDelete called for product:", id);
    console.log("Current authToken:", authToken ? "exists" : "null");
    
    if (!window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      console.log("Delete cancelled by user");
      return;
    }
    
    console.log("Sending DELETE request...");
    
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: "DELETE" });
      console.log("DELETE response status:", res.status);
      const data = await res.json();
      console.log("DELETE response data:", data);
      
      if (data.success) {
        toast({ title: "성공", description: "상품이 삭제되었습니다." });
        fetchProducts();
        fetchStats();
      } else {
        console.error("Product delete error:", data.error);
        toast({ title: "오류", description: data.error || "상품 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Product delete error:", error);
      toast({ title: "오류", description: "상품 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteAllProducts = async () => {
    const confirmMessage = `⚠️ 경고: 전체 상품 삭제\n\n정말로 모든 상품(${products.length}개)을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    const doubleConfirm = window.confirm("마지막 확인: 정말로 모든 상품을 삭제하시겠습니까?\n\n'확인'을 누르면 모든 상품이 영구 삭제됩니다.");
    
    if (!doubleConfirm) {
      return;
    }
    
    try {
      const res = await fetchWithAuth("/api/admin/products/all", { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: "성공", description: `${data.deletedCount || 0}개의 상품이 삭제되었습니다.` });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: data.error || "전체 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Delete all products error:", error);
      toast({ title: "오류", description: "전체 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

  const handleDownloadExistingImages = async () => {
    const confirmMessage = `기존 상품(${products.length}개)의 이미지를 로컬에 다운로드하시겠습니까?\n\n외부 URL 이미지를 서버에 저장하여 원본 사이트가 다운되어도 이미지가 표시됩니다.\n\n이 작업은 시간이 걸릴 수 있습니다.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsDownloadingImages(true);
    
    try {
      const res = await fetchWithAuth("/api/admin/products/download-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ 
          title: "성공", 
          description: `${data.data.processed}개 상품, ${data.data.totalDownloaded}개 이미지 다운로드 완료` 
        });
        fetchProducts();
      } else {
        toast({ title: "오류", description: data.error || "이미지 다운로드에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Download images error:", error);
      toast({ title: "오류", description: "이미지 다운로드에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsDownloadingImages(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    const existingUrls = product.imageUrls || [];
    setFormData({
      name: product.name,
      weight: product.weight,
      purity: product.purity,
      price: product.price,
      originalPrice: product.originalPrice || "",
      discountPercent: product.discountPercent || 0,
      category: product.category,
      isBest: product.isBest || false,
      isNew: product.isNew || false,
      isHot: product.isHot || false,
      useFixedPrice: product.useFixedPrice || false,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      imageUrls: existingUrls.length > 0 ? existingUrls : (product.imageUrl ? [product.imageUrl] : []),
    });
    setShowEditProductModal(true);
  };

  const handleCreateMember = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원이 추가되었습니다." });
        setShowAddMemberForm(false);
        setMemberFormData({ email: "", password: "", name: "", phone: "", address: "", bank: "", accountNumber: "", memo: "", isActive: true, isAdmin: false });
        fetchMembers();
        fetchStats();
      } else {
        toast({ title: "오류", description: "회원 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateMember = async (id: string) => {
    try {
      const updateData = { ...memberFormData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      const res = await fetchWithAuth(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원 정보가 수정되었습니다." });
        setEditingMemberId(null);
        setShowEditMemberModal(false);
        fetchMembers();
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 정보 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("정말로 이 회원을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원이 삭제되었습니다." });
        fetchMembers();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSaveMemo = async (memberId: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: memoValue }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "저장됨", description: "메모가 저장되었습니다." });
        setEditingMemoId(null);
        fetchMembers();
      }
    } catch (error) {
      toast({ title: "오류", description: "메모 저장에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberFormData({
      email: member.username,
      password: "",
      name: member.name,
      phone: member.phone || "",
      address: (member as any).address || "",
      bank: (member as any).bank || "",
      accountNumber: (member as any).accountNumber || "",
      memo: member.memo || "",
      isActive: member.isActive ?? true,
      isAdmin: member.isAdmin ?? false,
    });
    setShowEditMemberModal(true);
  };

  const formatErrorMessage = (error: any): string => {
    if (!error) return "알 수 없는 오류가 발생했습니다.";
    if (typeof error === "string") return error;
    if (Array.isArray(error)) {
      return error.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    }
    if (typeof error === "object" && error.message) {
      return error.message;
    }
    return JSON.stringify(error);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authToken) {
      toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "오류", description: "파일 크기는 5MB 이하여야 합니다.", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/admin/upload/review-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.status === 401) {
        toast({ title: "세션 만료", description: "다시 로그인해주세요.", variant: "destructive" });
        setAuthToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setReviewFormData({ ...reviewFormData, imageUrl: data.data.imageUrl });
        toast({ title: "성공", description: "이미지가 업로드되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Image upload error:", error);
      if (error.name === 'AbortError') {
        toast({ title: "오류", description: "업로드 시간이 초과되었습니다. 다시 시도해주세요.", variant: "destructive" });
      } else {
        toast({ title: "오류", description: "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authToken) {
      toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "오류", description: "파일 크기는 5MB 이하여야 합니다.", variant: "destructive" });
      return;
    }

    setUploadingProductImage(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const res = await fetch("/api/admin/upload/product-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: uploadFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.status === 401) {
        toast({ title: "세션 만료", description: "다시 로그인해주세요.", variant: "destructive" });
        setAuthToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, data.data.imageUrl],
          imageUrl: prev.imageUrl || data.data.imageUrl,
        }));
        toast({ title: "성공", description: "상품 이미지가 업로드되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Product image upload error:", error);
      if (error.name === 'AbortError') {
        toast({ title: "오류", description: "업로드 시간이 초과되었습니다. 다시 시도해주세요.", variant: "destructive" });
      } else {
        toast({ title: "오류", description: "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } finally {
      setUploadingProductImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setFormData(prev => {
      const newImageUrls = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: newImageUrls,
        imageUrl: newImageUrls[0] || "",
      };
    });
  };

  const handleCreateReview = async () => {
    try {
      const res = await fetchWithAuth("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewFormData,
          displayDate: new Date(reviewFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "후기가 추가되었습니다." });
        setShowAddReviewForm(false);
        setReviewFormData({ authorName: "", productName: "", rating: 5, title: "", content: "", imageUrl: "", isVisible: true, displayDate: new Date().toISOString().slice(0, 16) });
        fetchReviews();
      } else {
        console.error("Review creation error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review creation error:", error);
      toast({ title: "오류", description: "후기 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateReview = async (id: string) => {
    try {
      console.log("=== FRONTEND: Starting review update ===");
      console.log("Review ID:", id);
      console.log("Form data:", reviewFormData);
      
      const res = await fetchWithAuth(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewFormData,
          displayDate: new Date(reviewFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      console.log("Server response:", data);
      
      if (data.success) {
        toast({ title: "성공", description: "후기가 수정되었습니다." });
        setEditingReviewId(null);
        
        // Fetch reviews and log the result
        console.log("Fetching reviews after update...");
        const reviewsRes = await fetchWithAuth("/api/admin/reviews");
        const reviewsData = await reviewsRes.json();
        console.log("Reviews count after update:", reviewsData.data?.length);
        console.log("Updated review still exists:", reviewsData.data?.some((r: any) => r.id === id));
        
        if (reviewsData.success) {
          setReviews(reviewsData.data);
          console.log("Reviews state updated. Count:", reviewsData.data.length);
        }
      } else {
        console.error("Review update error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 수정에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review update error:", error);
      toast({ title: "오류", description: "후기 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("정말로 이 후기를 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "후기가 삭제되었습니다." });
        fetchReviews();
      } else {
        console.error("Review delete error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review delete error:", error);
      toast({ title: "오류", description: "후기 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/reviews/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "후기가 승인되었습니다." });
        fetchReviews();
      } else {
        console.error("Review approve error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 승인에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review approve error:", error);
      toast({ title: "오류", description: "후기 승인에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    
    // Preserve the original displayDate exactly as stored
    let displayDateForInput = new Date().toISOString().slice(0, 16);
    if (review.displayDate) {
      // Store the original ISO string to preserve it during edit
      const originalDate = new Date(review.displayDate);
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const year = originalDate.getFullYear();
      const month = String(originalDate.getMonth() + 1).padStart(2, '0');
      const day = String(originalDate.getDate()).padStart(2, '0');
      const hours = String(originalDate.getHours()).padStart(2, '0');
      const minutes = String(originalDate.getMinutes()).padStart(2, '0');
      displayDateForInput = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setReviewFormData({
      authorName: review.authorName,
      productName: review.productName || "",
      rating: review.rating || 5,
      title: review.title,
      content: review.content,
      imageUrl: review.imageUrl || "",
      isVisible: review.isVisible ?? true,
      displayDate: displayDateForInput,
    });
  };

  const handleCreateNotice = async () => {
    try {
      const res = await fetchWithAuth("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...noticeFormData,
          displayDate: new Date(noticeFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 추가되었습니다." });
        setShowAddNoticeForm(false);
        setNoticeFormData({ title: "", content: "", category: "general", isPinned: false, isVisible: true, displayDate: new Date().toISOString().slice(0, 16), viewCount: 0 });
        fetchNotices();
      } else {
        console.error("Notice creation error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "공지사항 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Notice creation error:", error);
      toast({ title: "오류", description: "공지사항 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateNotice = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/notices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...noticeFormData,
          displayDate: new Date(noticeFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 수정되었습니다." });
        setEditingNoticeId(null);
        fetchNotices();
      }
    } catch (error) {
      toast({ title: "오류", description: "공지사항 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/notices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 삭제되었습니다." });
        fetchNotices();
      }
    } catch (error) {
      toast({ title: "오류", description: "공지사항 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditNotice = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setNoticeFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category || "general",
      isPinned: notice.isPinned ?? false,
      isVisible: notice.isVisible ?? true,
      displayDate: notice.displayDate ? new Date(notice.displayDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      viewCount: notice.viewCount || 0,
    });
  };

  const filteredProducts = productFilter === "all" 
    ? products 
    : products.filter(p => p.category === productFilter);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">인증 확인 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-gray-500 mt-2">Estella 관리 시스템</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  data-testid="input-username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <Button
              data-testid="button-login"
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium"
            >
              {loginLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>관리자 계정으로만 접근 가능합니다</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNotificationClick = (conversationId: string) => {
    setActiveTab("chat");
    const conversation = chatConversations.find(c => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
    }
    setChatNotification(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {chatNotification && chatNotification.show && (
        <div 
          className="fixed top-4 right-4 z-[200] animate-in slide-in-from-right duration-300 cursor-pointer"
          onClick={() => handleNotificationClick(chatNotification.conversationId)}
        >
          <div className="bg-white rounded-xl shadow-2xl border-l-4 border-yellow-500 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-sm">새 채팅 메시지</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setChatNotification(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-yellow-600 font-medium mb-1">{chatNotification.memberName}님</p>
                <p className="text-sm text-gray-600 truncate">{chatNotification.message}</p>
                <p className="text-xs text-gray-400 mt-2">클릭하여 확인하기</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Volume2 className="w-3 h-3" />
              <span>알림음 재생됨</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
        <aside className="w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex-shrink-0 hidden lg:flex lg:flex-col shadow-2xl h-screen sticky top-0 overflow-y-auto">
          <div className="p-6 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/30">
                <span className="font-bold text-white text-2xl italic font-serif">E</span>
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-wide text-amber-100">ESTELLA</h1>
                <p className="text-xs text-amber-400/80 font-medium">ADMINISTRATOR</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <button
              data-testid="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "dashboard" 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              관리자 메인
            </button>
            
            <div className="pt-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider px-4 py-2 font-semibold">환경설정</p>
              <button
                data-testid="tab-settings"
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "settings" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Settings className="w-5 h-5" />
                환경설정
              </button>
            </div>
            
            <div className="pt-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider px-4 py-2 font-semibold">회원관리</p>
              <button
                data-testid="tab-members"
                onClick={() => setActiveTab("members")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "members" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="w-5 h-5" />
                회원 관리
              </button>
            </div>

            <div className="pt-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider px-4 py-2 font-semibold">게시판관리</p>
              <button
                data-testid="tab-notices"
                onClick={() => setActiveTab("notices")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "notices" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Bell className="w-5 h-5" />
                공지 관리
              </button>
              <button
                data-testid="tab-reviews"
                onClick={() => setActiveTab("reviews")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "reviews" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Star className="w-5 h-5" />
                후기 관리
              </button>
            </div>
            
            <div className="pt-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider px-4 py-2 font-semibold">쇼핑몰관리</p>
              <button
                data-testid="tab-products"
                onClick={() => setActiveTab("products")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "products" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Package className="w-5 h-5" />
                상품 관리
              </button>
              <button
                data-testid="tab-orders"
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "orders" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  주문 관리
                </div>
                {adminOrders.filter(o => o.status === "pending").length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {adminOrders.filter(o => o.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                data-testid="tab-crawling"
                onClick={() => setActiveTab("crawling")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "crawling" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Download className="w-5 h-5" />
                상품 크롤링
              </button>
            </div>

            <div className="pt-4">
              <p className="text-xs text-amber-500/70 uppercase tracking-wider px-4 py-2 font-semibold">쇼핑몰현황</p>
              <button
                data-testid="tab-chat"
                onClick={() => setActiveTab("chat")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "chat" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  1:1 문의
                </div>
                {chatConversations.filter(c => c.status === "open").length > 0 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {chatConversations.filter(c => c.status === "open").length}
                  </span>
                )}
              </button>
              <button
                data-testid="tab-deposits"
                onClick={() => { setActiveTab("deposits"); setFlashDeposit(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "deposits" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : flashDeposit 
                      ? "bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-500/50" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  포인트충전
                </div>
                {depositRequests.filter(d => d.status === "pending").length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {depositRequests.filter(d => d.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                data-testid="tab-withdrawals"
                onClick={() => { setActiveTab("withdrawals"); setFlashWithdrawal(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "withdrawals" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : flashWithdrawal 
                      ? "bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/50" 
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  포인트환급
                </div>
                {withdrawalRequests.filter(w => w.status === "pending").length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {withdrawalRequests.filter(w => w.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                data-testid="tab-points"
                onClick={() => setActiveTab("points")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "points" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow-lg shadow-amber-500/30" 
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Zap className="w-5 h-5" />
                포인트관리
              </button>
            </div>
            
          </nav>
          
          <div className="absolute bottom-0 left-0 w-72 p-4 border-t border-amber-500/20 bg-gradient-to-r from-gray-900 to-gray-800">
            <Button 
              data-testid="button-logout"
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-gray-400 hover:text-amber-400 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </aside>
        
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="hidden lg:flex bg-white border-b border-amber-200/30 px-6 py-3 items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-gray-800">관리자 대시보드</h1>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">Estella 관리자 시스템</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("deposits")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 rounded-lg font-bold text-sm hover:from-amber-600 hover:to-yellow-600 shadow-md transition-all"
              >
                <Wallet className="w-5 h-5" />
                포인트충전관리
                {depositRequests.filter(d => d.status === "pending").length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">{depositRequests.filter(d => d.status === "pending").length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("withdrawals")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-emerald-600 shadow-md transition-all border border-green-400"
              >
                <Wallet className="w-5 h-5" />
                포인트출금관리
                {withdrawalRequests.filter(w => w.status === "pending").length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">{withdrawalRequests.filter(w => w.status === "pending").length}</span>
                )}
              </button>
              <span className="text-gray-300">|</span>
              <a href="/" target="_blank" className="text-sm text-gray-600 hover:text-amber-600 flex items-center gap-1">
                <Eye className="w-4 h-4" />
                홈페이지
              </a>
              <a href="/shop" target="_blank" className="text-sm text-gray-600 hover:text-amber-600 flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                쇼핑몰
              </a>
            </div>
          </header>
          
          <header className="bg-white border-b border-amber-200/50 px-6 py-4 flex items-center justify-between lg:hidden shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center shadow">
                <span className="font-bold text-white text-sm italic font-serif">E</span>
              </div>
              <span className="font-bold text-gray-800">ESTELLA</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-amber-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </header>
          
          <div className="lg:hidden overflow-x-auto bg-white border-b border-amber-100 px-4 py-2 shadow-sm">
            <div className="flex gap-2">
              {[
                { id: "dashboard", icon: BarChart3, label: "메인" },
                { id: "products", icon: Package, label: "상품" },
                { id: "crawling", icon: Download, label: "크롤링" },
                { id: "members", icon: Users, label: "회원" },
                { id: "orders", icon: ShoppingCart, label: "주문" },
                { id: "deposits", icon: Wallet, label: "충전" },
                { id: "withdrawals", icon: Wallet, label: "환급" },
                { id: "reviews", icon: Star, label: "후기" },
                { id: "notices", icon: Bell, label: "공지" },
                { id: "chat", icon: MessageCircle, label: "문의" },
                { id: "settings", icon: Settings, label: "설정" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <main className="flex-1 p-6 overflow-auto">

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={() => setActiveTab("orders")}
                className="bg-white rounded-xl shadow-sm p-5 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">주문</p>
                    <p className="text-xs text-amber-600 font-medium">▶ 입금</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600 group-hover:text-amber-700">{adminOrders.filter(o => o.status === "pending").length}</p>
                <p className="text-xs text-gray-400 mt-1">{adminOrders.filter(o => o.status === "pending").reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}원</p>
              </button>
              
              <button
                onClick={() => setActiveTab("orders")}
                className="bg-white rounded-xl shadow-sm p-5 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">입금</p>
                    <p className="text-xs text-blue-600 font-medium">▶ 준비</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700">{adminOrders.filter(o => o.status === "confirmed").length}</p>
                <p className="text-xs text-gray-400 mt-1">{adminOrders.filter(o => o.status === "confirmed").reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}원</p>
              </button>
              
              <button
                onClick={() => setActiveTab("orders")}
                className="bg-white rounded-xl shadow-sm p-5 border border-green-100 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">준비</p>
                    <p className="text-xs text-green-600 font-medium">▶ 배송</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 group-hover:text-green-700">{adminOrders.filter(o => o.status === "shipped").length}</p>
                <p className="text-xs text-gray-400 mt-1">{adminOrders.filter(o => o.status === "shipped").reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}원</p>
              </button>
              
              <button
                onClick={() => setActiveTab("orders")}
                className="bg-white rounded-xl shadow-sm p-5 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">배송중</p>
                    <p className="text-xs text-purple-600 font-medium">▶ 완료</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-700">{adminOrders.filter(o => o.status === "delivered").length}</p>
                <p className="text-xs text-gray-400 mt-1">{adminOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}원</p>
              </button>
              
              <button
                onClick={() => setActiveTab("orders")}
                className="bg-white rounded-xl shadow-sm p-5 border border-red-100 hover:border-red-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">취소</p>
                    <p className="text-xs text-red-600 font-medium">주문</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600 group-hover:text-red-700">{adminOrders.filter(o => o.status === "cancelled").length}</p>
                <p className="text-xs text-gray-400 mt-1">{adminOrders.filter(o => o.status === "cancelled").reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}원</p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  사이트 통계
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">전체상품</span>
                    <span className="font-bold text-amber-600">{stats?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">전체회원수</span>
                    <span className="font-bold text-amber-600">{stats?.totalMembers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">카테고리</span>
                    <span className="font-bold text-amber-600">{stats?.totalCategories || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">총 주문수</span>
                    <span className="font-bold text-amber-600">{adminOrders.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">대기중 문의</span>
                    <span className="font-bold text-green-600">{chatConversations.filter(c => c.status === "open").length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                    1:1문의
                  </h3>
                  <button onClick={() => setActiveTab("chat")} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                    ▶ 전체보기
                  </button>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {chatConversations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">문의가 없습니다.</p>
                  ) : (
                    chatConversations.slice(0, 5).map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => { setActiveTab("chat"); }}
                        className="w-full flex items-start gap-3 p-3 bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800">{(chat as any).memberName || "회원"}</span>
                            {chat.status === "open" && (
                              <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">대기</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{chat.subject || "문의"}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(chat.createdAt || "").toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    사용후기
                  </h3>
                  <button onClick={() => setActiveTab("reviews")} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                    ▶ 전체보기
                  </button>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">후기가 없습니다.</p>
                  ) : (
                    reviews.slice(0, 5).map((review) => (
                      <div
                        key={review.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800 truncate">{review.title || review.productName}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{review.authorName}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.displayDate || review.createdAt || "").toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  카테고리별 상품 현황
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats?.productsByCategory.map((cat) => (
                    <div key={cat.id} className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 text-center border border-amber-100">
                      <p className="text-2xl font-bold text-amber-600">{cat.count}</p>
                      <p className="text-xs text-gray-600 mt-1">{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  빠른 작업
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => setActiveTab("products")} variant="outline" className="h-auto py-4 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-6 h-6 text-amber-600" />
                      <span className="text-sm">상품 관리</span>
                    </div>
                  </Button>
                  <Button onClick={() => setActiveTab("members")} variant="outline" className="h-auto py-4 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-6 h-6 text-amber-600" />
                      <span className="text-sm">회원 관리</span>
                    </div>
                  </Button>
                  <Button onClick={() => setActiveTab("orders")} variant="outline" className="h-auto py-4 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-amber-600" />
                      <span className="text-sm">주문 관리</span>
                    </div>
                  </Button>
                  <Button onClick={handleSeedData} variant="outline" className="h-auto py-4 border-amber-200 hover:bg-amber-50 hover:border-amber-300">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="w-6 h-6 text-amber-600" />
                      <span className="text-sm">샘플 데이터</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">상품 관리</h2>
                <p className="text-gray-500 text-sm">총 {products.length}개의 상품</p>
              </div>
              <div className="flex gap-3">
                <select
                  data-testid="select-product-filter"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">전체 카테고리</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={fetchProducts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button 
                  data-testid="button-download-images"
                  variant="outline"
                  onClick={handleDownloadExistingImages}
                  disabled={isDownloadingImages}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloadingImages ? "다운로드 중..." : "이미지 저장"}
                </Button>
                <Button 
                  data-testid="button-delete-all-products"
                  variant="outline"
                  onClick={handleDeleteAllProducts}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  전체 삭제
                </Button>
                <Button 
                  data-testid="button-add-product"
                  onClick={() => setShowAddForm(true)} 
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  상품 추가
                </Button>
              </div>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">새 상품 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    data-testid="input-product-name"
                    placeholder="상품명"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-weight"
                    placeholder="무게 (예: 100g)"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-purity"
                    placeholder="순도 (예: 999.9‰)"
                    value={formData.purity}
                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-price"
                    placeholder="판매가 (예: 28,900)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-original-price"
                    placeholder="정가 (선택, 예: 34,000)"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-discount-percent"
                    placeholder="할인율 % (선택, 예: 15)"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercent || ""}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                  />
                  <select
                    data-testid="select-product-category"
                    className="border border-gray-200 rounded-md px-3 py-2"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상품 이미지 (최대 10장)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        disabled={uploadingProductImage || formData.imageUrls.length >= 10}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
                        data-testid="input-product-image-file"
                      />
                      {uploadingProductImage && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>업로드 중...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formData.imageUrls.length}/10장</p>
                    {formData.imageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`상품 미리보기 ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveProductImage(index)}
                              className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded text-[10px]">대표</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBest}
                      onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Best 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">New 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isHot}
                      onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Hot 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                    <input
                      type="checkbox"
                      checked={formData.useFixedPrice}
                      onChange={(e) => setFormData({ ...formData, useFixedPrice: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-yellow-700">고정가격 사용</span>
                  </label>
                </div>
                <Textarea
                  data-testid="textarea-product-description"
                  placeholder="상품 설명 (선택)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button data-testid="button-save-product" onClick={handleCreate} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>취소</Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-500">로딩 중...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
                <Button onClick={handleSeedData} variant="outline">샘플 데이터 생성하기</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">상품명</th>
                      <th className="px-4 py-3 text-left font-medium">무게</th>
                      <th className="px-4 py-3 text-left font-medium">순도</th>
                      <th className="px-4 py-3 text-left font-medium">가격</th>
                      <th className="px-4 py-3 text-left font-medium">카테고리</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-10 h-10 object-cover rounded border border-gray-200"
                              />
                            )}
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{product.weight}</td>
                        <td className="px-4 py-3 text-gray-600">{product.purity}</td>
                        <td className="px-4 py-3 text-yellow-600 font-bold">{product.price}원</td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {CATEGORY_OPTIONS.find(c => c.id === product.category)?.name || product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.isBest && <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] mr-1">Best</span>}
                          {product.isNew && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">New</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            data-testid={`button-edit-product-${product.id}`}
                            size="icon" 
                            variant="ghost" 
                            onClick={() => startEdit(product)} 
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            data-testid={`button-delete-product-${product.id}`}
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(product.id)} 
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 상품 수정 모달 */}
            {showEditProductModal && editingId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">상품 수정</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setShowEditProductModal(false);
                          setEditingId(null);
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
                        <Input
                          placeholder="상품명"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">무게</label>
                        <Input
                          placeholder="무게 (예: 100g)"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">순도</label>
                        <Input
                          placeholder="순도 (예: 999.9‰)"
                          value={formData.purity}
                          onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">판매가 *</label>
                        <Input
                          placeholder="판매가 (예: 28,900)"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">정가 (선택)</label>
                        <Input
                          placeholder="정가 (예: 34,000)"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">할인율 % (선택)</label>
                        <Input
                          placeholder="할인율 (예: 15)"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountPercent || ""}
                          onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                        <select
                          className="w-full border border-gray-200 rounded-md px-3 py-2"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isBest}
                            onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Best 상품</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isNew}
                            onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">New 상품</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isHot}
                            onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Hot 상품</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                          <input
                            type="checkbox"
                            checked={formData.useFixedPrice}
                            onChange={(e) => setFormData({ ...formData, useFixedPrice: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-yellow-700">고정가격 사용</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                      <Textarea
                        placeholder="상품 설명 (선택)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">상품 이미지 (최대 10장)</label>
                      <div className="space-y-4">
                        {formData.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {formData.imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`상품 이미지 ${index + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveProductImage(index)}
                                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                {index === 0 && (
                                  <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">대표</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            disabled={uploadingProductImage || formData.imageUrls.length >= 10}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
                            data-testid="input-edit-product-image"
                          />
                          {uploadingProductImage && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>업로드 중...</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">최대 5MB, JPG/PNG/GIF 지원 | {formData.imageUrls.length}/10장</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowEditProductModal(false);
                          setEditingId(null);
                        }}
                      >
                        취소
                      </Button>
                      <Button 
                        onClick={() => editingId && handleUpdate(editingId)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">회원 관리</h2>
                <p className="text-gray-500 text-sm">총 {members.length}명의 회원</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => fetchMembers(memberSearchFilters || undefined)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button 
                  data-testid="button-add-member"
                  onClick={() => setShowAddMemberForm(true)} 
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  회원 추가
                </Button>
              </div>
            </div>

            <AdminSearchPanel
              onSearch={(filters) => {
                setMemberSearchFilters(filters);
                fetchMembers(filters);
              }}
              onReset={() => {
                setMemberSearchFilters(null);
                fetchMembers();
              }}
              isLoading={loading}
            />

            {showAddMemberForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">새 회원 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                    <Input
                      data-testid="input-member-email"
                      type="email"
                      placeholder="이메일"
                      value={memberFormData.email}
                      onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                    <Input
                      data-testid="input-member-password"
                      type="password"
                      placeholder="비밀번호"
                      value={memberFormData.password}
                      onChange={(e) => setMemberFormData({ ...memberFormData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <Input
                      data-testid="input-member-name"
                      placeholder="이름"
                      value={memberFormData.name}
                      onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <Input
                      data-testid="input-member-phone"
                      placeholder="전화번호"
                      value={memberFormData.phone}
                      onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <Input
                      data-testid="input-member-address"
                      placeholder="주소"
                      value={memberFormData.address}
                      onChange={(e) => setMemberFormData({ ...memberFormData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                    <select
                      className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                      value={memberFormData.bank}
                      onChange={(e) => setMemberFormData({ ...memberFormData, bank: e.target.value })}
                    >
                      <option value="">은행 선택</option>
                      <option value="국민은행">국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="농협은행">농협은행</option>
                      <option value="기업은행">기업은행</option>
                      <option value="SC제일은행">SC제일은행</option>
                      <option value="케이뱅크">케이뱅크</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                      <option value="새마을금고">새마을금고</option>
                      <option value="우체국">우체국</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                    <Input
                      data-testid="input-member-account"
                      placeholder="계좌번호"
                      value={memberFormData.accountNumber}
                      onChange={(e) => setMemberFormData({ ...memberFormData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberFormData.isActive}
                      onChange={(e) => setMemberFormData({ ...memberFormData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">활성 회원</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberFormData.isAdmin}
                      onChange={(e) => setMemberFormData({ ...memberFormData, isAdmin: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">관리자 권한</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button data-testid="button-save-member" onClick={handleCreateMember} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                  <Button variant="outline" onClick={() => setShowAddMemberForm(false)}>취소</Button>
                </div>
              </div>
            )}

            {showEditMemberModal && editingMemberId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4">회원 정보 수정</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <Input
                        type="email"
                        value={memberFormData.email}
                        onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 (변경시에만 입력)</label>
                      <Input
                        type="password"
                        placeholder="변경시에만 입력"
                        value={memberFormData.password}
                        onChange={(e) => setMemberFormData({ ...memberFormData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                      <Input
                        value={memberFormData.name}
                        onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <Input
                        value={memberFormData.phone}
                        onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <Input
                        value={memberFormData.address}
                        onChange={(e) => setMemberFormData({ ...memberFormData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                        <select
                          className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                          value={memberFormData.bank}
                          onChange={(e) => setMemberFormData({ ...memberFormData, bank: e.target.value })}
                        >
                          <option value="">은행 선택</option>
                          <option value="국민은행">국민은행</option>
                          <option value="신한은행">신한은행</option>
                          <option value="우리은행">우리은행</option>
                          <option value="하나은행">하나은행</option>
                          <option value="농협은행">농협은행</option>
                          <option value="기업은행">기업은행</option>
                          <option value="SC제일은행">SC제일은행</option>
                          <option value="케이뱅크">케이뱅크</option>
                          <option value="카카오뱅크">카카오뱅크</option>
                          <option value="토스뱅크">토스뱅크</option>
                          <option value="새마을금고">새마을금고</option>
                          <option value="우체국">우체국</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                        <Input
                          value={memberFormData.accountNumber}
                          onChange={(e) => setMemberFormData({ ...memberFormData, accountNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={memberFormData.isActive}
                          onChange={(e) => setMemberFormData({ ...memberFormData, isActive: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">활성 회원</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={memberFormData.isAdmin}
                          onChange={(e) => setMemberFormData({ ...memberFormData, isAdmin: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">관리자 권한</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">메모 (담당자 등록)</label>
                      <Textarea
                        placeholder="담당자명 또는 메모 입력"
                        value={memberFormData.memo}
                        onChange={(e) => setMemberFormData({ ...memberFormData, memo: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => handleUpdateMember(editingMemberId)} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                    <Button variant="outline" onClick={() => { setShowEditMemberModal(false); setEditingMemberId(null); }}>취소</Button>
                  </div>
                </div>
              </div>
            )}

            {members.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3 text-sm">등록된 회원이 없습니다.</p>
                <Button size="sm" onClick={() => setShowAddMemberForm(true)} variant="outline">회원 추가하기</Button>
              </div>
            ) : (() => {
              const totalPages = Math.ceil(members.length / itemsPerPage);
              const paginatedMembers = members.slice(memberPage * itemsPerPage, (memberPage + 1) * itemsPerPage);
              
              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">이름</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">아이디</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">전화번호</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">포인트</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">상태</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">메모</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">가입일</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50" data-testid={`row-member-${member.id}`}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-900">{member.name}</span>
                                {member.isAdmin && <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs">관리자</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{member.username}</td>
                            <td className="px-3 py-2 text-gray-600">{member.phone || "-"}</td>
                            <td className="px-3 py-2 text-right font-bold text-amber-600">{((member as any).pointBalance || 0).toLocaleString()}P</td>
                            <td className="px-3 py-2 text-center">
                              {(member as any).isFrozen ? (
                                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><Snowflake className="w-3 h-3" />동결</span>
                              ) : member.isActive ? (
                                <span className="text-xs text-green-600">활성</span>
                              ) : (
                                <span className="text-xs text-gray-400">비활성</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {editingMemoId === member.id ? (
                                <div className="flex items-center gap-1">
                                  <Input value={memoValue} onChange={(e) => setMemoValue(e.target.value)} className="h-7 text-xs w-32" placeholder="담당자명 등" />
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleSaveMemo(member.id)}><CheckCircle className="w-3.5 h-3.5" /></Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400" onClick={() => setEditingMemoId(null)}><XCircle className="w-3.5 h-3.5" /></Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setEditingMemoId(member.id); setMemoValue(member.memo || ""); }}>
                                  <span className="text-xs text-gray-600">{member.memo || <span className="text-gray-300">클릭하여 입력</span>}</span>
                                  <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('ko-KR') : "-"}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedMemberForAction(member.id); setActionType("adjust"); setAdjustAmount(""); }} className="h-7 w-7 p-0 text-amber-600"><Wallet className="w-3.5 h-3.5" /></Button>
                                {(member as any).isFrozen ? (
                                  <Button size="sm" variant="ghost" onClick={() => handleUnfreezeMember(member.id)} className="h-7 w-7 p-0 text-blue-600"><Unlock className="w-3.5 h-3.5" /></Button>
                                ) : (
                                  <Button size="sm" variant="ghost" onClick={() => { setSelectedMemberForAction(member.id); setActionType("freeze"); setFreezeReason(""); }} className="h-7 w-7 p-0 text-cyan-600"><Snowflake className="w-3.5 h-3.5" /></Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => startEditMember(member)} className="h-7 w-7 p-0" data-testid={`button-edit-member-${member.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteMember(member.id)} className="h-7 w-7 p-0 text-red-500" data-testid={`button-delete-member-${member.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">총 {members.length}명 중 {memberPage * itemsPerPage + 1}-{Math.min((memberPage + 1) * itemsPerPage, members.length)}명</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={memberPage === 0} onClick={() => setMemberPage(p => p - 1)}>이전</Button>
                        <span className="px-3 py-1 text-sm">{memberPage + 1} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={memberPage >= totalPages - 1} onClick={() => setMemberPage(p => p + 1)}>다음</Button>
                      </div>
                    </div>
                  )}

                  {selectedMemberForAction && actionType === "adjust" && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-bold text-sm mb-2">포인트 조정 - {members.find(m => m.id === selectedMemberForAction)?.name}</h4>
                      <div className="flex gap-2 flex-wrap">
                        <Input type="number" placeholder="금액 (음수 가능)" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="w-32" />
                        <Input placeholder="사유 (선택)" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-48" />
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => handleAdjustPoints(selectedMemberForAction)}>적용</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedMemberForAction(null); setActionType(null); setAdjustReason(""); }}>취소</Button>
                      </div>
                    </div>
                  )}

                  {selectedMemberForAction && actionType === "freeze" && (
                    <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <h4 className="font-bold text-sm mb-2">계정 동결 - {members.find(m => m.id === selectedMemberForAction)?.name}</h4>
                      <div className="flex gap-2">
                        <Input placeholder="동결 사유" value={freezeReason} onChange={(e) => setFreezeReason(e.target.value)} className="max-w-xs" />
                        <Button size="sm" variant="destructive" onClick={() => handleFreezeMember(selectedMemberForAction)}>동결</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedMemberForAction(null); setActionType(null); }}>취소</Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">주문 관리</h2>
                <p className="text-gray-500 text-sm">
                  {orderFilter === "all" 
                    ? `전체 ${adminOrders.length}건` 
                    : `${orderFilter} 상태 ${adminOrders.filter(o => o.status === orderFilter).length}건`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름/아이디/주문번호 검색"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-order-search"
                  />
                </div>
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value as typeof orderFilter)}
                >
                  <option value="all">전체 보기</option>
                  <option value="pending">대기중</option>
                  <option value="confirmed">확인됨</option>
                  <option value="shipped">배송중</option>
                  <option value="delivered">배송완료</option>
                  <option value="cancelled">취소됨</option>
                </select>
                <Button variant="outline" onClick={fetchOrders}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12 text-gray-500">주문 내역을 불러오는 중...</div>
            ) : adminOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">주문 내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">상품</th>
                      <th className="px-2 py-1.5 text-left font-medium">주문번호</th>
                      <th className="px-2 py-1.5 text-left font-medium">주문자</th>
                      <th className="px-2 py-1.5 text-right font-medium">금액</th>
                      <th className="px-2 py-1.5 text-center font-medium">일시</th>
                      <th className="px-2 py-1.5 text-center font-medium">상태</th>
                      <th className="px-2 py-1.5 text-center font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders
                      .filter(order => orderFilter === "all" || order.status === orderFilter)
                      .filter(order => {
                        if (!orderSearch.trim()) return true;
                        const search = orderSearch.toLowerCase();
                        return order.memberName?.toLowerCase().includes(search) || 
                               order.orderNumber?.toLowerCase().includes(search) ||
                               (order as any).memberUsername?.toLowerCase().includes(search);
                      })
                      .map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className={`border-t border-gray-200 ${order.status === "pending" ? "bg-yellow-50/50" : ""}`}>
                          <td className="px-2 py-1.5 max-w-[150px]">
                            <span className="line-clamp-1 font-medium" title={order.productName}>{order.productName}</span>
                          </td>
                          <td className="px-2 py-1.5 text-gray-600">{order.orderNumber}</td>
                          <td className="px-2 py-1.5">
                            <span className="font-medium">{order.memberName}</span>
                            {(order as any).memberUsername && <span className="text-gray-400 ml-1">({(order as any).memberUsername})</span>}
                          </td>
                          <td className="px-2 py-1.5 text-right font-bold text-amber-600">{Number(order.totalAmount).toLocaleString()}원</td>
                          <td className="px-2 py-1.5 text-center text-gray-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                                order.status === "shipped" ? "bg-purple-100 text-purple-700" :
                                order.status === "delivered" ? "bg-green-100 text-green-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {order.status === "pending" ? "대기" : order.status === "confirmed" ? "확인" : order.status === "shipped" ? "배송" : order.status === "delivered" ? "완료" : "취소"}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${order.paymentStatus === "paid" || order.paymentStatus === "completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                {order.paymentStatus === "paid" || order.paymentStatus === "completed" ? "결제" : "미결제"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openOrderDetail(order)} data-testid={`button-order-detail-${order.id}`}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <select className="h-6 px-1 text-xs border rounded" value={order.status || "pending"} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}>
                                <option value="pending">대기</option>
                                <option value="confirmed">확인</option>
                                <option value="shipped">배송</option>
                                <option value="delivered">완료</option>
                                <option value="cancelled">취소</option>
                              </select>
                              <select className="h-6 px-1 text-xs border rounded" value={order.paymentStatus || "pending"} onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}>
                                <option value="pending">미결</option>
                                <option value="paid">결제</option>
                                <option value="refunded">환불</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                        <tr className={`${order.status === "pending" ? "bg-yellow-50/50" : ""}`}>
                          <td colSpan={7} className="px-2 py-1 text-gray-500 border-b border-gray-100">
                            <span className="text-gray-400">배송:</span> {order.shippingName} ({order.shippingPhone}) | {order.quantity}개 | {order.shippingAddress?.substring(0, 30)}...
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showOrderDetailModal && selectedOrder && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xl">주문 상세 정보</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowOrderDetailModal(false); setSelectedOrder(null); setEditingOrder(false); }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">주문번호: {selectedOrder.orderNumber}</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        상품 정보
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><strong>상품명:</strong> {selectedOrder.productName}</p>
                        <p><strong>수량:</strong> {selectedOrder.quantity}개</p>
                        <p><strong>단가:</strong> {Number(selectedOrder.productPrice).toLocaleString()}원</p>
                        <p><strong>총액:</strong> <span className="text-lg font-bold text-amber-600">{Number(selectedOrder.totalAmount).toLocaleString()}원</span></p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        주문자 정보
                      </h4>
                      {editingOrder ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                            <Input
                              value={orderEditData.memberName}
                              onChange={(e) => setOrderEditData({ ...orderEditData, memberName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                            <Input
                              value={orderEditData.memberEmail}
                              onChange={(e) => setOrderEditData({ ...orderEditData, memberEmail: e.target.value })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                            <Input
                              value={orderEditData.memberPhone}
                              onChange={(e) => setOrderEditData({ ...orderEditData, memberPhone: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p><strong>이름:</strong> {selectedOrder.memberName}</p>
                          <p><strong>이메일:</strong> {selectedOrder.memberEmail}</p>
                          <p><strong>연락처:</strong> {selectedOrder.memberPhone}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        배송지 정보
                      </h4>
                      {editingOrder ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">수령인</label>
                              <Input
                                value={orderEditData.shippingName}
                                onChange={(e) => setOrderEditData({ ...orderEditData, shippingName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                              <Input
                                value={orderEditData.shippingPhone}
                                onChange={(e) => setOrderEditData({ ...orderEditData, shippingPhone: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">우편번호</label>
                            <Input
                              value={orderEditData.shippingZipcode}
                              onChange={(e) => setOrderEditData({ ...orderEditData, shippingZipcode: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">주소</label>
                            <Input
                              value={orderEditData.shippingAddress}
                              onChange={(e) => setOrderEditData({ ...orderEditData, shippingAddress: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">상세주소</label>
                            <Input
                              value={orderEditData.shippingAddressDetail}
                              onChange={(e) => setOrderEditData({ ...orderEditData, shippingAddressDetail: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">배송 메모</label>
                            <Input
                              value={orderEditData.shippingMemo}
                              onChange={(e) => setOrderEditData({ ...orderEditData, shippingMemo: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p><strong>수령인:</strong> {selectedOrder.shippingName}</p>
                          <p><strong>연락처:</strong> {selectedOrder.shippingPhone}</p>
                          <p><strong>우편번호:</strong> {selectedOrder.shippingZipcode || "-"}</p>
                          <p><strong>주소:</strong> {selectedOrder.shippingAddress}</p>
                          <p><strong>상세주소:</strong> {selectedOrder.shippingAddressDetail || "-"}</p>
                          <p><strong>배송 메모:</strong> {selectedOrder.shippingMemo || "-"}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-bold mb-3">관리자 메모</h4>
                      {editingOrder ? (
                        <Textarea
                          placeholder="관리자 메모 입력"
                          value={orderEditData.adminNote}
                          onChange={(e) => setOrderEditData({ ...orderEditData, adminNote: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm">{selectedOrder.adminNote || "메모 없음"}</p>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      <p>주문일시: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("ko-KR") : "-"}</p>
                      <p>최종수정: {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString("ko-KR") : "-"}</p>
                    </div>
                  </div>

                  <div className="p-6 border-t flex justify-end gap-2">
                    {editingOrder ? (
                      <>
                        <Button variant="outline" onClick={() => setEditingOrder(false)}>취소</Button>
                        <Button className="bg-yellow-500 hover:bg-yellow-600" onClick={handleSaveOrderEdit}>저장</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => { setShowOrderDetailModal(false); setSelectedOrder(null); }}>닫기</Button>
                        <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => setEditingOrder(true)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "deposits" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">포인트충전 신청 관리</h2>
                <p className="text-gray-500 text-sm">
                  {depositFilter === "all" ? `전체 ${depositRequests.length}건` :
                   depositFilter === "pending" ? `대기중 ${depositRequests.length}건` :
                   depositFilter === "approved" ? `승인됨 ${depositRequests.length}건` :
                   `거부됨 ${depositRequests.length}건`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름 또는 금액 검색"
                    value={depositSearch}
                    onChange={(e) => setDepositSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-deposit-search"
                  />
                </div>
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  value={depositFilter}
                  onChange={(e) => setDepositFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
                >
                  <option value="all">전체 내역</option>
                  <option value="pending">대기중</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">거부됨</option>
                </select>
                <Button variant="outline" onClick={fetchDepositRequests}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            {(() => {
              const filteredDeposits = depositRequests.filter((request) => {
                if (!depositSearch.trim()) return true;
                const search = depositSearch.toLowerCase();
                return request.memberName?.toLowerCase().includes(search) || request.depositorName?.toLowerCase().includes(search) || request.amount?.toString().includes(search);
              });
              const totalPages = Math.ceil(filteredDeposits.length / itemsPerPage);
              const paginatedDeposits = filteredDeposits.slice(depositPage * itemsPerPage, (depositPage + 1) * itemsPerPage);
              
              if (filteredDeposits.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {depositFilter === "all" ? "충전 신청 내역이 없습니다." : depositFilter === "pending" ? "대기 중인 충전 신청이 없습니다." : depositFilter === "approved" ? "승인된 충전 내역이 없습니다." : "거부된 충전 내역이 없습니다."}
                  </div>
                );
              }
              
              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">회원</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">입금자</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-600">금액</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">상태</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">신청일</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-600">처리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedDeposits.map((request) => (
                          <tr key={request.id} className={`${request.status === "pending" ? "bg-yellow-50" : request.status === "approved" ? "bg-green-50/50" : "bg-red-50/50"}`}>
                            <td className="px-3 py-2"><span className="font-medium">{request.memberName}</span></td>
                            <td className="px-3 py-2 text-gray-600">{request.depositorName}{request.bankName && request.bankName !== "카카오톡문의" && <span className="text-gray-400 text-xs ml-1">({request.bankName})</span>}</td>
                            <td className="px-3 py-2 text-right font-bold text-blue-600">{request.amount.toLocaleString()}원</td>
                            <td className="px-3 py-2 text-center">
                              {request.status === "pending" ? <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">대기</span> : request.status === "approved" ? <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">승인</span> : <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">거부</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{new Date(request.requestedAt).toLocaleDateString('ko-KR')}</td>
                            <td className="px-3 py-2 text-center">
                              {request.status === "pending" ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600" onClick={() => handleApproveDeposit(request.id)}><CheckCircle className="w-3.5 h-3.5 mr-1" />승인</Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600" onClick={() => handleRejectDeposit(request.id)}><XCircle className="w-3.5 h-3.5 mr-1" />거부</Button>
                                </div>
                              ) : <span className="text-xs text-gray-400">처리완료</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">총 {filteredDeposits.length}건</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={depositPage === 0} onClick={() => setDepositPage(p => p - 1)}>이전</Button>
                        <span className="px-3 py-1 text-sm">{depositPage + 1} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={depositPage >= totalPages - 1} onClick={() => setDepositPage(p => p + 1)}>다음</Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">포인트환급 신청 관리</h2>
                <p className="text-gray-500 text-sm">
                  {withdrawalFilter === "all" ? `전체 ${withdrawalRequests.length}건` :
                   withdrawalFilter === "pending" ? `대기중 ${withdrawalRequests.length}건` :
                   withdrawalFilter === "approved" ? `승인됨 ${withdrawalRequests.length}건` :
                   `거부됨 ${withdrawalRequests.length}건`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름 또는 금액 검색"
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-withdrawal-search"
                  />
                </div>
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  value={withdrawalFilter}
                  onChange={(e) => setWithdrawalFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
                >
                  <option value="all">전체 내역</option>
                  <option value="pending">대기중</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">거부됨</option>
                </select>
                <Button variant="outline" onClick={fetchWithdrawalRequests}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            {(() => {
              const filteredWithdrawals = withdrawalRequests.filter((request) => {
                if (!withdrawalSearch.trim()) return true;
                const search = withdrawalSearch.toLowerCase();
                return request.memberName?.toLowerCase().includes(search) || request.amount?.toString().includes(search);
              });
              const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
              const paginatedWithdrawals = filteredWithdrawals.slice(withdrawalPage * itemsPerPage, (withdrawalPage + 1) * itemsPerPage);
              
              if (filteredWithdrawals.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {withdrawalFilter === "all" ? "환급 신청 내역이 없습니다." : withdrawalFilter === "pending" ? "대기 중인 환급 신청이 없습니다." : withdrawalFilter === "approved" ? "승인된 환급 내역이 없습니다." : "거부된 환급 내역이 없습니다."}
                  </div>
                );
              }
              
              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium text-gray-600 text-xs">아이디</th>
                          <th className="px-2 py-2 text-left font-medium text-gray-600 text-xs">이름</th>
                          <th className="px-2 py-2 text-left font-medium text-gray-600 text-xs">계좌정보 (은행/계좌/예금주/생년월일)</th>
                          <th className="px-2 py-2 text-right font-medium text-gray-600 text-xs">금액</th>
                          <th className="px-2 py-2 text-center font-medium text-gray-600 text-xs">일시</th>
                          <th className="px-2 py-2 text-center font-medium text-gray-600 text-xs">상태</th>
                          <th className="px-2 py-2 text-center font-medium text-gray-600 text-xs">처리</th>
                        </tr>
                      </thead>
                      {paginatedWithdrawals.map((request) => (
                        <tbody key={request.id}>
                          <tr className={`border-t border-gray-200 ${request.status === "pending" ? "bg-yellow-50" : request.status === "approved" ? "bg-green-50/50" : "bg-red-50/50"}`}>
                            <td className="px-2 py-1.5 text-xs text-gray-600">{request.memberId || "-"}</td>
                            <td className="px-2 py-1.5 text-xs font-medium">{request.memberName}</td>
                            <td className="px-2 py-1.5 text-xs text-gray-600">
                              {request.bankName || "-"} / {request.accountNumber || "-"} / {request.accountHolder || "-"} / {request.birthdate || "-"}
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold text-orange-600 text-xs">{request.amount.toLocaleString()}원</td>
                            <td className="px-2 py-1.5 text-center text-xs text-gray-500">{new Date(request.requestedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-2 py-1.5 text-center">
                              {request.status === "pending" ? <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">대기</span> : request.status === "approved" ? <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">승인</span> : <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">거부</span>}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {request.status === "pending" ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-green-600 text-xs" onClick={() => handleApproveWithdrawal(request.id)}><CheckCircle className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-600 text-xs" onClick={() => handleRejectWithdrawal(request.id)}><XCircle className="w-3 h-3" /></Button>
                                </div>
                              ) : <span className="text-xs text-gray-400">완료</span>}
                            </td>
                          </tr>
                          {request.adminNote && (
                            <tr className={`${request.status === "pending" ? "bg-yellow-50" : request.status === "approved" ? "bg-green-50/50" : "bg-red-50/50"}`}>
                              <td colSpan={7} className="px-2 py-1 text-xs text-gray-500 border-b border-gray-100">
                                <span className="text-gray-400">메모:</span> {request.adminNote}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      ))}
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">총 {filteredWithdrawals.length}건</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" disabled={withdrawalPage === 0} onClick={() => setWithdrawalPage(p => p - 1)}>이전</Button>
                        <span className="px-3 py-1 text-sm">{withdrawalPage + 1} / {totalPages}</span>
                        <Button size="sm" variant="outline" disabled={withdrawalPage >= totalPages - 1} onClick={() => setWithdrawalPage(p => p + 1)}>다음</Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "points" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">포인트 관리</h2>
              <p className="text-gray-500 text-sm">회원 포인트를 직접 추가하거나 차감할 수 있습니다</p>
            </div>

            <div id="point-adjust-form" className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
              <h3 className="font-bold text-lg mb-4">포인트 지급/차감</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">회원 선택 *</label>
                  <Input
                    placeholder="이름 또는 아이디로 검색..."
                    value={pointMemberSearch}
                    onChange={(e) => setPointMemberSearch(e.target.value)}
                    className="mb-2"
                    data-testid="input-point-member-search"
                  />
                  <select
                    className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                    value={pointMemberId}
                    onChange={(e) => setPointMemberId(e.target.value)}
                    data-testid="select-point-member"
                  >
                    <option value="">회원을 선택하세요 ({members.filter(m => 
                      !pointMemberSearch || 
                      m.name.toLowerCase().includes(pointMemberSearch.toLowerCase()) ||
                      m.username.toLowerCase().includes(pointMemberSearch.toLowerCase())
                    ).length}명)</option>
                    {members
                      .filter(m => 
                        !pointMemberSearch || 
                        m.name.toLowerCase().includes(pointMemberSearch.toLowerCase()) ||
                        m.username.toLowerCase().includes(pointMemberSearch.toLowerCase())
                      )
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.username}) - 현재: {(member.pointBalance || 0).toLocaleString()}P
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 유형 *</label>
                  <select
                    className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                    value={pointAction}
                    onChange={(e) => setPointAction(e.target.value as "add" | "subtract")}
                    data-testid="select-point-action"
                  >
                    <option value="add">포인트 지급 (+)</option>
                    <option value="subtract">포인트 차감 (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원) *</label>
                  <Input
                    type="number"
                    placeholder="금액 입력"
                    value={pointAmount}
                    onChange={(e) => setPointAmount(e.target.value)}
                    data-testid="input-point-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                  <Input
                    placeholder="예: 이벤트 지급, 오류 보정 등"
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    data-testid="input-point-reason"
                  />
                </div>
              </div>
              <Button
                className={pointAction === "add" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                onClick={async () => {
                  if (!pointMemberId || !pointAmount) {
                    toast({ title: "오류", description: "회원과 금액을 입력해주세요.", variant: "destructive" });
                    return;
                  }
                  try {
                    const res = await fetchWithAuth("/api/admin/points/adjust", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        memberId: pointMemberId,
                        amount: parseInt(pointAmount),
                        action: pointAction,
                        reason: pointReason || (pointAction === "add" ? "관리자 지급" : "관리자 차감"),
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast({ 
                        title: "성공", 
                        description: `${pointAction === "add" ? "포인트가 지급" : "포인트가 차감"}되었습니다.` 
                      });
                      setPointMemberId("");
                      setPointAmount("");
                      setPointReason("");
                      fetchMembers();
                      fetchPointTransactions();
                    } else {
                      toast({ title: "오류", description: data.error || "포인트 처리에 실패했습니다.", variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "오류", description: "포인트 처리에 실패했습니다.", variant: "destructive" });
                  }
                }}
                data-testid="button-adjust-point"
              >
                {pointAction === "add" ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    포인트 지급
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    포인트 차감
                  </>
                )}
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">회원별 포인트 현황</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름/아이디 검색"
                    value={pointMemberListSearch}
                    onChange={(e) => setPointMemberListSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {members
                  .filter(m => !pointMemberListSearch || m.name.toLowerCase().includes(pointMemberListSearch.toLowerCase()) || m.username.toLowerCase().includes(pointMemberListSearch.toLowerCase()))
                  .map((member) => (
                  <div 
                    key={member.id} 
                    onClick={() => {
                      if (selectedMemberForHistory === member.id) {
                        setSelectedMemberForHistory(null);
                      } else {
                        setSelectedMemberForHistory(member.id);
                      }
                      setPointPage(0);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${selectedMemberForHistory === member.id ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.username}</p>
                      </div>
                    </div>
                    <p className="font-bold text-amber-600 text-sm flex-shrink-0">{(member.pointBalance || 0).toLocaleString()}P</p>
                  </div>
                ))}
              </div>
              {selectedMemberForHistory && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-amber-800">
                    <strong>{members.find(m => m.id === selectedMemberForHistory)?.name}</strong> 님의 내역만 표시 중
                  </span>
                  <Button size="sm" variant="ghost" className="h-7 text-amber-600" onClick={() => { setSelectedMemberForHistory(null); setPointPage(0); }}>
                    필터 해제
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-lg mb-4">포인트 내역</h3>
              
              <PointSearchPanel
                onSearch={(filters) => {
                  setPointSearchFilters(filters);
                  setPointPage(0);
                  fetchPointTransactions(filters);
                }}
                onReset={() => {
                  setPointSearchFilters(null);
                  setPointPage(0);
                  fetchPointTransactions();
                }}
                isLoading={loading}
              />
              
              {(() => {
                const filteredTx = selectedMemberForHistory 
                  ? pointTransactions.filter(tx => tx.memberId === selectedMemberForHistory)
                  : pointTransactions;
                const totalPages = Math.ceil(filteredTx.length / itemsPerPage);
                const safePage = Math.min(pointPage, Math.max(0, totalPages - 1));
                const paginatedTx = filteredTx.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);
                
                if (filteredTx.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <p>{selectedMemberForHistory ? "해당 회원의 포인트 내역이 없습니다." : "포인트 내역이 없습니다."}</p>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">날짜</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">시간</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">아이디</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">이름</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">내용</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">금액</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">잔액</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedTx.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50" data-testid={`row-point-tx-${tx.id}`}>
                              <td className="px-3 py-2 text-gray-600 text-xs">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ko-KR') : '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-600 text-xs">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="px-3 py-2">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                  onClick={() => {
                                    setPointMemberId(tx.memberId);
                                    document.getElementById('point-adjust-form')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  title="클릭하여 이 회원 선택"
                                >
                                  {tx.memberUsername || '-'}
                                </button>
                              </td>
                              <td className="px-3 py-2">
                                <button 
                                  className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => {
                                    setPointMemberId(tx.memberId);
                                    document.getElementById('point-adjust-form')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  title="클릭하여 이 회원 선택"
                                >
                                  {tx.memberName || '-'}
                                </button>
                              </td>
                              <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{tx.description || '-'}</td>
                              <td className={`px-3 py-2 text-right font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}P
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-amber-600">{tx.balanceAfter.toLocaleString()}P</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  tx.type === 'deposit_approved' ? 'bg-blue-100 text-blue-700' :
                                  tx.type === 'withdrawal_approved' ? 'bg-orange-100 text-orange-700' :
                                  tx.type === 'admin_add' ? 'bg-purple-100 text-purple-700' :
                                  tx.type === 'admin_subtract' ? 'bg-red-100 text-red-700' :
                                  tx.type === 'manual_adjustment' ? 'bg-purple-100 text-purple-700' :
                                  tx.type === 'order_payment' || tx.type === 'use' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {tx.type === 'deposit_approved' ? '충전' :
                                   tx.type === 'withdrawal_approved' ? '출금' :
                                   tx.type === 'admin_add' ? '관리자 지급' :
                                   tx.type === 'admin_subtract' ? '관리자 차감' :
                                   tx.type === 'manual_adjustment' ? '관리자' :
                                   tx.type === 'order_payment' || tx.type === 'use' ? '주문' : tx.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">총 {filteredTx.length}건</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPointPage(Math.max(0, safePage - 1))}>이전</Button>
                          <span className="px-3 py-1 text-sm">{safePage + 1} / {totalPages}</span>
                          <Button size="sm" variant="outline" disabled={safePage >= totalPages - 1} onClick={() => setPointPage(Math.min(totalPages - 1, safePage + 1))}>다음</Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">후기 관리</h2>
                <p className="text-sm text-gray-500">고객 후기를 추가/수정할 수 있습니다 (날짜, 이름 등 조작 가능)</p>
              </div>
              <Button
                data-testid="button-add-review"
                onClick={() => {
                  setShowAddReviewForm(true);
                  setReviewFormData({ authorName: "", productName: "", rating: 5, title: "", content: "", imageUrl: "", isVisible: true, displayDate: new Date().toISOString().slice(0, 16) });
                }}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                후기 추가
              </Button>
            </div>

            {showAddReviewForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border">
                <h3 className="font-bold mb-4">새 후기 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성자 이름</label>
                    <Input
                      value={reviewFormData.authorName}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, authorName: e.target.value })}
                      placeholder="홍길동"
                      data-testid="input-review-author"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상품명 (선택)</label>
                    <Input
                      value={reviewFormData.productName}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, productName: e.target.value })}
                      placeholder="상품 중량"
                      data-testid="input-review-product"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
                    <select
                      value={reviewFormData.rating}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, rating: Number(e.target.value) })}
                      className="w-full h-10 px-3 border rounded-md"
                      data-testid="select-review-rating"
                    >
                      <option value={5}>5점</option>
                      <option value={4}>4점</option>
                      <option value={3}>3점</option>
                      <option value={2}>2점</option>
                      <option value={1}>1점</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성일 (표시용)</label>
                    <Input
                      type="datetime-local"
                      value={reviewFormData.displayDate}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, displayDate: e.target.value })}
                      data-testid="input-review-date"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <Input
                      value={reviewFormData.title}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                      placeholder="후기 제목을 입력하세요"
                      data-testid="input-review-title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <Textarea
                      value={reviewFormData.content}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, content: e.target.value })}
                      placeholder="후기 내용을 입력하세요"
                      rows={4}
                      data-testid="input-review-content"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이미지</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          <span className="text-sm">{uploadingImage ? "업로드 중..." : "파일 선택"}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                            data-testid="input-review-image-file"
                          />
                        </label>
                        <span className="text-xs text-gray-500">또는 URL 직접 입력</span>
                      </div>
                      <Input
                        value={reviewFormData.imageUrl}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, imageUrl: e.target.value })}
                        placeholder="https://... 또는 파일 업로드"
                        data-testid="input-review-image"
                      />
                      {reviewFormData.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={reviewFormData.imageUrl} 
                            alt="미리보기" 
                            className="max-w-[200px] max-h-[150px] object-cover rounded border"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reviewFormData.isVisible}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, isVisible: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-review-visible"
                      />
                      <span className="text-sm">공개</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateReview} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-save-review">
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddReviewForm(false)} data-testid="button-cancel-review">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">작성자</th>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">내용</th>
                    <th className="px-4 py-3 text-left font-medium">별점</th>
                    <th className="px-4 py-3 text-left font-medium">작성일</th>
                    <th className="px-4 py-3 text-left font-medium">공개</th>
                    <th className="px-4 py-3 text-left font-medium">승인</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      {editingReviewId === review.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={reviewFormData.authorName}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, authorName: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={reviewFormData.title}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Textarea
                              value={reviewFormData.content}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, content: e.target.value })}
                              className="min-h-[60px] text-sm"
                              rows={2}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={reviewFormData.rating}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, rating: Number(e.target.value) })}
                              className="h-8 px-2 border rounded"
                            >
                              <option value={5}>5점</option>
                              <option value={4}>4점</option>
                              <option value={3}>3점</option>
                              <option value={2}>2점</option>
                              <option value={1}>1점</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="datetime-local"
                              value={reviewFormData.displayDate}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, displayDate: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={reviewFormData.isVisible}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, isVisible: e.target.checked })}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm ${review.isApproved ? 'text-green-600' : 'text-gray-400'}`}>
                              {review.isApproved ? '승인됨' : '대기중'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <Button 
                              onClick={() => handleUpdateReview(review.id)} 
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                              data-testid="button-save-review-edit"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              저장
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingReviewId(null)} 
                              className="h-8 px-3"
                              data-testid="button-cancel-review-edit"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{review.authorName}</td>
                          <td className="px-4 py-3">{review.title}</td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex text-yellow-400">
                              {[...Array(review.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">
                            {review.displayDate ? new Date(review.displayDate).toLocaleDateString('ko-KR') : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {review.isVisible ? (
                              <span className="text-green-600 text-sm">공개</span>
                            ) : (
                              <span className="text-gray-400 text-sm">비공개</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {review.isApproved ? (
                              <span className="text-green-600 text-sm font-medium">승인됨</span>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveReview(review.id)} 
                                className="h-7 bg-blue-500 hover:bg-blue-600 text-white text-xs"
                                data-testid={`button-approve-review-${review.id}`}
                              >
                                승인
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEditReview(review)} className="h-8 w-8">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteReview(review.id)} className="h-8 w-8 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reviews.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>등록된 후기가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "notices" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">공지사항 관리</h2>
                <p className="text-sm text-gray-500">공지사항을 추가/수정할 수 있습니다</p>
              </div>
              <Button
                data-testid="button-add-notice"
                onClick={() => {
                  setShowAddNoticeForm(true);
                  setNoticeFormData({ title: "", content: "", category: "general", isPinned: false, isVisible: true, displayDate: new Date().toISOString().slice(0, 16), viewCount: 0 });
                }}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                공지 추가
              </Button>
            </div>

            {showAddNoticeForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border">
                <h3 className="font-bold mb-4">새 공지사항 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <Input
                      value={noticeFormData.title}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                      placeholder="공지사항 제목을 입력하세요"
                      data-testid="input-notice-title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                      value={noticeFormData.category}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, category: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                      data-testid="select-notice-category"
                    >
                      <option value="general">일반</option>
                      <option value="event">이벤트</option>
                      <option value="system">시스템</option>
                      <option value="important">중요</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성일 (표시용)</label>
                    <Input
                      type="datetime-local"
                      value={noticeFormData.displayDate}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, displayDate: e.target.value })}
                      data-testid="input-notice-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">조회수</label>
                    <Input
                      type="number"
                      min="0"
                      value={noticeFormData.viewCount}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, viewCount: parseInt(e.target.value) || 0 })}
                      data-testid="input-notice-viewcount"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <Textarea
                      value={noticeFormData.content}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요"
                      rows={6}
                      data-testid="input-notice-content"
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticeFormData.isPinned}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, isPinned: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-notice-pinned"
                      />
                      <span className="text-sm">상단 고정</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticeFormData.isVisible}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, isVisible: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-notice-visible"
                      />
                      <span className="text-sm">공개</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateNotice} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-save-notice">
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddNoticeForm(false)} data-testid="button-cancel-notice">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">카테고리</th>
                    <th className="px-4 py-3 text-left font-medium">작성일</th>
                    <th className="px-4 py-3 text-left font-medium">조회수</th>
                    <th className="px-4 py-3 text-left font-medium">상태</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      {editingNoticeId === notice.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={noticeFormData.title}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={noticeFormData.category}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, category: e.target.value })}
                              className="h-8 px-2 border rounded"
                            >
                              <option value="general">일반</option>
                              <option value="event">이벤트</option>
                              <option value="system">시스템</option>
                              <option value="important">중요</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="datetime-local"
                              value={noticeFormData.displayDate}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, displayDate: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              value={noticeFormData.viewCount}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, viewCount: parseInt(e.target.value) || 0 })}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={noticeFormData.isPinned}
                                  onChange={(e) => setNoticeFormData({ ...noticeFormData, isPinned: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs">고정</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={noticeFormData.isVisible}
                                  onChange={(e) => setNoticeFormData({ ...noticeFormData, isVisible: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs">공개</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <Button 
                              onClick={() => handleUpdateNotice(notice.id)} 
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                              data-testid="button-save-notice-edit"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              저장
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingNoticeId(null)} 
                              className="h-8 px-3"
                              data-testid="button-cancel-notice-edit"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {notice.isPinned && <span className="text-red-500 text-xs font-bold">[고정]</span>}
                              <span className="font-medium">{notice.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              notice.category === "important" ? "bg-red-100 text-red-700" :
                              notice.category === "event" ? "bg-green-100 text-green-700" :
                              notice.category === "system" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {notice.category === "general" ? "일반" :
                               notice.category === "event" ? "이벤트" :
                               notice.category === "system" ? "시스템" : "중요"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">
                            {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString('ko-KR') : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{notice.viewCount || 0}</td>
                          <td className="px-4 py-3">
                            {notice.isVisible ? (
                              <span className="text-green-600 text-sm">공개</span>
                            ) : (
                              <span className="text-gray-400 text-sm">비공개</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEditNotice(notice)} className="h-8 w-8">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteNotice(notice.id)} className="h-8 w-8 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {notices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>등록된 공지사항이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-yellow-600" />
                      실시간 1:1 상담
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">고객과 실시간으로 상담하세요.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className={`w-3 h-3 ${isChatConnected ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"}`} />
                    <span className="text-sm text-gray-600">
                      {isChatConnected ? "연결됨" : "연결 끊김"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 350px)", minHeight: "500px" }}>
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700">상담 목록</h4>
                  </div>
                  {chatConversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">아직 상담 요청이 없습니다</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {chatConversations.map((conv) => (
                        <div
                          key={conv.id}
                          data-testid={`chat-conversation-${conv.id}`}
                          onClick={() => selectConversation(conv)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-yellow-50 border-l-4 border-yellow-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {conv.guestName || conv.memberId || "익명"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  conv.status === "open" 
                                    ? "bg-green-100 text-green-700" 
                                    : conv.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                  {conv.status === "open" ? "진행중" : conv.status === "pending" ? "대기중" : "종료"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">{conv.subject}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString("ko-KR") : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {selectedConversation.guestName || selectedConversation.memberId || "익명"}
                          </h4>
                          <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                        </div>
                        {selectedConversation.status !== "closed" && (
                          <Button
                            data-testid="button-close-conversation"
                            variant="outline"
                            size="sm"
                            onClick={() => closeConversation(selectedConversation.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            상담 종료
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            data-testid={`chat-message-${msg.id}`}
                            className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.senderType === "admin" 
                                ? "bg-yellow-500 text-black" 
                                : "bg-white text-gray-900 border border-gray-200"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.senderType === "admin" ? "text-yellow-900" : "text-gray-400"
                              }`}>
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatMessagesEndRef} />
                      </div>
                      
                      {selectedConversation.status !== "closed" && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <Input
                              data-testid="input-chat-message"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="메시지를 입력하세요..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendChatMessage();
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              data-testid="button-send-message"
                              onClick={sendChatMessage}
                              disabled={!newMessage.trim() || !isChatConnected}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">상담을 선택하세요</p>
                        <p className="text-sm mt-1">왼쪽 목록에서 상담을 클릭하여 대화를 시작하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-yellow-600" />
                  사이트 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">카카오톡 문의 링크 및 사이트 설정을 관리합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
                        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.83 5.33 4.56 6.78-.12.47-.44 1.75-.51 2.02-.08.32.12.64.46.64.25 0 .5-.11.67-.27.11-.1 1.41-1.14 2.1-1.7.56.07 1.14.11 1.72.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">카카오톡 문의 링크</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        사이트 전체의 "카카오톡 문의" 버튼을 눌렀을 때 이동할 카카오톡 오픈채팅 링크를 설정합니다.
                      </p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            data-testid="input-kakao-link"
                            type="url"
                            value={siteSettings.kakaoTalkLink}
                            onChange={(e) => setSiteSettings(prev => ({ ...prev, kakaoTalkLink: e.target.value }))}
                            placeholder="https://open.kakao.com/o/your-link"
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            예: https://open.kakao.com/o/samplelink 형식의 오픈채팅 링크를 입력하세요.
                          </p>
                        </div>
                        <Button
                          data-testid="button-save-kakao-link"
                          onClick={saveSiteSettings}
                          disabled={settingsLoading}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          {settingsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "저장"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    현재 설정된 링크
                  </h4>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono truncate">
                      {siteSettings.kakaoTalkLink || "설정된 링크 없음"}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(siteSettings.kakaoTalkLink, "_blank")}
                      disabled={!siteSettings.kakaoTalkLink}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      테스트
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">도움말</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>카카오톡 오픈채팅 링크는 카카오톡 앱에서 생성할 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>링크 변경 시 사이트 전체의 모든 "카카오톡 문의" 버튼에 즉시 반영됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>올바른 URL 형식인지 "테스트" 버튼으로 확인하세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  입금 계좌 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">회원들이 입금신청 시 안내받을 계좌 정보를 설정합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">은행명</label>
                      <Input
                        data-testid="input-deposit-bank"
                        type="text"
                        value={depositAccountSettings.bankName}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="예: 국민은행"
                        className="w-full max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                      <Input
                        data-testid="input-deposit-account-number"
                        type="text"
                        value={depositAccountSettings.accountNumber}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="예: 123-456-789012"
                        className="w-full max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                      <Input
                        data-testid="input-deposit-holder"
                        type="text"
                        value={depositAccountSettings.accountHolder}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, accountHolder: e.target.value }))}
                        placeholder="예: Estella"
                        className="w-full max-w-md"
                      />
                    </div>
                    <Button
                      data-testid="button-save-deposit-account"
                      onClick={saveDepositAccountSettings}
                      disabled={depositAccountLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {depositAccountLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      저장
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    현재 설정된 계좌
                  </h4>
                  {depositAccountSettings.bankName && depositAccountSettings.accountNumber ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">은행:</span>
                        <span className="font-medium">{depositAccountSettings.bankName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">계좌:</span>
                        <span className="font-medium">{depositAccountSettings.accountNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">예금주:</span>
                        <span className="font-medium">{depositAccountSettings.accountHolder}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">설정된 계좌가 없습니다. 위에서 계좌 정보를 입력해주세요.</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>설정한 계좌정보는 회원 입금신청 페이지에 표시됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>계좌정보 변경 시 즉시 반영됩니다.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  상품후기 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">홈페이지 상품후기 표시 및 승인 방식을 설정합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">홈페이지 후기 표시</h4>
                        <p className="text-sm text-gray-600">홈페이지에서 상품후기 섹션을 표시합니다.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviewSettings.showOnHomepage}
                          onChange={(e) => {
                            setReviewSettings(prev => ({ ...prev, showOnHomepage: e.target.checked }));
                          }}
                          className="sr-only peer"
                          data-testid="toggle-review-show-homepage"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="border-t border-purple-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">즉시승인 모드</h4>
                          <p className="text-sm text-gray-600">OFF: 관리자 승인 후 표시 / ON: 작성 즉시 표시</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reviewSettings.instantApproval}
                            onChange={(e) => {
                              setReviewSettings(prev => ({ ...prev, instantApproval: e.target.checked }));
                            }}
                            className="sr-only peer"
                            data-testid="toggle-review-instant-approval"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    <Button
                      data-testid="button-save-review-settings"
                      onClick={saveReviewSettings}
                      disabled={reviewSettingsLoading}
                      className="bg-purple-500 hover:bg-purple-600 text-white mt-4"
                    >
                      {reviewSettingsLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      저장
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong>홈페이지 후기 표시:</strong> OFF 시 홈페이지에서 후기가 완전히 숨겨집니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong>즉시승인 모드:</strong> OFF 시 관리자가 '승인' 버튼을 눌러야만 후기가 표시됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>후기 관리 탭에서 개별 후기를 승인/숨김 처리할 수 있습니다.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "crawling" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">상품 크롤링</h2>
                <p className="text-gray-600">vivian-mall.com에서 상품을 자동으로 가져옵니다</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">전체 카테고리 크롤링</h3>
                    <p className="text-sm text-gray-600">모든 카테고리에서 상품을 한 번에 가져옵니다</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">카테고리당 상품 수:</label>
                    <Input
                      type="number"
                      value={crawlLimit}
                      onChange={(e) => setCrawlLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 20)))}
                      className="w-20"
                      min={1}
                      max={100}
                      data-testid="input-crawl-limit"
                    />
                  </div>
                  <Button
                    onClick={handleCrawlAllCategories}
                    disabled={crawlingProgress.status === 'crawling' || crawlingProgress.status === 'importing'}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold"
                    data-testid="button-crawl-all"
                  >
                    {crawlingProgress.status === 'crawling' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        크롤링 중...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        전체 크롤링 시작
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {crawlingProgress.status !== 'idle' && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    {crawlingProgress.status === 'crawling' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                    {crawlingProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {crawlingProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className={`text-sm font-medium ${
                      crawlingProgress.status === 'completed' ? 'text-green-600' : 
                      crawlingProgress.status === 'error' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {crawlingProgress.message}
                    </span>
                  </div>
                  {crawlingProgress.status === 'completed' && (
                    <div className="text-sm text-gray-600">
                      총 {crawlingProgress.crawledCount}개 크롤링, {crawlingProgress.importedCount}개 저장됨
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  카테고리별 크롤링
                </h3>
                <p className="text-sm text-gray-600 mt-1">원하는 카테고리만 선택하여 크롤링할 수 있습니다</p>
              </div>
              <div className="divide-y divide-gray-100">
                {CATEGORY_OPTIONS.map((category) => {
                  const categoryProgress = crawlingProgress.categoryProgress[category.id];
                  const isCrawling = crawlingCategory === category.id;
                  const productCount = stats?.productsByCategory?.find(p => p.id === category.id)?.count || 0;
                  
                  return (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          category.id === 'home_interior' ? 'bg-blue-100 text-blue-600' :
                          category.id === 'beauty' ? 'bg-pink-100 text-pink-600' :
                          category.id === 'electronics' ? 'bg-purple-100 text-purple-600' :
                          category.id === 'living' ? 'bg-green-100 text-green-600' :
                          category.id === 'health' ? 'bg-red-100 text-red-600' :
                          category.id === 'luxury' ? 'bg-amber-100 text-amber-600' :
                          'bg-cyan-100 text-cyan-600'
                        }`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-500">현재 {productCount}개 상품</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {categoryProgress && (
                          <div className="text-sm">
                            {categoryProgress.status === 'completed' && (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                {categoryProgress.imported}개 저장됨
                              </span>
                            )}
                            {categoryProgress.status === 'error' && (
                              <span className="text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                오류 발생
                              </span>
                            )}
                          </div>
                        )}
                        <Button
                          onClick={() => handleCrawlCategory(category.id)}
                          disabled={crawlingProgress.status === 'crawling' || crawlingProgress.status === 'importing'}
                          variant="outline"
                          size="sm"
                          className="min-w-[100px]"
                          data-testid={`button-crawl-${category.id}`}
                        >
                          {isCrawling ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              크롤링 중
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              크롤링
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                크롤링 정보
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 상품은 vivian-mall.com에서 자동으로 가져옵니다</li>
                <li>• 가격은 USD에서 KRW로 자동 변환됩니다 (환율: 1,450원)</li>
                <li>• 카테고리는 자동으로 분류됩니다</li>
                <li>• 갤러리 이미지와 상품 설명 이미지가 함께 저장됩니다</li>
              </ul>
            </div>
          </div>
        )}

        </main>
        </div>
      </div>
    </div>
  );
}
