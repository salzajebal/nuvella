import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertMemberSchema, insertChatConversationSchema, insertChatMessageSchema, insertFaqSchema, insertReviewSchema, insertNoticeSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Use memory storage to persist images in database (not ephemeral filesystem)
const reviewImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)"));
    }
  },
});

const ADMIN_USERNAME = "admin123";
const ADMIN_PASSWORD = "admin123";

const adminSessions = new Map<string, { expiresAt: Date }>();

// Crawling progress tracking
interface CrawlProgress {
  status: 'idle' | 'crawling' | 'importing' | 'completed' | 'error';
  currentCategory: string;
  currentCategoryIndex: number;
  totalCategories: number;
  productsFound: number;
  productsImported: number;
  currentProduct: string;
  message: string;
  startedAt?: Date;
  completedAt?: Date;
}

let crawlProgress: CrawlProgress = {
  status: 'idle',
  currentCategory: '',
  currentCategoryIndex: 0,
  totalCategories: 0,
  productsFound: 0,
  productsImported: 0,
  currentProduct: '',
  message: ''
};

const progressClients: Response[] = [];

function updateCrawlProgress(update: Partial<CrawlProgress>) {
  crawlProgress = { ...crawlProgress, ...update };
  // Send to all connected SSE clients
  progressClients.forEach((client, index) => {
    try {
      client.write(`data: ${JSON.stringify(crawlProgress)}\n\n`);
    } catch (e) {
      progressClients.splice(index, 1);
    }
  });
}

function resetCrawlProgress() {
  crawlProgress = {
    status: 'idle',
    currentCategory: '',
    currentCategoryIndex: 0,
    totalCategories: 0,
    productsFound: 0,
    productsImported: 0,
    currentProduct: '',
    message: ''
  };
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isValidSession(token: string): boolean {
  const session = adminSessions.get(token);
  if (!session) return false;
  if (new Date() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !isValidSession(token)) {
    return res.status(401).json({ success: false, error: "인증이 필요합니다." });
  }
  next();
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== STATIC FILE SERVING FOR UPLOADS ====================
  const express = await import("express");
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));
  
  // NOTE: WebSocket is handled in chatSocket.ts - do not create duplicate here
  
  // ==================== PRODUCTS API ====================
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category, subcategory } = req.query;
      let productList;
      
      if (category && category !== "all") {
        productList = await storage.getProductsByCategory(category as string);
        if (subcategory) {
          productList = productList.filter(p => p.subcategory === subcategory);
        }
      } else {
        productList = await storage.getAllProducts();
      }
      
      res.json({ success: true, data: productList });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
  });
  
  // Get single product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ success: false, error: "Failed to fetch product" });
    }
  });
  
  // Create product (Admin - Protected)
  app.post("/api/products", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ success: false, error: "Failed to create product" });
    }
  });
  
  // Update product (Admin - Protected)
  app.patch("/api/products/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertProductSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, error: "Failed to update product" });
    }
  });
  
  // Delete product (Admin - Protected)
  app.delete("/api/products/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ success: false, error: "Failed to delete product" });
    }
  });
  
  // ==================== CATEGORIES API ====================
  
  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categoryList = await storage.getAllCategories();
      res.json({ success: true, data: categoryList });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, error: "Failed to fetch categories" });
    }
  });
  
  // Create category (Admin - Protected)
  app.post("/api/categories", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ success: false, error: "Failed to create category" });
    }
  });
  
  // ==================== SEED DATA ====================
  
  // Reset and seed comprehensive product data (Admin - Protected)
  app.post("/api/seed-full", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      // Delete all existing products first
      const existingProducts = await storage.getAllProducts();
      for (const product of existingProducts) {
        await storage.deleteProduct(product.id);
      }

      // Seed categories - Estella lifestyle mall categories
      const categoryData = [
        { id: "home_interior", name: "홈 인테리어", description: "세련된 감각의 홈스타일링 아이템", count: 10 },
        { id: "beauty", name: "뷰티", description: "트렌디한 뷰티 & 스킨케어 제품", count: 10 },
        { id: "electronics", name: "가전/디지털", description: "스마트한 라이프를 위한 디지털 기기", count: 10 },
        { id: "living", name: "생활용품", description: "일상을 더 편리하게 만드는 생활용품", count: 10 },
        { id: "health", name: "헬스/건강식품", description: "건강한 삶을 위한 웰니스 제품", count: 10 },
        { id: "luxury", name: "럭셔리/명품", description: "프리미엄 명품 컬렉션", count: 10 },
        { id: "baby", name: "유아/완구", description: "아이를 위한 안전한 유아용품", count: 10 },
      ];
      
      for (const cat of categoryData) {
        try {
          await storage.createCategory(cat);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      // Placeholder image helper for lifestyle products
      const placeholderImage = (category: string, index: number) => {
        return `https://placehold.co/400x400/f5f5f5/333333?text=${encodeURIComponent(category)}`;
      };

      // Estella lifestyle mall product data
      const productData = [
        // ==================== HOME INTERIOR (10 items) ====================
        { name: "프리미엄 아로마 캔들 세트", weight: "", purity: "", price: "89,000", originalPrice: "120,000", discountPercent: 26, category: "home_interior", isBest: true, isNew: false, isHot: true, description: "3종 향기 세트, 최대 50시간 연소", imageUrl: placeholderImage("home_interior", 0) },
        { name: "북유럽 스타일 쿠션 커버 4P", weight: "", purity: "", price: "45,000", originalPrice: "58,000", discountPercent: 22, category: "home_interior", isBest: false, isNew: true, isHot: false, description: "면 100% 고급 쿠션커버", imageUrl: placeholderImage("home_interior", 1) },
        { name: "무드등 LED 스탠드", weight: "", purity: "", price: "67,000", originalPrice: "85,000", discountPercent: 21, category: "home_interior", isBest: true, isNew: false, isHot: false, description: "터치 조광 기능, 무선 충전", imageUrl: placeholderImage("home_interior", 2) },
        { name: "호텔식 극세사 담요", weight: "", purity: "", price: "39,000", originalPrice: "55,000", discountPercent: 29, category: "home_interior", isBest: false, isNew: false, isHot: true, description: "킹사이즈, 세탁 가능", imageUrl: placeholderImage("home_interior", 3) },
        { name: "월넛 우드 벽시계", weight: "", purity: "", price: "78,000", originalPrice: "98,000", discountPercent: 20, category: "home_interior", isBest: false, isNew: true, isHot: false, description: "무소음 무브먼트", imageUrl: placeholderImage("home_interior", 4) },
        { name: "대형 러그 카페트 200x300", weight: "", purity: "", price: "189,000", originalPrice: "250,000", discountPercent: 24, category: "home_interior", isBest: true, isNew: false, isHot: false, description: "거실용 대형 러그", imageUrl: placeholderImage("home_interior", 5) },
        { name: "미니멀 행잉 플랜트팟", weight: "", purity: "", price: "32,000", originalPrice: "42,000", discountPercent: 24, category: "home_interior", isBest: false, isNew: false, isHot: false, description: "마크라메 장식 포함", imageUrl: placeholderImage("home_interior", 6) },
        { name: "모던 화병 세트 3종", weight: "", purity: "", price: "56,000", originalPrice: "75,000", discountPercent: 25, category: "home_interior", isBest: false, isNew: true, isHot: false, description: "세라믹 소재", imageUrl: placeholderImage("home_interior", 7) },
        { name: "프리미엄 침구 세트", weight: "", purity: "", price: "159,000", originalPrice: "210,000", discountPercent: 24, category: "home_interior", isBest: true, isNew: false, isHot: true, description: "퀸 사이즈 이불+베개커버", imageUrl: placeholderImage("home_interior", 8) },
        { name: "원목 선반 벽걸이형", weight: "", purity: "", price: "48,000", originalPrice: "62,000", discountPercent: 23, category: "home_interior", isBest: false, isNew: false, isHot: false, description: "DIY 간편 설치", imageUrl: placeholderImage("home_interior", 9) },

        // ==================== BEAUTY (10 items) ====================
        { name: "비타민C 세럼 30ml", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "beauty", isBest: true, isNew: false, isHot: true, description: "브라이트닝 앰플", imageUrl: placeholderImage("beauty", 0) },
        { name: "수분 크림 50ml", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "beauty", isBest: false, isNew: true, isHot: false, description: "히알루론산 함유", imageUrl: placeholderImage("beauty", 1) },
        { name: "클렌징 오일 200ml", weight: "", purity: "", price: "28,000", originalPrice: "36,000", discountPercent: 22, category: "beauty", isBest: true, isNew: false, isHot: false, description: "딥클렌징 효과", imageUrl: placeholderImage("beauty", 2) },
        { name: "립틴트 3종 세트", weight: "", purity: "", price: "38,000", originalPrice: "52,000", discountPercent: 27, category: "beauty", isBest: false, isNew: false, isHot: true, description: "인기 컬러 구성", imageUrl: placeholderImage("beauty", 3) },
        { name: "아이크림 25ml", weight: "", purity: "", price: "45,000", originalPrice: "62,000", discountPercent: 27, category: "beauty", isBest: false, isNew: true, isHot: false, description: "주름개선 기능성", imageUrl: placeholderImage("beauty", 4) },
        { name: "선크림 SPF50+ 50ml", weight: "", purity: "", price: "22,000", originalPrice: "30,000", discountPercent: 27, category: "beauty", isBest: true, isNew: false, isHot: false, description: "자외선 차단", imageUrl: placeholderImage("beauty", 5) },
        { name: "마스크팩 10매 세트", weight: "", purity: "", price: "18,000", originalPrice: "25,000", discountPercent: 28, category: "beauty", isBest: false, isNew: false, isHot: false, description: "수분 집중 케어", imageUrl: placeholderImage("beauty", 6) },
        { name: "헤어 에센스 100ml", weight: "", purity: "", price: "24,000", originalPrice: "32,000", discountPercent: 25, category: "beauty", isBest: false, isNew: true, isHot: false, description: "손상모 케어", imageUrl: placeholderImage("beauty", 7) },
        { name: "메이크업 브러쉬 세트", weight: "", purity: "", price: "32,000", originalPrice: "45,000", discountPercent: 29, category: "beauty", isBest: true, isNew: false, isHot: true, description: "12종 풀세트", imageUrl: placeholderImage("beauty", 8) },
        { name: "바디로션 300ml", weight: "", purity: "", price: "19,000", originalPrice: "26,000", discountPercent: 27, category: "beauty", isBest: false, isNew: false, isHot: false, description: "시어버터 함유", imageUrl: placeholderImage("beauty", 9) },

        // ==================== ELECTRONICS (10 items) ====================
        { name: "무선 블루투스 이어폰", weight: "", purity: "", price: "89,000", originalPrice: "129,000", discountPercent: 31, category: "electronics", isBest: true, isNew: false, isHot: true, description: "노이즈캔슬링, 30시간 재생", imageUrl: placeholderImage("electronics", 0) },
        { name: "스마트 공기청정기", weight: "", purity: "", price: "299,000", originalPrice: "399,000", discountPercent: 25, category: "electronics", isBest: true, isNew: true, isHot: false, description: "앱 연동, HEPA필터", imageUrl: placeholderImage("electronics", 1) },
        { name: "4K 웹캠 HD", weight: "", purity: "", price: "78,000", originalPrice: "98,000", discountPercent: 20, category: "electronics", isBest: false, isNew: false, isHot: false, description: "화상회의용", imageUrl: placeholderImage("electronics", 2) },
        { name: "무선 충전 패드", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "electronics", isBest: false, isNew: false, isHot: true, description: "15W 급속충전", imageUrl: placeholderImage("electronics", 3) },
        { name: "스마트 체중계", weight: "", purity: "", price: "49,000", originalPrice: "68,000", discountPercent: 28, category: "electronics", isBest: false, isNew: true, isHot: false, description: "앱 연동, 체지방 측정", imageUrl: placeholderImage("electronics", 4) },
        { name: "로봇청소기", weight: "", purity: "", price: "389,000", originalPrice: "520,000", discountPercent: 25, category: "electronics", isBest: true, isNew: false, isHot: false, description: "자동 충전, 앱 제어", imageUrl: placeholderImage("electronics", 5) },
        { name: "스탠드형 선풍기", weight: "", purity: "", price: "89,000", originalPrice: "120,000", discountPercent: 26, category: "electronics", isBest: false, isNew: false, isHot: false, description: "DC모터, 초저소음", imageUrl: placeholderImage("electronics", 6) },
        { name: "에어프라이어 5.5L", weight: "", purity: "", price: "129,000", originalPrice: "169,000", discountPercent: 24, category: "electronics", isBest: true, isNew: true, isHot: true, description: "대용량, 터치패널", imageUrl: placeholderImage("electronics", 7) },
        { name: "블루투스 스피커", weight: "", purity: "", price: "65,000", originalPrice: "89,000", discountPercent: 27, category: "electronics", isBest: false, isNew: false, isHot: false, description: "방수기능, 20시간 재생", imageUrl: placeholderImage("electronics", 8) },
        { name: "스마트워치", weight: "", purity: "", price: "189,000", originalPrice: "250,000", discountPercent: 24, category: "electronics", isBest: false, isNew: true, isHot: false, description: "건강관리, 알림 기능", imageUrl: placeholderImage("electronics", 9) },

        // ==================== LIVING (10 items) ====================
        { name: "스테인리스 텀블러 500ml", weight: "", purity: "", price: "28,000", originalPrice: "38,000", discountPercent: 26, category: "living", isBest: true, isNew: false, isHot: true, description: "보온보냉 12시간", imageUrl: placeholderImage("living", 0) },
        { name: "프리미엄 수건 세트", weight: "", purity: "", price: "45,000", originalPrice: "62,000", discountPercent: 27, category: "living", isBest: false, isNew: true, isHot: false, description: "호텔식 면수건 6P", imageUrl: placeholderImage("living", 1) },
        { name: "실리콘 주방용품 세트", weight: "", purity: "", price: "32,000", originalPrice: "45,000", discountPercent: 29, category: "living", isBest: true, isNew: false, isHot: false, description: "조리도구 6종", imageUrl: placeholderImage("living", 2) },
        { name: "유리 밀폐용기 세트", weight: "", purity: "", price: "39,000", originalPrice: "52,000", discountPercent: 25, category: "living", isBest: false, isNew: false, isHot: true, description: "전자레인지 사용가능", imageUrl: placeholderImage("living", 3) },
        { name: "접이식 빨래건조대", weight: "", purity: "", price: "49,000", originalPrice: "68,000", discountPercent: 28, category: "living", isBest: false, isNew: true, isHot: false, description: "스테인리스, 대형", imageUrl: placeholderImage("living", 4) },
        { name: "디퓨저 200ml", weight: "", purity: "", price: "24,000", originalPrice: "32,000", discountPercent: 25, category: "living", isBest: true, isNew: false, isHot: false, description: "천연 에센셜오일", imageUrl: placeholderImage("living", 5) },
        { name: "세탁 세제 세트", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "living", isBest: false, isNew: false, isHot: false, description: "친환경 저자극", imageUrl: placeholderImage("living", 6) },
        { name: "주방 정리함 세트", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "living", isBest: false, isNew: true, isHot: false, description: "서랍형 3단", imageUrl: placeholderImage("living", 7) },
        { name: "청소도구 세트", weight: "", purity: "", price: "55,000", originalPrice: "75,000", discountPercent: 27, category: "living", isBest: true, isNew: false, isHot: true, description: "밀대+걸레+솔", imageUrl: placeholderImage("living", 8) },
        { name: "다용도 수납박스", weight: "", purity: "", price: "18,000", originalPrice: "25,000", discountPercent: 28, category: "living", isBest: false, isNew: false, isHot: false, description: "접이식, 3개입", imageUrl: placeholderImage("living", 9) },

        // ==================== HEALTH (10 items) ====================
        { name: "종합비타민 90정", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "health", isBest: true, isNew: false, isHot: true, description: "3개월분", imageUrl: placeholderImage("health", 0) },
        { name: "프로바이오틱스 유산균", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "health", isBest: true, isNew: true, isHot: false, description: "100억 CFU", imageUrl: placeholderImage("health", 1) },
        { name: "오메가3 피쉬오일", weight: "", purity: "", price: "38,000", originalPrice: "52,000", discountPercent: 27, category: "health", isBest: false, isNew: false, isHot: false, description: "60캡슐", imageUrl: placeholderImage("health", 2) },
        { name: "콜라겐 파우더", weight: "", purity: "", price: "45,000", originalPrice: "62,000", discountPercent: 27, category: "health", isBest: false, isNew: false, isHot: true, description: "저분자 피쉬콜라겐", imageUrl: placeholderImage("health", 3) },
        { name: "홍삼 스틱 30포", weight: "", purity: "", price: "58,000", originalPrice: "78,000", discountPercent: 26, category: "health", isBest: false, isNew: true, isHot: false, description: "6년근 홍삼", imageUrl: placeholderImage("health", 4) },
        { name: "프로틴 파우더 1kg", weight: "", purity: "", price: "49,000", originalPrice: "68,000", discountPercent: 28, category: "health", isBest: true, isNew: false, isHot: false, description: "WPI 분리유청", imageUrl: placeholderImage("health", 5) },
        { name: "마그네슘 영양제", weight: "", purity: "", price: "28,000", originalPrice: "38,000", discountPercent: 26, category: "health", isBest: false, isNew: false, isHot: false, description: "90정", imageUrl: placeholderImage("health", 6) },
        { name: "비타민D 2000IU", weight: "", purity: "", price: "22,000", originalPrice: "30,000", discountPercent: 27, category: "health", isBest: false, isNew: true, isHot: false, description: "120캡슐", imageUrl: placeholderImage("health", 7) },
        { name: "폼롤러 마사지기", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "health", isBest: true, isNew: false, isHot: true, description: "근육이완용", imageUrl: placeholderImage("health", 8) },
        { name: "요가매트 NBR 10mm", weight: "", purity: "", price: "32,000", originalPrice: "45,000", discountPercent: 29, category: "health", isBest: false, isNew: false, isHot: false, description: "논슬립, 고밀도", imageUrl: placeholderImage("health", 9) },

        // ==================== LUXURY (10 items) ====================
        { name: "프리미엄 가죽 지갑", weight: "", purity: "", price: "189,000", originalPrice: "250,000", discountPercent: 24, category: "luxury", isBest: true, isNew: false, isHot: true, description: "이태리 소가죽", imageUrl: placeholderImage("luxury", 0) },
        { name: "명품 스카프", weight: "", purity: "", price: "320,000", originalPrice: "420,000", discountPercent: 24, category: "luxury", isBest: true, isNew: true, isHot: false, description: "실크 100%", imageUrl: placeholderImage("luxury", 1) },
        { name: "디자이너 선글라스", weight: "", purity: "", price: "280,000", originalPrice: "380,000", discountPercent: 26, category: "luxury", isBest: false, isNew: false, isHot: false, description: "UV400 차단", imageUrl: placeholderImage("luxury", 2) },
        { name: "가죽 벨트 명품", weight: "", purity: "", price: "165,000", originalPrice: "220,000", discountPercent: 25, category: "luxury", isBest: false, isNew: false, isHot: true, description: "정품 소가죽", imageUrl: placeholderImage("luxury", 3) },
        { name: "럭셔리 시계", weight: "", purity: "", price: "890,000", originalPrice: "1,200,000", discountPercent: 26, category: "luxury", isBest: false, isNew: true, isHot: false, description: "스위스 무브먼트", imageUrl: placeholderImage("luxury", 4) },
        { name: "프리미엄 핸드백", weight: "", purity: "", price: "450,000", originalPrice: "600,000", discountPercent: 25, category: "luxury", isBest: true, isNew: false, isHot: false, description: "송아지 가죽", imageUrl: placeholderImage("luxury", 5) },
        { name: "명품 넥타이", weight: "", purity: "", price: "125,000", originalPrice: "168,000", discountPercent: 26, category: "luxury", isBest: false, isNew: false, isHot: false, description: "실크 100%", imageUrl: placeholderImage("luxury", 6) },
        { name: "가죽 명함케이스", weight: "", purity: "", price: "89,000", originalPrice: "120,000", discountPercent: 26, category: "luxury", isBest: false, isNew: true, isHot: false, description: "프리미엄 소가죽", imageUrl: placeholderImage("luxury", 7) },
        { name: "럭셔리 카드지갑", weight: "", purity: "", price: "145,000", originalPrice: "195,000", discountPercent: 26, category: "luxury", isBest: true, isNew: false, isHot: true, description: "8카드 수납", imageUrl: placeholderImage("luxury", 8) },
        { name: "프리미엄 장갑", weight: "", purity: "", price: "98,000", originalPrice: "130,000", discountPercent: 25, category: "luxury", isBest: false, isNew: false, isHot: false, description: "양가죽, 캐시미어안감", imageUrl: placeholderImage("luxury", 9) },

        // ==================== BABY (10 items) ====================
        { name: "유아 블록 세트 100P", weight: "", purity: "", price: "45,000", originalPrice: "62,000", discountPercent: 27, category: "baby", isBest: true, isNew: false, isHot: true, description: "안전인증 완구", imageUrl: placeholderImage("baby", 0) },
        { name: "아기 이유식기 세트", weight: "", purity: "", price: "38,000", originalPrice: "52,000", discountPercent: 27, category: "baby", isBest: true, isNew: true, isHot: false, description: "실리콘 6종", imageUrl: placeholderImage("baby", 1) },
        { name: "유아 퍼즐매트", weight: "", purity: "", price: "49,000", originalPrice: "68,000", discountPercent: 28, category: "baby", isBest: false, isNew: false, isHot: false, description: "12장 세트", imageUrl: placeholderImage("baby", 2) },
        { name: "뽀로로 장난감 세트", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "baby", isBest: false, isNew: false, isHot: true, description: "캐릭터 피규어 5종", imageUrl: placeholderImage("baby", 3) },
        { name: "아기 목욕용품 세트", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "baby", isBest: false, isNew: true, isHot: false, description: "저자극 6종 세트", imageUrl: placeholderImage("baby", 4) },
        { name: "유아 책상 의자 세트", weight: "", purity: "", price: "89,000", originalPrice: "120,000", discountPercent: 26, category: "baby", isBest: true, isNew: false, isHot: false, description: "높이조절 가능", imageUrl: placeholderImage("baby", 5) },
        { name: "아기 젖병 세트", weight: "", purity: "", price: "55,000", originalPrice: "75,000", discountPercent: 27, category: "baby", isBest: false, isNew: false, isHot: false, description: "PPSU 4종", imageUrl: placeholderImage("baby", 6) },
        { name: "유아 크레용 세트", weight: "", purity: "", price: "18,000", originalPrice: "25,000", discountPercent: 28, category: "baby", isBest: false, isNew: true, isHot: false, description: "무독성 24색", imageUrl: placeholderImage("baby", 7) },
        { name: "아기 수면조끼", weight: "", purity: "", price: "32,000", originalPrice: "45,000", discountPercent: 29, category: "baby", isBest: true, isNew: false, isHot: true, description: "순면 100%", imageUrl: placeholderImage("baby", 8) },
        { name: "유아 자전거 헬멧", weight: "", purity: "", price: "28,000", originalPrice: "38,000", discountPercent: 26, category: "baby", isBest: false, isNew: false, isHot: false, description: "안전인증", imageUrl: placeholderImage("baby", 9) },
      ];
      
      let createdCount = 0;
      for (const prod of productData) {
        try {
          await storage.createProduct(prod);
          createdCount++;
        } catch (e) {
          console.error("Error creating product:", prod.name, e);
        }
      }
      
      res.json({ success: true, message: `${createdCount}개의 상품이 생성되었습니다.` });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ success: false, error: "Failed to seed data" });
    }
  });

  // Seed initial data (Admin - Protected)
  app.post("/api/seed", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      // Seed categories - Estella lifestyle mall categories (6 main + subcategories)
      const categoryData = [
        // 대분류: 홈 인테리어
        { id: "home_interior", name: "홈 인테리어", description: "세련된 감각의 홈스타일링 아이템", parentId: null, sortOrder: 1 },
        { id: "home_furniture", name: "가구", description: "의자, 테이블, 수납가구", parentId: "home_interior", sortOrder: 1 },
        { id: "home_lighting", name: "조명", description: "스탠드, 무드등, 펜던트", parentId: "home_interior", sortOrder: 2 },
        { id: "home_decor", name: "인테리어소품", description: "화병, 액자, 오브제", parentId: "home_interior", sortOrder: 3 },
        { id: "home_fabric", name: "패브릭", description: "쿠션, 러그, 커튼", parentId: "home_interior", sortOrder: 4 },
        { id: "home_wall", name: "벽장식", description: "거울, 시계, 월데코", parentId: "home_interior", sortOrder: 5 },
        
        // 대분류: 뷰티
        { id: "beauty", name: "뷰티", description: "트렌디한 뷰티 & 스킨케어 제품", parentId: null, sortOrder: 2 },
        { id: "beauty_skincare", name: "스킨케어", description: "세럼, 크림, 토너", parentId: "beauty", sortOrder: 1 },
        { id: "beauty_makeup", name: "메이크업", description: "립스틱, 파운데이션", parentId: "beauty", sortOrder: 2 },
        { id: "beauty_perfume", name: "향수", description: "오드퍼퓸, 디퓨저", parentId: "beauty", sortOrder: 3 },
        { id: "beauty_body", name: "바디케어", description: "로션, 바디워시", parentId: "beauty", sortOrder: 4 },
        { id: "beauty_hair", name: "헤어케어", description: "샴푸, 트리트먼트", parentId: "beauty", sortOrder: 5 },
        
        // 대분류: 가전/디지털
        { id: "electronics", name: "가전/디지털", description: "스마트한 라이프를 위한 디지털 기기", parentId: null, sortOrder: 3 },
        { id: "elec_living", name: "생활가전", description: "공기청정기, 가습기", parentId: "electronics", sortOrder: 1 },
        { id: "elec_kitchen", name: "주방가전", description: "에어프라이어, 커피머신", parentId: "electronics", sortOrder: 2 },
        { id: "elec_audio", name: "오디오", description: "스피커, 이어폰", parentId: "electronics", sortOrder: 3 },
        { id: "elec_digital", name: "디지털기기", description: "태블릿악세서리", parentId: "electronics", sortOrder: 4 },
        
        // 대분류: 생활용품
        { id: "living", name: "생활용품", description: "일상을 더 편리하게 만드는 생활용품", parentId: null, sortOrder: 4 },
        { id: "living_kitchen", name: "주방용품", description: "그릇, 수저, 조리도구", parentId: "living", sortOrder: 1 },
        { id: "living_bathroom", name: "욕실용품", description: "수건, 욕실소품", parentId: "living", sortOrder: 2 },
        { id: "living_storage", name: "수납/정리", description: "바구니, 정리함", parentId: "living", sortOrder: 3 },
        { id: "living_cleaning", name: "청소용품", description: "세제, 청소도구", parentId: "living", sortOrder: 4 },
        
        // 대분류: 헬스/건강식품
        { id: "health", name: "헬스/건강식품", description: "건강한 삶을 위한 웰니스 제품", parentId: null, sortOrder: 5 },
        { id: "health_supplements", name: "건강보조제", description: "비타민, 유산균", parentId: "health", sortOrder: 1 },
        { id: "health_drinks", name: "건강음료", description: "차, 건강즙", parentId: "health", sortOrder: 2 },
        { id: "health_fitness", name: "운동용품", description: "요가매트, 덤벨", parentId: "health", sortOrder: 3 },
        { id: "health_diet", name: "다이어트", description: "단백질, 식이섬유", parentId: "health", sortOrder: 4 },
        
        // 대분류: 럭셔리/명품
        { id: "luxury", name: "럭셔리/명품", description: "프리미엄 명품 컬렉션", parentId: null, sortOrder: 6 },
        { id: "luxury_bags", name: "명품가방", description: "지갑, 클러치", parentId: "luxury", sortOrder: 1 },
        { id: "luxury_accessories", name: "명품악세서리", description: "스카프, 벨트", parentId: "luxury", sortOrder: 2 },
        { id: "luxury_furniture", name: "프리미엄가구", description: "디자이너가구", parentId: "luxury", sortOrder: 3 },
        { id: "luxury_items", name: "명품소품", description: "키링, 카드지갑", parentId: "luxury", sortOrder: 4 },
      ];
      
      for (const cat of categoryData) {
        try {
          await storage.createCategory(cat);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      // Seed products - lifestyle products (weight and purity are empty for lifestyle items)
      const productData = [
        // 홈 인테리어 - 소분류별
        { name: "프리미엄 아로마 캔들 세트", weight: "", purity: "", price: "89,000", originalPrice: "120,000", discountPercent: 26, category: "home_decor", isBest: true, isNew: false, isHot: true, description: "3종 향기 세트" },
        { name: "북유럽 스타일 쿠션 커버 4P", weight: "", purity: "", price: "45,000", originalPrice: "58,000", discountPercent: 22, category: "home_fabric", isBest: false, isNew: true, isHot: false, description: "면 100% 고급 쿠션커버" },
        { name: "무드등 LED 스탠드", weight: "", purity: "", price: "67,000", originalPrice: "85,000", discountPercent: 21, category: "home_lighting", isBest: true, isNew: false, isHot: false, description: "터치 조광 기능" },
        
        // 뷰티 - 소분류별
        { name: "비타민C 세럼 30ml", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "beauty_skincare", isBest: true, isNew: false, isHot: true, description: "브라이트닝 앰플" },
        { name: "수분 크림 50ml", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "beauty_skincare", isBest: false, isNew: true, isHot: false, description: "히알루론산 함유" },
        { name: "클렌징 오일 200ml", weight: "", purity: "", price: "28,000", originalPrice: "36,000", discountPercent: 22, category: "beauty_skincare", isBest: true, isNew: false, isHot: false, description: "딥클렌징 효과" },
        
        // 가전/디지털 - 소분류별
        { name: "무선 블루투스 이어폰", weight: "", purity: "", price: "89,000", originalPrice: "129,000", discountPercent: 31, category: "elec_audio", isBest: true, isNew: false, isHot: true, description: "노이즈캔슬링" },
        { name: "스마트 공기청정기", weight: "", purity: "", price: "299,000", originalPrice: "399,000", discountPercent: 25, category: "elec_living", isBest: true, isNew: true, isHot: false, description: "앱 연동, HEPA필터" },
        { name: "에어프라이어 5.5L", weight: "", purity: "", price: "129,000", originalPrice: "169,000", discountPercent: 24, category: "elec_kitchen", isBest: true, isNew: true, isHot: true, description: "대용량, 터치패널" },
        
        // 생활용품 - 소분류별
        { name: "스테인리스 텀블러 500ml", weight: "", purity: "", price: "28,000", originalPrice: "38,000", discountPercent: 26, category: "living_kitchen", isBest: true, isNew: false, isHot: true, description: "보온보냉 12시간" },
        { name: "프리미엄 수건 세트", weight: "", purity: "", price: "45,000", originalPrice: "62,000", discountPercent: 27, category: "living_bathroom", isBest: false, isNew: true, isHot: false, description: "호텔식 면수건 6P" },
        { name: "실리콘 주방용품 세트", weight: "", purity: "", price: "32,000", originalPrice: "45,000", discountPercent: 29, category: "living_kitchen", isBest: true, isNew: false, isHot: false, description: "조리도구 6종" },
        
        // 헬스/건강식품 - 소분류별
        { name: "종합비타민 90정", weight: "", purity: "", price: "35,000", originalPrice: "48,000", discountPercent: 27, category: "health_supplements", isBest: true, isNew: false, isHot: true, description: "3개월분" },
        { name: "프로바이오틱스 유산균", weight: "", purity: "", price: "42,000", originalPrice: "58,000", discountPercent: 28, category: "health_supplements", isBest: true, isNew: true, isHot: false, description: "100억 CFU" },
        { name: "프로틴 파우더 1kg", weight: "", purity: "", price: "49,000", originalPrice: "68,000", discountPercent: 28, category: "health_diet", isBest: true, isNew: false, isHot: false, description: "WPI 분리유청" },
        
        // 럭셔리/명품 - 소분류별
        { name: "프리미엄 가죽 지갑", weight: "", purity: "", price: "189,000", originalPrice: "250,000", discountPercent: 24, category: "luxury_bags", isBest: true, isNew: false, isHot: true, description: "이태리 소가죽" },
        { name: "명품 스카프", weight: "", purity: "", price: "320,000", originalPrice: "420,000", discountPercent: 24, category: "luxury_accessories", isBest: true, isNew: true, isHot: false, description: "실크 100%" },
        { name: "프리미엄 핸드백", weight: "", purity: "", price: "450,000", originalPrice: "600,000", discountPercent: 25, category: "luxury_bags", isBest: true, isNew: false, isHot: false, description: "송아지 가죽" },
      ];
      
      for (const prod of productData) {
        try {
          await storage.createProduct(prod);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      res.json({ success: true, message: "Seed data created successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ success: false, error: "Failed to seed data" });
    }
  });

  // ==================== ADMIN AUTHENTICATION ====================
  
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        adminSessions.set(token, { expiresAt });
        
        res.json({ 
          success: true, 
          token,
          message: "로그인 성공" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          error: "아이디 또는 비밀번호가 일치하지 않습니다." 
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "로그인 처리 중 오류가 발생했습니다." });
    }
  });
  
  app.post("/api/admin/logout", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ success: true, message: "로그아웃 성공" });
  });
  
  app.get("/api/admin/verify", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && isValidSession(token)) {
      res.json({ success: true, authenticated: true });
    } else {
      res.status(401).json({ success: false, authenticated: false });
    }
  });

  // ==================== MEMBER MANAGEMENT API ====================
  
  app.get("/api/admin/members", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const memberList = await storage.getAllMembers();
      res.json({ success: true, data: memberList });
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ success: false, error: "회원 목록을 불러올 수 없습니다." });
    }
  });
  
  app.get("/api/admin/members/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: member });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ success: false, error: "회원 정보를 불러올 수 없습니다." });
    }
  });
  
  app.post("/api/admin/members", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const validatedData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(validatedData);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating member:", error);
      res.status(500).json({ success: false, error: "회원 생성에 실패했습니다." });
    }
  });
  
  app.patch("/api/admin/members/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const partialSchema = insertMemberSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const member = await storage.updateMember(req.params.id, validatedData);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: member });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating member:", error);
      res.status(500).json({ success: false, error: "회원 정보 수정에 실패했습니다." });
    }
  });
  
  app.delete("/api/admin/members/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const success = await storage.deleteMember(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "회원이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ success: false, error: "회원 삭제에 실패했습니다." });
    }
  });

  // Public member signup
  app.post("/api/members/signup", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMemberSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getMemberByEmail(validatedData.email);
      if (existing) {
        return res.status(400).json({ success: false, error: "이미 등록된 이메일입니다." });
      }
      
      const member = await storage.createMember(validatedData);
      res.status(201).json({ success: true, message: "회원가입이 완료되었습니다." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error during signup:", error);
      res.status(500).json({ success: false, error: "회원가입 처리 중 오류가 발생했습니다." });
    }
  });

  // Member login - uses database-based sessions for persistence
  app.post("/api/members/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "이메일과 비밀번호를 입력해주세요." });
      }
      
      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ success: false, error: "등록되지 않은 이메일입니다." });
      }
      
      if (member.password !== password) {
        return res.status(401).json({ success: false, error: "비밀번호가 일치하지 않습니다." });
      }
      
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      await storage.createMemberSession({
        token,
        memberId: member.id,
        email: member.email,
        name: member.name
      });
      
      res.json({ 
        success: true, 
        token,
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          pointBalance: member.pointBalance || 0,
          isFrozen: member.isFrozen || false
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ success: false, error: "로그인 처리 중 오류가 발생했습니다." });
    }
  });
  
  // Helper function to get member from session token
  async function getMemberFromToken(token: string | undefined): Promise<{ memberId: string; email: string; name: string } | null> {
    if (!token) return null;
    const session = await storage.getMemberSession(token);
    if (!session) return null;
    return { memberId: session.memberId, email: session.email, name: session.name };
  }

  // Get member info (for logged-in member)
  app.get("/api/members/me", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const member = await storage.getMember(session.memberId);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({
        success: true,
        data: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          address: member.address || null,
          bank: member.bank || null,
          accountNumber: member.accountNumber || null,
          pointBalance: member.pointBalance || 0,
          isFrozen: member.isFrozen || false,
          createdAt: member.createdAt
        }
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ success: false, error: "회원 정보를 불러올 수 없습니다." });
    }
  });

  // ==================== DEPOSIT REQUESTS (Member) ====================
  
  // Create deposit request
  app.post("/api/members/deposit-requests", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const member = await storage.getMember(session.memberId);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      if (member.isFrozen) {
        return res.status(403).json({ success: false, error: "계정이 동결되어 입금신청을 할 수 없습니다." });
      }
      
      const { amount, bankName, accountNumber, depositorName } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: "유효한 금액을 입력해주세요." });
      }
      
      if (!bankName || !depositorName) {
        return res.status(400).json({ success: false, error: "은행명과 입금자명을 입력해주세요." });
      }
      
      const request = await storage.createDepositRequest({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        amount: parseInt(amount),
        bankName,
        accountNumber: accountNumber || "",
        depositorName,
        status: "pending"
      });
      
      res.status(201).json({ success: true, data: request, message: "입금신청이 접수되었습니다." });
    } catch (error) {
      console.error("Error creating deposit request:", error);
      res.status(500).json({ success: false, error: "입금신청 처리 중 오류가 발생했습니다." });
    }
  });

  // Get my deposit requests
  app.get("/api/members/deposit-requests", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const requests = await storage.getDepositRequestsByMember(session.memberId);
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
      res.status(500).json({ success: false, error: "입금신청 목록을 불러올 수 없습니다." });
    }
  });

  // Create withdrawal request
  app.post("/api/members/withdrawal-requests", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const member = await storage.getMember(session.memberId);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      if (member.isFrozen) {
        return res.status(403).json({ success: false, error: "계정이 동결되어 출금신청을 할 수 없습니다." });
      }
      
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: "유효한 금액을 입력해주세요." });
      }
      
      const currentBalance = member.pointBalance || 0;
      if (amount > currentBalance) {
        return res.status(400).json({ success: false, error: "보유 포인트가 부족합니다." });
      }
      
      const request = await storage.createWithdrawalRequest({
        memberId: member.id,
        memberName: member.name,
        memberEmail: member.email,
        amount: parseInt(amount),
        status: "pending"
      });
      
      res.status(201).json({ success: true, data: request, message: "출금신청이 접수되었습니다." });
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ success: false, error: "출금신청 처리 중 오류가 발생했습니다." });
    }
  });

  // Get my withdrawal requests
  app.get("/api/members/withdrawal-requests", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const requests = await storage.getWithdrawalRequestsByMember(session.memberId);
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ success: false, error: "출금신청 목록을 불러올 수 없습니다." });
    }
  });

  // Get my point transactions
  app.get("/api/members/point-transactions", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const transactions = await storage.getPointTransactionsByMember(session.memberId);
      res.json({ success: true, data: transactions });
    } catch (error) {
      console.error("Error fetching point transactions:", error);
      res.status(500).json({ success: false, error: "포인트 내역을 불러올 수 없습니다." });
    }
  });

  // ==================== ADMIN DEPOSIT & POINT MANAGEMENT ====================
  
  // Get all deposit requests (admin)
  app.get("/api/admin/deposit-requests", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      let requests;
      if (status === "pending") {
        requests = await storage.getPendingDepositRequests();
      } else {
        requests = await storage.getAllDepositRequests();
      }
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching deposit requests:", error);
      res.status(500).json({ success: false, error: "입금신청 목록을 불러올 수 없습니다." });
    }
  });

  // Approve deposit request (admin)
  app.post("/api/admin/deposit-requests/:id/approve", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { adminNote } = req.body;
      const request = await storage.approveDepositRequest(req.params.id, adminNote);
      if (!request) {
        return res.status(404).json({ success: false, error: "입금신청을 찾을 수 없거나 이미 처리되었습니다." });
      }
      res.json({ success: true, data: request, message: "입금신청이 승인되었습니다." });
    } catch (error) {
      console.error("Error approving deposit request:", error);
      res.status(500).json({ success: false, error: "입금신청 승인 처리 중 오류가 발생했습니다." });
    }
  });

  // Reject deposit request (admin)
  app.post("/api/admin/deposit-requests/:id/reject", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { adminNote } = req.body;
      const request = await storage.rejectDepositRequest(req.params.id, adminNote);
      if (!request) {
        return res.status(404).json({ success: false, error: "입금신청을 찾을 수 없거나 이미 처리되었습니다." });
      }
      res.json({ success: true, data: request, message: "입금신청이 거부되었습니다." });
    } catch (error) {
      console.error("Error rejecting deposit request:", error);
      res.status(500).json({ success: false, error: "입금신청 거부 처리 중 오류가 발생했습니다." });
    }
  });

  // ==================== ADMIN WITHDRAWAL MANAGEMENT ====================
  
  // Get all withdrawal requests (admin)
  app.get("/api/admin/withdrawal-requests", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      let requests;
      if (status === "pending") {
        requests = await storage.getPendingWithdrawalRequests();
      } else {
        requests = await storage.getAllWithdrawalRequests();
      }
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ success: false, error: "출금신청 목록을 불러올 수 없습니다." });
    }
  });

  // Approve withdrawal request (admin)
  app.post("/api/admin/withdrawal-requests/:id/approve", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { adminNote } = req.body;
      const request = await storage.approveWithdrawalRequest(req.params.id, adminNote);
      if (!request) {
        return res.status(404).json({ success: false, error: "출금신청을 찾을 수 없거나 이미 처리되었습니다. 또는 잔액이 부족합니다." });
      }
      res.json({ success: true, data: request, message: "출금신청이 승인되었습니다." });
    } catch (error) {
      console.error("Error approving withdrawal request:", error);
      res.status(500).json({ success: false, error: "출금신청 승인 처리 중 오류가 발생했습니다." });
    }
  });

  // Reject withdrawal request (admin)
  app.post("/api/admin/withdrawal-requests/:id/reject", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { adminNote } = req.body;
      const request = await storage.rejectWithdrawalRequest(req.params.id, adminNote);
      if (!request) {
        return res.status(404).json({ success: false, error: "출금신청을 찾을 수 없거나 이미 처리되었습니다." });
      }
      res.json({ success: true, data: request, message: "출금신청이 거부되었습니다." });
    } catch (error) {
      console.error("Error rejecting withdrawal request:", error);
      res.status(500).json({ success: false, error: "출금신청 거부 처리 중 오류가 발생했습니다." });
    }
  });

  // Adjust member points manually (admin)
  app.post("/api/admin/members/:id/adjust-points", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { amount, reason } = req.body;
      
      if (typeof amount !== "number" || amount === 0) {
        return res.status(400).json({ success: false, error: "유효한 금액을 입력해주세요." });
      }
      
      const member = await storage.updateMemberPoints(req.params.id, amount);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: `포인트가 ${amount >= 0 ? "지급" : "차감"}되었습니다.` });
    } catch (error) {
      console.error("Error adjusting member points:", error);
      res.status(500).json({ success: false, error: "포인트 조정 처리 중 오류가 발생했습니다." });
    }
  });

  // Freeze member account (admin)
  app.post("/api/admin/members/:id/freeze", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ success: false, error: "동결 사유를 입력해주세요." });
      }
      
      const member = await storage.freezeMember(req.params.id, reason);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: "계정이 동결되었습니다." });
    } catch (error) {
      console.error("Error freezing member:", error);
      res.status(500).json({ success: false, error: "계정 동결 처리 중 오류가 발생했습니다." });
    }
  });

  // Unfreeze member account (admin)
  app.post("/api/admin/members/:id/unfreeze", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const member = await storage.unfreezeMember(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: "계정 동결이 해제되었습니다." });
    } catch (error) {
      console.error("Error unfreezing member:", error);
      res.status(500).json({ success: false, error: "계정 동결 해제 처리 중 오류가 발생했습니다." });
    }
  });

  // ==================== ADMIN STATS ====================
  
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const products = await storage.getAllProducts();
      const members = await storage.getAllMembers();
      const categories = await storage.getAllCategories();
      
      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          totalMembers: members.length,
          totalCategories: categories.length,
          productsByCategory: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: products.filter(p => p.category === cat.id).length
          }))
        }
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ success: false, error: "통계를 불러올 수 없습니다." });
    }
  });

  // ==================== SEED LUXURY JEWELRY ====================
  
  app.post("/api/seed-luxury-jewelry", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const brandImages: Record<string, string> = {
        "반클리프": "/images/vca_alhambra_clover_necklace.png",
        "까르띠에": "/images/cartier_love_bracelet_gold.png",
        "티파니": "/images/tiffany_t_hoop_earrings.png",
        "샤넬": "/images/chanel_coco_crush_ring.png",
        "불가리": "/images/bulgari_bzero1_spiral_ring.png",
        "루이비통": "/images/lv_blossom_gold_bracelet.png",
        "쇼메": "/images/chaumet_liens_pendant_necklace.png",
        "피아제": "/images/piaget_rose_gold_ring.png",
        "부쉐론": "/images/boucheron_serpent_ring_gold.png",
        "디올": "/images/chaumet_liens_pendant_necklace.png",
        "그라프": "/images/tiffany_t_hoop_earrings.png",
        "프레드": "/images/cartier_love_bracelet_gold.png",
        "부첼라티": "/images/vca_alhambra_clover_necklace.png",
        "키린": "/images/lv_blossom_gold_bracelet.png",
      };
      
      const getImageForBrand = (name: string) => {
        for (const [brand, image] of Object.entries(brandImages)) {
          if (name.includes(brand)) return image;
        }
        return "/images/vca_alhambra_clover_necklace.png";
      };

      const luxuryJewelry = [
        { name: "반클리프앤아펠 스위트 알함브라 화이트자개 목걸이", weight: "18K", purity: "750", price: "720,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Van Cleef & Arpels" },
        { name: "쇼메 트리옹프 드 쇼메 목걸이", weight: "18K", purity: "750", price: "1,360,000", category: "pure_jewelry", isBest: false, isNew: true, description: "CHAUMET" },
        { name: "티파니 18K 크로스 펜던트 미니", weight: "18K", purity: "750", price: "980,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Tiffany & Co." },
        { name: "티파니 18K T1 후프 이어링", weight: "18K", purity: "750", price: "1,430,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Tiffany & Co." },
        { name: "부쉐론 보헴 쎄뻥 S 사이즈 로즈골드 링", weight: "18K", purity: "750", price: "2,160,000", category: "pure_jewelry", isBest: false, isNew: true, description: "BOUCHERON" },
        { name: "부쉐론 보헴 쎄뻥 XS 링", weight: "18K", purity: "750", price: "920,000", category: "pure_jewelry", isBest: false, isNew: false, description: "BOUCHERON" },
        { name: "쇼메 주드리앙 펜던트", weight: "18K", purity: "750", price: "1,420,000", category: "pure_jewelry", isBest: true, isNew: false, description: "CHAUMET" },
        { name: "키린 18K 브레이스릿", weight: "18K", purity: "750", price: "820,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Qeelin" },
        { name: "반클리프앤아펠 24년 홀리데이 기요세 투톤 네크리스", weight: "18K", purity: "750", price: "1,880,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Van Cleef & Arpels 리미티드" },
        { name: "반클리프앤아펠 5P 화이트자개 브레이슬릿", weight: "18K", purity: "750", price: "2,520,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Van Cleef & Arpels" },
        { name: "반클리프앤아펠 화이트골드 빈티지 목걸이", weight: "18K WG", purity: "750", price: "1,080,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Van Cleef & Arpels" },
        { name: "티파니 18K 목걸이 옐로우골드", weight: "18K", purity: "750", price: "1,860,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Tiffany & Co." },
        { name: "샤넬 18K 크러쉬 링 스몰", weight: "18K", purity: "750", price: "1,480,000", category: "pure_jewelry", isBest: true, isNew: true, description: "CHANEL" },
        { name: "샤넬 18K 크러쉬 링 라지", weight: "18K", purity: "750", price: "1,480,000", category: "pure_jewelry", isBest: false, isNew: true, description: "CHANEL" },
        { name: "샤넬 18K 크러쉬 링 라지 다이아", weight: "18K", purity: "750", price: "2,060,000", category: "pure_jewelry", isBest: false, isNew: false, description: "CHANEL 다이아몬드" },
        { name: "반클리프앤아펠 리미티드 에디션 18K 포슬린", weight: "18K", purity: "750", price: "1,560,000", category: "pure_jewelry", isBest: true, isNew: false, description: "Van Cleef & Arpels 한정판" },
        { name: "루이비통 18K 화이트 마더오브펄 핑크골드", weight: "18K", purity: "750", price: "1,180,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Louis Vuitton" },
        { name: "루이비통 블라썸 그레이 마더오브펄 썬 목걸이", weight: "18K", purity: "750", price: "1,180,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Louis Vuitton" },
        { name: "루이비통 블라썸BB 핑크골드 화이트자개 브레이슬릿", weight: "18K", purity: "750", price: "1,880,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Louis Vuitton" },
        { name: "피아제 18K 선라이트 네크리스", weight: "18K", purity: "750", price: "1,860,000", category: "pure_jewelry", isBest: false, isNew: true, description: "PIAGET" },
        { name: "티파니 18K 키 목걸이 옐로우골드", weight: "18K", purity: "750", price: "1,680,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Tiffany & Co." },
        { name: "루이비통 블라썸BB 핑크자개 목걸이", weight: "18K", purity: "750", price: "880,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Louis Vuitton" },
        { name: "루이비통 옹브레 블라썸 오픈 링", weight: "18K", purity: "750", price: "1,460,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Louis Vuitton" },
        { name: "반클리프앤아펠 기요세 화이트 네크리스", weight: "18K", purity: "750", price: "1,580,000", category: "pure_jewelry", isBest: true, isNew: false, description: "Van Cleef & Arpels" },
        { name: "까르띠에 18K 로즈골드 저스트 앵 끌루 다이아 팔찌", weight: "18K", purity: "750", price: "1,460,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Cartier LOVE" },
        { name: "티파니 18K 린 이어링", weight: "18K", purity: "750", price: "1,180,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Tiffany & Co." },
        { name: "샤넬 18K 크러쉬 링 미니", weight: "18K", purity: "750", price: "820,000", category: "pure_jewelry", isBest: false, isNew: true, description: "CHANEL" },
        { name: "불가리 18K 미니 파베세팅 비제로원 링", weight: "18K", purity: "750", price: "1,980,000", category: "pure_jewelry", isBest: true, isNew: false, description: "BVLGARI" },
        { name: "까르띠에 18K 러브 브레이슬릿", weight: "18K", purity: "750", price: "920,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Cartier LOVE" },
        { name: "까르띠에 18K 슬림형 러브 브레이슬릿", weight: "18K", purity: "750", price: "1,850,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Cartier LOVE Slim" },
        { name: "반클리프앤아펠 프리볼 18K 미니 이어링 루비", weight: "18K", purity: "750", price: "780,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Van Cleef & Arpels" },
        { name: "반클리프앤아펠 알함브라 스윗사이즈 이어링", weight: "18K", purity: "750", price: "720,000", category: "pure_jewelry", isBest: true, isNew: false, description: "Van Cleef & Arpels" },
        { name: "반클리프앤아펠 빈티지 알함브라 화이트자개 18K 목걸이", weight: "18K", purity: "750", price: "1,720,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Van Cleef & Arpels" },
        { name: "까르띠에 18K 신형잠금 저스트앵끌루 옐로우골드 팔찌", weight: "18K", purity: "750", price: "2,350,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Cartier Juste un Clou" },
        { name: "부첼라티 18K 오페라 튤레 펜던트 세트", weight: "18K", purity: "750", price: "4,080,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Buccellati" },
        { name: "프레드 18K 포스텐 라지 버클", weight: "18K", purity: "750", price: "1,380,000", category: "pure_jewelry", isBest: false, isNew: true, description: "FRED" },
        { name: "부첼라티 18K 오페라 튤레 펜던트 스몰", weight: "18K", purity: "750", price: "1,520,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Buccellati" },
        { name: "반클리프앤아펠 빈티지 알함브라 5모티프 브레이슬릿", weight: "18K", purity: "750", price: "3,980,000", category: "pure_jewelry", isBest: true, isNew: false, description: "Van Cleef & Arpels" },
        { name: "그라프 18K 파베 버터플라이 다이아몬드 쁘띠 펜던트", weight: "18K", purity: "750", price: "830,000", category: "pure_jewelry", isBest: false, isNew: true, description: "GRAFF" },
        { name: "피아제 18K 로즈 링", weight: "18K", purity: "750", price: "1,340,000", category: "pure_jewelry", isBest: false, isNew: false, description: "PIAGET" },
        { name: "반클리프앤아펠 22년 리미티드 에디션 18K 포슬린", weight: "18K", purity: "750", price: "1,560,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Van Cleef & Arpels 한정판" },
        { name: "쇼메 18K True 내로우 링 3.5mm", weight: "18K", purity: "750", price: "1,380,000", category: "pure_jewelry", isBest: false, isNew: true, description: "CHAUMET" },
        { name: "디올 18K ROSE DES VENTS 팔찌", weight: "18K", purity: "750", price: "1,660,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Dior" },
        { name: "불가리 18K 바이퍼 링", weight: "18K", purity: "750", price: "1,960,000", category: "pure_jewelry", isBest: false, isNew: false, description: "BVLGARI Serpenti" },
        { name: "샤넬 18K 크러쉬 링", weight: "18K", purity: "750", price: "1,680,000", category: "pure_jewelry", isBest: false, isNew: true, description: "CHANEL" },
        { name: "쇼메 18K 리앙 반지", weight: "18K", purity: "750", price: "1,680,000", category: "pure_jewelry", isBest: false, isNew: false, description: "CHAUMET" },
        { name: "반클리프앤아펠 터키석 18K 스윗사이즈 이어링", weight: "18K", purity: "750", price: "740,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Van Cleef & Arpels" },
        { name: "반클리프앤아펠 화이트자개 이어링 스윗", weight: "18K", purity: "750", price: "720,000", category: "pure_jewelry", isBest: true, isNew: false, description: "Van Cleef & Arpels" },
        { name: "불가리 18K 비제로원 로즈골드 링", weight: "18K", purity: "750", price: "2,460,000", category: "pure_jewelry", isBest: true, isNew: false, description: "BVLGARI B.zero1" },
        { name: "반클리프앤아펠 뻬를리 디아망 목걸이 옐로우골드", weight: "18K", purity: "750", price: "1,560,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Van Cleef & Arpels Perlée" },
        { name: "까르띠에 18K 팬더 드 까르띠에 링", weight: "18K", purity: "750", price: "2,960,000", category: "pure_jewelry", isBest: true, isNew: true, description: "Cartier Panthère" },
        { name: "쇼메 18K 주드리앙 화이트자개 귀걸이", weight: "18K", purity: "750", price: "730,000", category: "pure_jewelry", isBest: false, isNew: false, description: "CHAUMET" },
        { name: "불가리 18K 세르펜티 다이아 뱅글", weight: "18K", purity: "750", price: "5,680,000", category: "pure_jewelry", isBest: true, isNew: false, description: "BVLGARI Serpenti" },
        { name: "디올 18K Bois de Rose 반지", weight: "18K", purity: "750", price: "1,430,000", category: "pure_jewelry", isBest: false, isNew: true, description: "Dior" },
        { name: "티파니 18K T 이어링", weight: "18K", purity: "750", price: "1,830,000", category: "pure_jewelry", isBest: false, isNew: false, description: "Tiffany & Co." },
      ];
      
      let createdCount = 0;
      for (const prod of luxuryJewelry) {
        try {
          const productWithImage = { ...prod, imageUrl: getImageForBrand(prod.name) };
          await storage.createProduct(productWithImage);
          createdCount++;
        } catch (e) {
          console.error("Error creating luxury jewelry product:", prod.name, e);
        }
      }
      
      res.json({ success: true, message: `${createdCount}개의 럭셔리 주얼리 상품이 추가되었습니다.` });
    } catch (error) {
      console.error("Error seeding luxury jewelry:", error);
      res.status(500).json({ success: false, error: "럭셔리 주얼리 상품 추가에 실패했습니다." });
    }
  });

  // ==================== CHAT API ====================
  
  // Get all conversations (admin only)
  app.get("/api/chat/conversations", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ success: false, error: "대화 목록을 불러올 수 없습니다." });
    }
  });

  // Get single conversation with messages
  app.get("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ success: false, error: "대화를 찾을 수 없습니다." });
      }
      const messages = await storage.getMessagesByConversation(req.params.id);
      res.json({ success: true, data: { conversation, messages } });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ success: false, error: "대화를 불러올 수 없습니다." });
    }
  });

  // Create new conversation (public)
  app.post("/api/chat/conversations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ success: false, error: "대화 생성에 실패했습니다." });
    }
  });

  // Update conversation status (admin only)
  app.patch("/api/chat/conversations/:id/status", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const conversation = await storage.updateConversationStatus(req.params.id, status);
      if (!conversation) {
        return res.status(404).json({ success: false, error: "대화를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: conversation });
    } catch (error) {
      console.error("Error updating conversation status:", error);
      res.status(500).json({ success: false, error: "상태 변경에 실패했습니다." });
    }
  });

  // Send message (public for users, auth for admin)
  app.post("/api/chat/messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: "메시지 전송에 실패했습니다." });
    }
  });

  // Mark messages as read
  app.post("/api/chat/conversations/:id/read", async (req: Request, res: Response) => {
    try {
      const { senderType } = req.body;
      await storage.markMessagesAsRead(req.params.id, senderType);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ success: false, error: "읽음 처리에 실패했습니다." });
    }
  });

  // Get or create member chat conversation (member only)
  app.get("/api/chat/member/conversation", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const conversation = await storage.getOrCreateConversationForMember(session.memberId, session.name);
      const messages = await storage.getMessagesByConversation(conversation.id);
      res.json({ success: true, data: { conversation, messages } });
    } catch (error) {
      console.error("Error getting member conversation:", error);
      res.status(500).json({ success: false, error: "채팅 기록을 불러올 수 없습니다." });
    }
  });

  // Send message as member (member only)
  app.post("/api/chat/member/messages", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: "메시지를 입력해주세요." });
      }
      
      const conversation = await storage.getOrCreateConversationForMember(session.memberId, session.name);
      const chatMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderType: 'user',
        senderName: session.name,
        message,
      });
      
      res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
      console.error("Error sending member message:", error);
      res.status(500).json({ success: false, error: "메시지 전송에 실패했습니다." });
    }
  });

  // ==================== FAQ API ====================
  
  // Get all FAQs (public)
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      let faqList;
      if (category) {
        faqList = await storage.getFaqsByCategory(category as string);
      } else {
        faqList = await storage.getAllFaqs();
      }
      res.json({ success: true, data: faqList });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ success: false, error: "FAQ를 불러올 수 없습니다." });
    }
  });

  // Create FAQ (admin only)
  app.post("/api/faqs", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json({ success: true, data: faq });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 생성에 실패했습니다." });
    }
  });

  // Update FAQ (admin only)
  app.put("/api/faqs/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const faq = await storage.updateFaq(req.params.id, req.body);
      if (!faq) {
        return res.status(404).json({ success: false, error: "FAQ를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: faq });
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 수정에 실패했습니다." });
    }
  });

  // Delete FAQ (admin only)
  app.delete("/api/faqs/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFaq(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "FAQ를 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "FAQ가 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 삭제에 실패했습니다." });
    }
  });

  // ==================== FILE UPLOAD API ====================
  
  // Upload review image (admin only) - now saves to database for persistence
  app.post("/api/admin/upload/review-image", requireAdminAuth, (req: Request, res: Response) => {
    reviewImageUpload.single("image")(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, error: "파일 크기는 5MB 이하여야 합니다." });
        }
        return res.status(400).json({ success: false, error: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: "이미지 파일을 선택해주세요." });
      }
      
      try {
        // Convert buffer to base64 and save to database
        const base64Data = req.file.buffer.toString("base64");
        const reviewImage = await storage.createReviewImage({
          data: base64Data,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
        });
        
        // Return URL pointing to database image endpoint
        const imageUrl = `/api/review-images/${reviewImage.id}`;
        res.json({ success: true, data: { imageUrl, imageId: reviewImage.id } });
      } catch (error) {
        console.error("Error saving review image:", error);
        res.status(500).json({ success: false, error: "이미지 저장에 실패했습니다." });
      }
    });
  });
  
  // Serve review images from database
  app.get("/api/review-images/:id", async (req: Request, res: Response) => {
    try {
      const image = await storage.getReviewImage(req.params.id);
      if (!image) {
        return res.status(404).json({ success: false, error: "이미지를 찾을 수 없습니다." });
      }
      
      // Convert base64 back to buffer and send
      const buffer = Buffer.from(image.data, "base64");
      res.setHeader("Content-Type", image.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.setHeader("ETag", `"${image.id}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error serving review image:", error);
      res.status(500).json({ success: false, error: "이미지를 불러올 수 없습니다." });
    }
  });

  // Upload product image (admin only) - saves to database for persistence
  app.post("/api/admin/upload/product-image", requireAdminAuth, (req: Request, res: Response) => {
    reviewImageUpload.single("image")(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, error: "파일 크기는 5MB 이하여야 합니다." });
        }
        return res.status(400).json({ success: false, error: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: "이미지 파일을 선택해주세요." });
      }
      
      try {
        // Convert buffer to base64 and save to database
        const base64Data = req.file.buffer.toString("base64");
        const productImage = await storage.createProductImage({
          data: base64Data,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
        });
        
        // Return URL pointing to database image endpoint
        const imageUrl = `/api/product-images/${productImage.id}`;
        res.json({ success: true, data: { imageUrl, imageId: productImage.id } });
      } catch (error) {
        console.error("Error saving product image:", error);
        res.status(500).json({ success: false, error: "이미지 저장에 실패했습니다." });
      }
    });
  });
  
  // Serve product images from database
  app.get("/api/product-images/:id", async (req: Request, res: Response) => {
    try {
      const image = await storage.getProductImage(req.params.id);
      if (!image) {
        return res.status(404).json({ success: false, error: "이미지를 찾을 수 없습니다." });
      }
      
      // Convert base64 back to buffer and send
      const buffer = Buffer.from(image.data, "base64");
      res.setHeader("Content-Type", image.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.setHeader("ETag", `"${image.id}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error serving product image:", error);
      res.status(500).json({ success: false, error: "이미지를 불러올 수 없습니다." });
    }
  });

  // ==================== REVIEWS API ====================
  
  // Get all reviews (public - visible only)
  app.get("/api/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getVisibleReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "후기를 불러올 수 없습니다." });
    }
  });

  // Get all reviews (admin - includes hidden)
  app.get("/api/admin/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "후기를 불러올 수 없습니다." });
    }
  });

  // Get single review
  app.get("/api/reviews/:id", async (req: Request, res: Response) => {
    try {
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, error: "후기를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ success: false, error: "후기를 불러올 수 없습니다." });
    }
  });

  // Create review (admin only - for manipulation)
  app.post("/api/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ success: false, error: "후기 생성에 실패했습니다." });
    }
  });

  // Update review (admin only)
  app.put("/api/reviews/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      console.log("=== REVIEW UPDATE START ===");
      console.log("Review ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // First check if review exists
      const existingReview = await storage.getReview(req.params.id);
      if (!existingReview) {
        console.log("Review not found:", req.params.id);
        return res.status(404).json({ success: false, error: "후기를 찾을 수 없습니다." });
      }
      console.log("Existing review found:", existingReview.id, existingReview.title);
      
      // Validate and transform the request body
      const updateData: any = {};
      if (req.body.authorName !== undefined) updateData.authorName = req.body.authorName;
      if (req.body.productName !== undefined) updateData.productName = req.body.productName;
      if (req.body.rating !== undefined) updateData.rating = Number(req.body.rating);
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
      if (req.body.isVisible !== undefined) updateData.isVisible = Boolean(req.body.isVisible);
      if (req.body.displayDate !== undefined) {
        const parsedDate = new Date(req.body.displayDate);
        if (!isNaN(parsedDate.getTime())) {
          updateData.displayDate = parsedDate;
        } else {
          console.error("Invalid displayDate:", req.body.displayDate);
        }
      }
      
      console.log("Processed update data:", JSON.stringify(updateData, null, 2));
      
      const review = await storage.updateReview(req.params.id, updateData);
      console.log("Update result:", review ? `Success - ${review.id}` : "Failed - undefined returned");
      
      if (!review) {
        console.error("Update returned undefined for review:", req.params.id);
        return res.status(500).json({ success: false, error: "후기 수정에 실패했습니다. (업데이트 실패)" });
      }
      
      console.log("=== REVIEW UPDATE SUCCESS ===");
      res.json({ success: true, data: review });
    } catch (error) {
      console.error("=== REVIEW UPDATE ERROR ===");
      console.error("Error updating review:", error);
      res.status(500).json({ success: false, error: "후기 수정에 실패했습니다." });
    }
  });

  // Delete review (admin only)
  app.delete("/api/reviews/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteReview(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "후기를 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "후기가 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ success: false, error: "후기 삭제에 실패했습니다." });
    }
  });

  // ==================== NOTICES API ====================
  
  // Get all notices (public - visible only)
  app.get("/api/notices", async (req: Request, res: Response) => {
    try {
      const notices = await storage.getVisibleNotices();
      res.json({ success: true, data: notices });
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  // Get all notices (admin - includes hidden)
  app.get("/api/admin/notices", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const notices = await storage.getAllNotices();
      res.json({ success: true, data: notices });
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  // Get single notice (and increment view count)
  app.get("/api/notices/:id", async (req: Request, res: Response) => {
    try {
      const notice = await storage.getNotice(req.params.id);
      if (!notice) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      await storage.incrementNoticeViewCount(req.params.id);
      res.json({ success: true, data: notice });
    } catch (error) {
      console.error("Error fetching notice:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  // Create notice (admin only)
  app.post("/api/notices", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.status(201).json({ success: true, data: notice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating notice:", error);
      res.status(500).json({ success: false, error: "공지사항 생성에 실패했습니다." });
    }
  });

  // Update notice (admin only)
  app.put("/api/notices/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      console.log("=== NOTICE UPDATE START ===");
      console.log("Notice ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Validate and transform the request body
      const updateData: any = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.content !== undefined) updateData.content = req.body.content;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.isPinned !== undefined) updateData.isPinned = Boolean(req.body.isPinned);
      if (req.body.isVisible !== undefined) updateData.isVisible = Boolean(req.body.isVisible);
      if (req.body.viewCount !== undefined) updateData.viewCount = Number(req.body.viewCount);
      if (req.body.displayDate !== undefined) {
        const parsedDate = new Date(req.body.displayDate);
        if (!isNaN(parsedDate.getTime())) {
          updateData.displayDate = parsedDate;
        }
      }
      
      console.log("Processed update data:", JSON.stringify(updateData, null, 2));
      
      const notice = await storage.updateNotice(req.params.id, updateData);
      if (!notice) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      
      console.log("=== NOTICE UPDATE SUCCESS ===");
      res.json({ success: true, data: notice });
    } catch (error) {
      console.error("=== NOTICE UPDATE ERROR ===");
      console.error("Error updating notice:", error);
      res.status(500).json({ success: false, error: "공지사항 수정에 실패했습니다." });
    }
  });

  // Delete notice (admin only)
  app.delete("/api/notices/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNotice(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "공지사항이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ success: false, error: "공지사항 삭제에 실패했습니다." });
    }
  });

  // ==================== DEPOSIT ACCOUNT SETTINGS ====================

  // Get deposit account info (for deposit page)
  app.get("/api/settings/deposit-account", async (req: Request, res: Response) => {
    try {
      const bankName = await storage.getSiteSetting("deposit_bank_name");
      const accountNumber = await storage.getSiteSetting("deposit_account_number");
      const accountHolder = await storage.getSiteSetting("deposit_account_holder");
      
      if (!bankName || !accountNumber || !accountHolder) {
        return res.status(404).json({ error: "입금 계좌가 설정되지 않았습니다." });
      }
      
      res.json({
        id: "deposit-account",
        bankName: bankName.value,
        accountNumber: accountNumber.value,
        accountHolder: accountHolder.value,
        isActive: true,
      });
    } catch (error) {
      console.error("Error fetching deposit account:", error);
      res.status(500).json({ error: "계좌 정보를 불러올 수 없습니다." });
    }
  });

  // Update deposit account (admin)
  app.put("/api/admin/settings/deposit-account", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { bankName, accountNumber, accountHolder } = req.body;
      
      if (!bankName || !accountNumber || !accountHolder) {
        return res.status(400).json({ error: "모든 필드를 입력해주세요." });
      }
      
      await storage.setSiteSetting("deposit_bank_name", bankName, "입금 은행명");
      await storage.setSiteSetting("deposit_account_number", accountNumber, "입금 계좌번호");
      await storage.setSiteSetting("deposit_account_holder", accountHolder, "예금주");
      
      res.json({
        success: true,
        data: {
          id: "deposit-account",
          bankName,
          accountNumber,
          accountHolder,
          isActive: true,
        }
      });
    } catch (error) {
      console.error("Error updating deposit account:", error);
      res.status(500).json({ error: "계좌 정보 저장에 실패했습니다." });
    }
  });

  // Get member's deposit requests
  app.get("/api/deposit-requests/my", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "로그인이 필요합니다." });
      }
      
      const token = authHeader.split(" ")[1];
      const [memberId] = token.split(":");
      
      const requests = await storage.getDepositRequestsByMember(memberId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching my deposit requests:", error);
      res.status(500).json({ error: "입금신청 내역을 불러올 수 없습니다." });
    }
  });

  // Create deposit request
  app.post("/api/deposit-requests", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "로그인이 필요합니다." });
      }
      
      const { memberId, memberName, memberEmail, amount, bankName, accountNumber, depositorName } = req.body;
      
      if (!amount || amount < 10000) {
        return res.status(400).json({ error: "최소 10,000원 이상 입금 가능합니다." });
      }
      
      if (!depositorName) {
        return res.status(400).json({ error: "입금자명을 입력해주세요." });
      }
      
      const request = await storage.createDepositRequest({
        memberId,
        memberName,
        memberEmail,
        amount,
        bankName: bankName || "",
        accountNumber: accountNumber || "",
        depositorName,
        status: "pending",
      });
      
      res.json({ success: true, data: request });
    } catch (error) {
      console.error("Error creating deposit request:", error);
      res.status(500).json({ error: "입금신청에 실패했습니다." });
    }
  });

  // ==================== SITE SETTINGS API ====================
  
  // Get all site settings (admin only)
  app.get("/api/admin/settings", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ success: false, error: "설정을 불러올 수 없습니다." });
    }
  });

  // Get single site setting (public - for things like KakaoTalk link)
  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSiteSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ success: false, error: "설정을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Error fetching site setting:", error);
      res.status(500).json({ success: false, error: "설정을 불러올 수 없습니다." });
    }
  });

  // Update site setting (admin only)
  app.put("/api/admin/settings/:key", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { value, description } = req.body;
      if (!value) {
        return res.status(400).json({ success: false, error: "값이 필요합니다." });
      }
      const setting = await storage.setSiteSetting(req.params.key, value, description);
      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ success: false, error: "설정 저장에 실패했습니다." });
    }
  });

  // ==================== ORDERS API ====================
  
  // Create order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const {
        memberId,
        memberName,
        memberEmail,
        memberPhone,
        shippingName,
        shippingPhone,
        shippingZipcode,
        shippingAddress,
        shippingAddressDetail,
        shippingMemo,
        productId,
        productName,
        productPrice,
        quantity,
        totalAmount,
      } = req.body;
      
      if (!memberName || !memberEmail || !memberPhone) {
        return res.status(400).json({ success: false, error: "주문자 정보를 입력해주세요." });
      }
      
      if (!shippingName || !shippingPhone || !shippingAddress) {
        return res.status(400).json({ success: false, error: "배송지 정보를 입력해주세요." });
      }
      
      if (!productId || !productName || !productPrice || !totalAmount) {
        return res.status(400).json({ success: false, error: "상품 정보가 필요합니다." });
      }
      
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const orderData = {
        orderNumber,
        memberId: memberId || null,
        memberName: String(memberName).trim(),
        memberEmail: String(memberEmail).trim(),
        memberPhone: String(memberPhone).trim(),
        shippingName: String(shippingName).trim(),
        shippingPhone: String(shippingPhone).trim(),
        shippingAddress: String(shippingAddress).trim(),
        shippingAddressDetail: shippingAddressDetail ? String(shippingAddressDetail).trim() : null,
        shippingZipcode: shippingZipcode ? String(shippingZipcode).trim() : null,
        shippingMemo: shippingMemo ? String(shippingMemo).trim() : null,
        productId: String(productId),
        productName: String(productName),
        productPrice: String(productPrice),
        quantity: parseInt(quantity) || 1,
        totalAmount: String(totalAmount),
        status: "pending",
        paymentStatus: "pending",
      };
      
      const validationResult = insertOrderSchema.safeParse(orderData);
      if (!validationResult.success) {
        console.error("Order validation error:", validationResult.error);
        return res.status(400).json({ success: false, error: "주문 정보가 올바르지 않습니다." });
      }
      
      const order = await storage.createOrder(validationResult.data);
      
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, error: "주문 처리 중 오류가 발생했습니다." });
    }
  });

  // Get all orders (admin only)
  app.get("/api/admin/orders", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "주문 목록을 불러올 수 없습니다." });
    }
  });

  // Update order status (admin only)
  app.put("/api/admin/orders/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, paymentStatus, adminNote } = req.body;
      const order = await storage.updateOrder(req.params.id, {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(adminNote !== undefined && { adminNote }),
      });
      
      if (!order) {
        return res.status(404).json({ success: false, error: "주문을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ success: false, error: "주문 수정 중 오류가 발생했습니다." });
    }
  });

  // Get member's orders
  app.get("/api/members/orders", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const memberIdFromQuery = req.query.memberId as string;
    
    let memberId: string | null = null;
    
    // Try to get memberId from session first
    if (token) {
      const session = await getMemberFromToken(token);
      if (session) {
        memberId = session.memberId;
      }
    }
    
    // Fallback to memberId from query parameter if session expired
    if (!memberId && memberIdFromQuery) {
      memberId = memberIdFromQuery;
    }
    
    if (!memberId) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const orders = await storage.getOrdersByMember(memberId);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching member orders:", error);
      res.status(500).json({ success: false, error: "주문 목록을 불러올 수 없습니다." });
    }
  });

  // ==================== CRAWLING API ====================
  const { getCrawlSources, startCrawl, getCrawlSession, getCrawlResults, deleteCrawlSession } = await import("./crawlers");

  // Get available crawl sources (categories, subcategories, sites)
  app.get("/api/admin/crawling/sources", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const sources = await getCrawlSources();
      res.json({ success: true, data: sources });
    } catch (error) {
      console.error("Error fetching crawl sources:", error);
      res.status(500).json({ success: false, error: "크롤링 소스를 불러올 수 없습니다." });
    }
  });

  // Start a new crawl
  app.post("/api/admin/crawling/crawl", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { category, subcategory, site, limit } = req.body;
      
      if (!category || !subcategory || !site) {
        return res.status(400).json({ 
          success: false, 
          error: "카테고리, 소분류, 사이트를 모두 선택해주세요." 
        });
      }
      
      // limit = 0 means fetch ALL products from the category
      const effectiveLimit = limit === 0 ? 0 : (limit || 20);
      const result = await startCrawl({ category, subcategory, site, limit: effectiveLimit });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error starting crawl:", error);
      res.status(500).json({ success: false, error: "크롤링을 시작할 수 없습니다." });
    }
  });

  // Get crawl session status
  app.get("/api/admin/crawling/session/:sessionId", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = getCrawlSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, error: "크롤링 세션을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: session });
    } catch (error) {
      console.error("Error fetching crawl session:", error);
      res.status(500).json({ success: false, error: "크롤링 세션을 불러올 수 없습니다." });
    }
  });

  // Get crawl results with pagination
  app.get("/api/admin/crawling/results/:sessionId", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      
      const results = getCrawlResults(sessionId, page, pageSize);
      
      if (!results.session) {
        return res.status(404).json({ success: false, error: "크롤링 세션을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Error fetching crawl results:", error);
      res.status(500).json({ success: false, error: "크롤링 결과를 불러올 수 없습니다." });
    }
  });

  // Import selected products from crawl session
  app.post("/api/admin/crawling/import", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      console.log("=== IMPORT REQUEST RECEIVED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { sessionId, productIndices } = req.body;
      
      console.log("Session ID:", sessionId);
      console.log("Product Indices:", productIndices);
      
      if (!sessionId || !Array.isArray(productIndices) || productIndices.length === 0) {
        console.log("Validation failed - missing sessionId or productIndices");
        return res.status(400).json({ 
          success: false, 
          error: "세션 ID와 가져올 상품 인덱스를 지정해주세요." 
        });
      }
      
      const results = getCrawlResults(sessionId, 1, 1000);
      console.log("Crawl results found:", results.session ? "Yes" : "No");
      console.log("Session status:", results.session?.status);
      console.log("Total products in session:", results.session?.products?.length);
      
      if (!results.session || results.session.status !== 'completed') {
        console.log("Session not completed or not found");
        return res.status(400).json({ 
          success: false, 
          error: "완료된 크롤링 세션이 아닙니다." 
        });
      }
      
      const allProducts = results.session.products;
      const selectedProducts = productIndices
        .filter((idx: number) => idx >= 0 && idx < allProducts.length)
        .map((idx: number) => allProducts[idx]);
      
      if (selectedProducts.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "가져올 상품이 없습니다." 
        });
      }
      
      const importedProducts = [];
      const errors: string[] = [];
      
      for (const draft of selectedProducts) {
        try {
          console.log("Importing product:", draft.name);
          
          const imageUrls = Array.isArray(draft.imageUrls) ? draft.imageUrls : [];
          const primaryImageUrl = draft.imageUrl || (imageUrls.length > 0 ? imageUrls[0] : undefined);
          
          const productData = {
            name: draft.name || '상품명 없음',
            weight: draft.weight || '-',
            purity: draft.purity || '-',
            price: typeof draft.price === 'string' ? draft.price : String(draft.price || '0'),
            originalPrice: draft.originalPrice ? String(draft.originalPrice) : undefined,
            discountPercent: typeof draft.discountPercent === 'number' ? draft.discountPercent : undefined,
            imageUrl: primaryImageUrl,
            imageUrls: imageUrls,
            category: draft.category || '기타',
            subcategory: draft.subcategory || undefined,
            description: draft.description || `${draft.sourceSite}에서 가져온 상품입니다.`,
            isBest: Boolean(draft.isBest),
            isNew: draft.isNew !== false,
            isHot: Boolean(draft.isHot),
            useFixedPrice: draft.useFixedPrice !== false,
          };
          
          console.log("Product data:", JSON.stringify(productData, null, 2));
          
          const product = await storage.createProduct(productData);
          console.log("Product created successfully:", product.id);
          importedProducts.push(product);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.error("Error importing product:", draft.name, errorMsg);
          errors.push(`${draft.name}: ${errorMsg}`);
        }
      }
      
      if (errors.length > 0) {
        console.log("Import errors:", errors);
      }
      
      res.json({ 
        success: true, 
        data: { 
          imported: importedProducts.length,
          total: selectedProducts.length,
          products: importedProducts 
        } 
      });
    } catch (error) {
      console.error("Error importing products:", error);
      res.status(500).json({ success: false, error: "상품 가져오기 중 오류가 발생했습니다." });
    }
  });

  // Delete crawl session
  app.delete("/api/admin/crawling/session/:sessionId", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const deleted = deleteCrawlSession(sessionId);
      
      if (!deleted) {
        return res.status(404).json({ success: false, error: "크롤링 세션을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, message: "크롤링 세션이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting crawl session:", error);
      res.status(500).json({ success: false, error: "크롤링 세션 삭제 중 오류가 발생했습니다." });
    }
  });

  // SSE endpoint for crawl progress (accepts token via query param for EventSource compatibility)
  app.get("/api/admin/crawling/progress", (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token || !isValidSession(token)) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    // Send current state immediately
    res.write(`data: ${JSON.stringify(crawlProgress)}\n\n`);
    
    // Add to clients list
    progressClients.push(res);
    
    // Remove on close
    req.on('close', () => {
      const index = progressClients.indexOf(res);
      if (index > -1) {
        progressClients.splice(index, 1);
      }
    });
  });

  // Get current crawl status (non-SSE)
  app.get("/api/admin/crawling/status", requireAdminAuth, (req: Request, res: Response) => {
    res.json({ success: true, data: crawlProgress });
  });

  // Delete all products
  app.delete("/api/admin/products/all", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      console.log("=== DELETE ALL PRODUCTS STARTED ===");
      const deletedCount = await storage.deleteAllProducts();
      console.log(`=== DELETED ${deletedCount} PRODUCTS ===`);
      
      res.json({
        success: true,
        data: { deletedCount },
        message: `${deletedCount}개의 상품이 삭제되었습니다.`
      });
    } catch (error) {
      console.error("Error deleting all products:", error);
      res.status(500).json({ success: false, error: "전체 상품 삭제 중 오류가 발생했습니다." });
    }
  });

  // Batch crawl vivian-mall.com - automatic full crawling
  app.post("/api/admin/crawling/batch-vivian", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { productsPerCategory = 20, autoImport = true } = req.body;
      
      console.log("=== BATCH CRAWL VIVIAN-MALL STARTED ===");
      console.log("Products per category:", productsPerCategory);
      console.log("Auto import:", autoImport);
      
      const { crawlVivianCategory, getVivianCategoryName, VIVIAN_CATEGORIES } = await import('./crawlers/vivian-crawler');
      
      const categoryIds = Object.keys(VIVIAN_CATEGORIES).map(Number);
      const totalCategories = categoryIds.length;
      
      // Reset and initialize progress immediately
      resetCrawlProgress();
      updateCrawlProgress({
        status: 'crawling',
        currentCategory: '준비 중',
        currentCategoryIndex: 0,
        totalCategories,
        productsFound: 0,
        productsImported: 0,
        currentProduct: '',
        message: '크롤링을 시작합니다...',
        startedAt: new Date()
      });
      
      let totalCrawled = 0;
      let totalImported = 0;
      const importedProducts: any[] = [];
      const results: any[] = [];
      
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryId = categoryIds[i];
        const categoryName = getVivianCategoryName(categoryId);
        
        updateCrawlProgress({
          status: 'crawling',
          currentCategory: categoryName,
          currentCategoryIndex: i + 1,
          message: `${categoryName} 카테고리 크롤링 중... (${i + 1}/${totalCategories})`
        });
        
        const result = await crawlVivianCategory(categoryId, productsPerCategory);
        results.push(result);
        totalCrawled += result.products.length;
        
        updateCrawlProgress({
          productsFound: totalCrawled,
          message: `${categoryName}에서 ${result.products.length}개 상품 발견`
        });
        
        if (autoImport && result.success && result.products.length > 0) {
          updateCrawlProgress({
            status: 'importing',
            message: `${categoryName} 상품 등록 중...`
          });
          
          for (const product of result.products) {
            try {
              updateCrawlProgress({
                currentProduct: product.name?.substring(0, 30) || '상품',
                message: `등록 중: ${product.name?.substring(0, 20) || '상품'}...`
              });
              
              const allImages = product.imageUrls && product.imageUrls.length > 0 
                ? product.imageUrls 
                : (product.imageUrl ? [product.imageUrl] : []);
              
              const descImages = product.descriptionImages || [];
              
              const productData = {
                name: product.name || '상품명 없음',
                weight: '-',
                purity: '-',
                price: product.price || '0',
                originalPrice: product.originalPrice,
                imageUrl: allImages[0] || product.imageUrl,
                imageUrls: allImages,
                descriptionImageUrls: descImages,
                category: product.category,
                description: product.description || `에스텔라 프리미엄 상품입니다.`,
                isBest: Math.random() > 0.7,
                isNew: true,
                isHot: Math.random() > 0.8,
                useFixedPrice: true,
                sourceSite: 'vivian-mall.com',
                sourceUrl: product.sourceUrl
              };
              
              const savedProduct = await storage.createProduct(productData);
              importedProducts.push(savedProduct);
              totalImported++;
              
              updateCrawlProgress({
                productsImported: totalImported
              });
            } catch (e) {
              console.error("Error importing batch product:", e);
            }
          }
        }
      }
      
      console.log(`=== BATCH CRAWL COMPLETE ===`);
      console.log(`Total crawled: ${totalCrawled}, Total imported: ${totalImported}`);
      
      updateCrawlProgress({
        status: 'completed',
        message: `완료! ${totalCrawled}개 크롤링, ${totalImported}개 등록됨`,
        completedAt: new Date()
      });
      
      res.json({
        success: true,
        data: {
          totalCrawled,
          totalImported,
          results: results.map(r => ({
            category: r.category,
            categoryName: getVivianCategoryName(r.categoryId),
            productCount: r.products.length,
            success: r.success,
            error: r.error
          }))
        }
      });
    } catch (error) {
      console.error("Batch crawl error:", error);
      updateCrawlProgress({
        status: 'error',
        message: '크롤링 중 오류가 발생했습니다.'
      });
      res.status(500).json({ 
        success: false, 
        error: "배치 크롤링 중 오류가 발생했습니다." 
      });
    }
  });

  // Crawl single category from vivian-mall
  app.post("/api/admin/crawling/vivian-category", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { 
        categoryId, 
        limit = 0, 
        autoImport = true,
        subcategory,  // Admin-selected subcategory (optional)
        targetCategory  // Admin-selected target Estella category (optional)
      } = req.body;
      
      const { crawlVivianCategory, getVivianCategoryName } = await import('./crawlers/vivian-crawler');
      
      // limit = 0 means fetch ALL products
      const effectiveLimit = limit === 0 ? 0 : limit;
      
      // Pass subcategory and targetCategory options to crawler
      const crawlOptions = {
        subcategory: subcategory || undefined,
        targetCategory: targetCategory || undefined
      };
      
      console.log(`[Admin Crawl] Starting vivian category ${categoryId}, limit=${effectiveLimit}, subcategory=${subcategory || 'auto'}, targetCategory=${targetCategory || 'auto'}`);
      
      const result = await crawlVivianCategory(categoryId, effectiveLimit, crawlOptions);
      
      let importedCount = 0;
      
      if (autoImport && result.success && result.products.length > 0) {
        for (const product of result.products) {
          try {
            const allImages = product.imageUrls && product.imageUrls.length > 0 
              ? product.imageUrls 
              : (product.imageUrl ? [product.imageUrl] : []);
            
            const descImages = product.descriptionImages || [];
            
            const productData = {
              name: product.name || '상품명 없음',
              weight: '-',
              purity: '-',
              price: product.price || '0',
              originalPrice: product.originalPrice,
              imageUrl: allImages[0] || product.imageUrl,
              imageUrls: allImages,
              descriptionImageUrls: descImages,
              category: product.category,
              subcategory: product.subcategory,
              description: product.description || `에스텔라 프리미엄 상품입니다.`,
              isBest: Math.random() > 0.7,
              isNew: true,
              isHot: Math.random() > 0.8,
              useFixedPrice: true,
              sourceSite: 'vivian-mall.com',
              sourceUrl: product.sourceUrl
            };
            
            await storage.createProduct(productData);
            importedCount++;
          } catch (e) {
            console.error("Error importing product:", e);
          }
        }
      }
      
      res.json({
        success: true,
        data: {
          category: result.category,
          categoryName: getVivianCategoryName(result.categoryId),
          productCount: result.products.length,
          importedCount,
          products: result.products
        }
      });
    } catch (error) {
      console.error("Category crawl error:", error);
      res.status(500).json({ 
        success: false, 
        error: "카테고리 크롤링 중 오류가 발생했습니다." 
      });
    }
  });

  // Get vivian-mall category list
  app.get("/api/admin/crawling/vivian-categories", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { getVivianCategoryIds, getVivianCategoryName } = await import('./crawlers/vivian-crawler');
      
      const categoryIds = getVivianCategoryIds();
      const categories = categoryIds.map(id => ({
        id,
        name: getVivianCategoryName(id)
      }));
      
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error("Error getting vivian categories:", error);
      res.status(500).json({ success: false, error: "카테고리 조회 중 오류가 발생했습니다." });
    }
  });

  return httpServer;
}
