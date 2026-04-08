import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import YahooFinance from "yahoo-finance2";
import cors from "cors";

const yahooFinance = new (YahooFinance as any)();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/finance/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { period1, period2 } = req.query;
      
      // Default to last 6 months if no period provided
      const end = period2 ? new Date(period2 as string) : new Date();
      const start = period1 ? new Date(period1 as string) : new Date();
      if (!period1) start.setMonth(end.getMonth() - 6);

      const queryOptions = {
        period1: start,
        period2: end,
        interval: "1d" as any,
      };

      const result = await yahooFinance.historical(symbol, queryOptions);
      const quote = await yahooFinance.quote(symbol);
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData"]
      });
      const searchResult = await yahooFinance.search(symbol);
      const news = searchResult.news || [];

      res.json({ historical: result, quote, summary, news });
    } catch (error: any) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ error: error.message || "Failed to fetch data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
