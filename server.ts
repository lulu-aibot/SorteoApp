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
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();

      // Navegar a la publicación con timeout de 15 segundos
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      
      // Esperar un poco a que Instagram renderice el contenido dinámico (React)
      await page.waitForTimeout(3000);

      const comments = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('ul li'));
        const extracted = [];
        
        for (const el of elements) {
            const links = Array.from(el.querySelectorAll('a'));
            if (links.length === 0) continue;
            
            // Intenta encontrar el enlace que contiene el username (suele ser texto y sin imágenes dentro)
            const usernameLink = links.find(a => a.textContent && a.textContent.trim().length > 0 && !a.querySelector('img'));
            if (!usernameLink) continue;
            
            const username = usernameLink.textContent.trim();
            
            // Buscar texto del comentario (buscamos un span largo que no sea de UI)
            const spans = Array.from(el.querySelectorAll('span'));
            let commentText = '';
            for (const span of spans) {
                 const text = span.textContent?.trim();
                 // Evitar textos de la interfaz de Instagram
                 if (text && text !== username && !text.includes('Responder') && !text.includes('Me gusta') && !text.includes('Ver traducción')) {
                     // Nos quedamos con el trozo de texto más largo para evitar quedarnos con cosas sueltas
                     if (text.length > commentText.length) {
                         commentText = text;
                     }
                 }
            }
            
            if (username && commentText) {
                extracted.push({ username, comment: commentText });
            }
        }
        
        // Normalmente el primer 'li' es la descripción del post, la removemos si hay más elementos
        return extracted.length > 1 ? extracted.slice(1) : extracted;
      });

      await browser.close();

      // Enviar resultados reales. Si Instagram bloquea (login wall), puede retornar pocos/ninguno.
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
