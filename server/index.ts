import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { setupChatWebSocket } from "./chatSocket";

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const httpServer = createServer(app);

setupChatWebSocket(httpServer);

// Serve attached_assets folder for generated images
app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Handle favicon.ico requests by redirecting to favicon.png
app.get("/favicon.ico", (_req, res) => {
  res.redirect(301, "/favicon.png");
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function restoreDbFromGithubIfEmpty() {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const dbUrl = process.env.NEON_DATABASE_URL;
  if (!token || !dbUrl) return;
  try {
    // Only restore if DB looks empty (no products)
    const { db } = await import("./db");
    const { products } = await import("../shared/schema");
    const { sql } = await import("drizzle-orm");
    const rows = await db.select({ count: sql<number>`count(*)` }).from(products);
    const count = Number(rows[0]?.count ?? 0);
    if (count > 0) {
      console.log(`[DB Restore] DB에 상품 ${count}개 있음 — 복원 건너뜀`);
      return;
    }

    console.log("[DB Restore] DB가 비어 있음 — GitHub에서 db-seed.sql 다운로드 시도...");
    const getRes = await fetch(
      "https://api.github.com/repos/salzajebal/nuvella/contents/db-seed.sql",
      { headers: { Authorization: `token ${token}`, "User-Agent": "eclatshop-app" } }
    );
    if (!getRes.ok) {
      console.log("[DB Restore] GitHub에 db-seed.sql 없음 — 복원 건너뜀");
      return;
    }
    const meta = await getRes.json() as any;
    const sql_content = Buffer.from(meta.content, "base64").toString("utf8");

    const { writeFileSync } = await import("fs");
    const { execSync } = await import("child_process");
    writeFileSync("/tmp/db-seed.sql", sql_content);
    execSync(`psql "${dbUrl}" -f /tmp/db-seed.sql`, { stdio: "pipe" });
    console.log("[DB Restore] DB 복원 완료 ✓");
  } catch (err: any) {
    console.error("[DB Restore] 오류:", err.message);
  }
}

(async () => {
  await restoreDbFromGithubIfEmpty();
  await registerRoutes(httpServer, app);

  // Global error handler - must always return JSON
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`[ERROR] ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }

    // Always return JSON response
    if (!res.headersSent) {
      res.status(status).json({ 
        success: false, 
        error: message,
        message: message 
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
