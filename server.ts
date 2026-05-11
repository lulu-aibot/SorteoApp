import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON
  app.use(express.json());

  // ======================================
  // Rutas de nuestra API (Backend)
  // ======================================
  app.post("/api/comments", async (req, res) => {
    const { url } = req.body;

    // Validación básica
    if (!url) {
      return res.status(400).json({ error: "La URL es requerida" });
    }

    try {
      // Iniciar Playwright
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();

      console.log("Abriendo Instagram...");
      // Navegar a la publicación con timeout de 15 segundos
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      
      console.log("Esperando comentarios...");
      await page.waitForSelector('article', { timeout: 15000 }).catch(() => console.log('Timeout esperando article'));
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'debug-instagram.png' });

      const html = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
      console.log("DOM inicial (3000 chars):");
      console.log(html);

      const comments = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('article ul li'));
        const extracted = [];
        
        for (const el of elements) {
            const links = Array.from(el.querySelectorAll('a'));
            if (links.length === 0) continue;
            
            const usernameLink = links.find(a => a.textContent && a.textContent.trim().length > 0 && !a.querySelector('img'));
            const username = usernameLink ? usernameLink.textContent.trim() : 'usuario_desconocido';
            
            const spans = Array.from(el.querySelectorAll('span'));
            let commentText = '';
            for (const span of spans) {
                 const text = span.textContent?.trim();
                 if (text && text !== username) {
                     commentText += ' ' + text;
                 }
            }
            
            commentText = commentText.trim();
            if (commentText) {
                extracted.push({ username, comment: commentText });
            }
        }
        
        return extracted;
      });

      console.log(`Comentarios encontrados: ${comments.length}`);

      await browser.close();

      res.json(comments);
    } catch (error: any) {
      console.error("Error extrayendo comentarios:", error.message);
      res.status(500).json({ error: "No se pudieron extraer los comentarios o se alcanzó el timeout." });
    }
  });

  // ======================================
  // Vite Middleware (Frontend Dev & Prod Server)
  // ======================================
  if (process.env.NODE_ENV !== "production") {
    // Modo Desarrollo
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Modo Producción
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
