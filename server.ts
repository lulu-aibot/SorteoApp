import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  console.log("Servidor iniciando...");
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  console.log(`Puerto detectado: ${PORT}`);

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
      
      let browser;
      try {
        console.log("Iniciando Chromium...");
        browser = await chromium.launch({ headless: true });
      } catch (browserError: any) {
        console.error("Error al iniciar Chromium:", browserError.message);
        if (browserError.message.includes("Executable doesn't exist") || browserError.message.includes("browserType.launch")) {
           throw new Error("Chromium no está instalado correctamente en este entorno. En desarrollo ejecuta 'npx playwright install chromium'. En Vercel/Serverless necesitas @sparticuz/chromium o alojarlo en un contenedor (Railway/Render).");
        }
        throw browserError;
      }

      const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();

      console.log("Abriendo Instagram...");
      // Navegar a la publicación con timeout de 15 segundos
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      
      console.log("Esperando comentarios (dinámicamente)...");
      try {
        await Promise.race([
          page.waitForSelector('article ul', { timeout: 10000 }),
          page.waitForSelector('main ul', { timeout: 10000 }),
          page.waitForSelector('ul', { timeout: 10000 })
        ]);
        console.log("Selectores base encontrados.");
      } catch (e) {
        console.log("Timeout esperando selector de comentarios, procediendo a intentar extraer de todas formas...");
      }

      // Una pausa para asegurar que el listado de comentarios de React terminó de inflarse
      await page.waitForTimeout(4000);

      await page.screenshot({ path: 'debug-instagram.png' });

      console.log("Ejecutando script de extracción en el navegador...");

      const comments = await page.evaluate(() => {
        // Obtenemos los elementos de las diferentes estructuras posibles en la versión web de Instagram (Post vs Reel)
        const selectors = [
          'article ul li',
          'main ul li',
          'ul.x1qjc9v5 li', // Clases ofuscadas comunes en FB/IG
          'div.x1n2onr6 ul li'
        ];
        
        let elements: Element[] = [];
        for (const selector of selectors) {
           const nodes = Array.from(document.querySelectorAll(selector));
           // Nos quedamos con el selector que más elementos devuelva
           if (nodes.length > elements.length) {
               elements = nodes;
           }
        }

        const extracted = [];
        
        for (const el of elements) {
            // Ignorar basura (si el li está vacío o solo tiene un botón)
            if (!el.textContent || el.textContent.trim() === '') continue;

            const links = Array.from(el.querySelectorAll('a'));
            
            // Intenta encontrar el enlace que contiene el username
            const usernameLink = links.find(a => a.textContent && a.textContent.trim().length > 0 && !a.querySelector('img'));
            
            let username = usernameLink ? usernameLink.textContent.trim() : null;
            
            if (!username) {
                // Selector fallback h3
                const h3 = el.querySelector('h3');
                if (h3) username = h3.textContent?.trim() || null;
            }

            if (!username) continue; // No podemos seguir sin un username

            // Extraemos texto de los spans
            const spans = Array.from(el.querySelectorAll('span'));
            let commentText = '';
            
            const ignoreExact = ['Responder', 'Ver traducción', 'Ocultar respuestas', 'Ver respuestas', 'Me gusta', 'Ver estadísticas'];
            
            for (const span of spans) {
                 const text = span.textContent?.trim();
                 if (!text) continue;
                 
                 // Ignorar textos de interfaces de IG
                 if (text === username || ignoreExact.includes(text) || text.includes('Me gusta')) {
                     continue;
                 }
                 
                 // Ignorar fechas genéricas (1 s, 2 min, 10 h, 5 sem) si son cortas
                 if (text.length <= 6 && /^\d+\s*(s|min|h|d|sem|w|m)$/i.test(text)) {
                     continue;
                 }
                 
                 // Evitar duplicar
                 if (!commentText.includes(text)) {
                     commentText += (commentText ? ' ' : '') + text;
                 }
            }
            
            commentText = commentText.trim();
            if (commentText) {
                // Verificar que no sea duplicado exacto
                const exists = extracted.find(c => c.username === username && c.comment === commentText);
                if (!exists) {
                    extracted.push({ username, comment: commentText });
                }
            }
        }
        
        return extracted;
      });

      console.log(`Se encontraron ${comments.length} comentarios reales en la vista actual.`);

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
    console.log(`Express escuchando en el puerto ${PORT}...`);
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
