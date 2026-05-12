import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  console.log("Servidor iniciando...");
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  
  console.log(`Puerto detectado (env): ${process.env.PORT}, usando: ${PORT}`);

  // Middleware para parsear JSON
  app.use(express.json());

  // ======================================
  // Rutas de nuestra API (Backend)
  // ======================================
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

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
      
      console.log("Comprobando popup de Instagram...");
      try {
        await page.waitForTimeout(3000); // 3 segundos para que aparezca el popup
        const closeSelectors = [
          'svg[aria-label="Cerrar"]',
          'svg[aria-label="Close"]',
          'div[role="dialog"] svg[aria-label="Cerrar"]',
          'div[role="dialog"] svg[aria-label="Close"]',
          'div[role="dialog"] [role="button"]',
          'button svg',
          '[role="button"] svg'
        ];

        let popupCerrado = false;
        
        // Buscar y clickear el primer selector que funcione y sea visible
        for (const selector of closeSelectors) {
          // Buscamos elementos
          const elements = await page.$$(selector);
          for (const el of elements) {
             const isVisible = await el.isVisible();
             if (isVisible) {
                console.log(`popup detectado (selector: ${selector})`);
                await el.click({ force: true });
                console.log("popup cerrado");
                popupCerrado = true;
                await page.waitForTimeout(2000); // 2 segundos después de cerrar
                break;
             }
          }
          if (popupCerrado) break;
        }
        
        if (!popupCerrado) {
            console.log("No se detectó el popup (o no bloquea la vista).");
        }
      } catch (e) {
        console.log("Error al manejar popup (ignorando):", e);
      }

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
      await page.waitForTimeout(5000);

      try {
        console.log("Intentando click automático en 'Ver más comentarios'...");
        // Intentar hacer click en svg u otras instancias que indiquen cargar más
        const svgClick = await page.locator('svg[aria-label="Cargar más comentarios"], svg[aria-label="Load more comments"]').first().click({ timeout: 2000 }).catch(() => false);
        if (svgClick === false) {
           await page.locator('text=/.*más comentarios.*/i').first().click({ timeout: 2000 }).catch(() => false);
        }
      } catch (e) {
        console.log("No se pudo hacer click en 'Ver más comentarios'", e);
      }
      
      // Una pausa post-click
      await page.waitForTimeout(2000);

      // Logs de elementos encontrados
      const divCount = await page.$$eval('div', els => els.length).catch(() => 0);
      const spanCount = await page.$$eval('span', els => els.length).catch(() => 0);
      const articleCount = await page.$$eval('article', els => els.length).catch(() => 0);
      const sectionCount = await page.$$eval('section', els => els.length).catch(() => 0);
      const buttonCount = await page.$$eval('button', els => els.length).catch(() => 0);
      
      console.log(`Cantidad de div encontrados: ${divCount}`);
      console.log(`Cantidad de spans encontrados: ${spanCount}`);
      console.log(`Cantidad de article encontrados: ${articleCount}`);
      console.log(`Cantidad de section encontrados: ${sectionCount}`);
      console.log(`Cantidad de button encontrados: ${buttonCount}`);

      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 5000));
      console.log("=== BODY INNER TEXT (first 5000 chars) ===");
      console.log(bodyText);
      console.log("==========================================");

      try {
        console.log("Buscando botones 'comments', 'comentarios', 'View all comments', 'Ver los comentarios'...");
        const possibleTexts = [
          'comments', 'comentarios', 'view all comments', 'ver los comentarios',
          'ver todos los comentarios', 'view comments', 'ver comentarios'
        ];
        
        const buttonsClicked = await page.evaluate((texts) => {
          let clicked = false;
          // Buscar en elementos clickeables potenciales
          const elements = Array.from(document.querySelectorAll('button, div[role="button"], span, svg'));
          for (const el of elements) {
            const textContent = el.textContent?.trim().toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            
            if (texts.some(t => textContent.includes(t) || ariaLabel.includes(t))) {
               (el as HTMLElement).click();
               clicked = true;
               console.log("Clickeado interno en:", textContent || ariaLabel);
               break;
            }
          }
          return clicked;
        }, possibleTexts);
        console.log(`¿Click en algún botón de comentarios? ${buttonsClicked}`);
      } catch (e) {
        console.log("Error buscando/clickeando botones de comentarios:", e);
      }

      await page.waitForTimeout(5000);

      const htmlContent = await page.content();
      await fs.promises.writeFile('debug-instagram.html', htmlContent, 'utf-8');
      console.log("HTML guardado en debug-instagram.html");

      await page.screenshot({ path: 'debug-instagram.png' });

      try {
        console.log("Ejecutando script de extracción en el navegador...");

        const comments = await page.evaluate(() => {
          const result: {username: string, comment: string}[] = [];
          try {
            const text = document.body.innerText || '';
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            const isNoise = (line: string) => {
                const lower = line.toLowerCase();
                const exactNoise = [
                   'like', 'reply', 'log in', 'sign up', 'meta', 'threads', 'api', 'privacy',
                   'locations', 'terms', 'top accounts', 'hashtags', 'language', 'english',
                   'iniciar sesión', 'registrarte', 'me gusta', 'responder', 'ver todos',
                   'ver más', 'view more', 'follow', 'seguir', 'verified', 'verificado'
                ];
                if (exactNoise.includes(lower)) return true;
                if (lower.includes(' likes') || lower.includes(' me gusta')) return true;
                if (/^\d+\s*like[s]?$/.test(lower)) return true;
                if (/^\d+\s*[hdwmsy]?$/.test(lower)) return true; // 2d, 3w, 5h, 15m, 10s
                if (lower.includes('log in to like')) return true;
                if (lower.startsWith('view replies')) return true;
                if (lower.startsWith('ver respuestas')) return true;
                if (lower.startsWith('hide replies')) return true;
                if (lower.startsWith('ocultar respuestas')) return true;
                return false;
            };

            const isPossibleUsername = (line: string) => {
                if (line.length < 3 || line.length > 30) return false;
                if (line.includes('  ')) return false; // sin espacios largos
                const wordCount = line.split(' ').length;
                if (wordCount > 3) return false; // username no suele tener muchas palabras
                // Emojis básicos permitidos pero no textazos
                return true;
            };

            let currentUsername: string | null = null;
            let currentComment: string | null = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (isNoise(line)) {
                    // Terminamos el comentario anterior, lo guardamos si existe
                    if (currentUsername && currentComment && currentComment.length > 3 && currentUsername.length > 2) {
                        result.push({ username: currentUsername, comment: currentComment });
                    }
                    currentUsername = null;
                    currentComment = null;
                    continue;
                }

                if (!currentUsername) {
                    if (isPossibleUsername(line)) {
                        currentUsername = line;
                    }
                } else {
                    // Ya tenemos username, esta línea es parte del comentario
                    if (!currentComment) {
                        currentComment = line;
                    } else {
                        currentComment += ' ' + line;
                    }
                }
            }
            
            // Guardar el último
            if (currentUsername && currentComment && currentComment.length > 3 && currentUsername.length > 2) {
                result.push({ username: currentUsername, comment: currentComment });
            }

            // Filtrar duplicados
            const unique: typeof result = [];
            const seen = new Set();
            for (const item of result) {
                if (item.username.toLowerCase() === 'instagram') continue;
                const key = `${item.username}:${item.comment}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(item);
                }
            }

            return unique;
          } catch (err) {
            // Si falla el parser en el navegador, devolvemos lo que tengamos
            return result;
          }
        });

        console.log(`Participantes parseados: ${comments.length}`);
        
        if (comments.length > 0) {
            console.log("Ejemplos de usernames:", comments.slice(0, 3).map(c => c.username).join(', '));
            console.log("Ejemplos de comentarios:", comments.slice(0, 3).map(c => c.comment.substring(0, 50) + "...").join(' | '));
        }

        await browser.close();
        res.json(comments);

      } catch (browserError) {
        console.error("Error crítico ejecutando Playwright evaluate:", browserError);
        await browser.close();
        res.status(500).json({ error: "Fallo crítico en el extractor web." });
      }
    } catch (error: any) {
      console.error("Error extrayendo comentarios:", error.message);
      res.status(500).json({ error: "No se pudieron extraer los comentarios o se alcanzó el timeout." });
    }
  });

  app.get("/api/debug-instagram-image", (req, res) => {
    const imagePath = path.join(process.cwd(), 'debug-instagram.png');
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).send("La imagen de debug no existe aún. Ejecuta una extracción primero.");
    }
  });

  app.get("/api/debug-instagram-html", (req, res) => {
    const htmlPath = path.join(process.cwd(), 'debug-instagram.html');
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.status(404).send("El HTML de debug no existe aún. Ejecuta una extracción primero.");
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
    console.log("Configurando directorios estáticos para producción...");
    const distPath = path.join(process.cwd(), 'dist');
    console.log("Ruta de dist actual:", distPath);
    
    if (fs.existsSync(distPath)) {
      console.log("✓ Carpeta dist EXISTE. Contenido:", fs.readdirSync(distPath));
    } else {
      console.error("❌ ERROR CRÍTICO: La carpeta dist NO EXISTE. Revisa el proceso de build de Vite.");
    }
    
    // Sirviendo estáticos
    app.use(express.static(distPath));
    
    // Capturar todos los requests
    app.get('*', (req, res) => {
      console.log(`[SPA Fallback] Sirviendo index.html para request: ${req.url}`);
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`❌ [ERROR] No se encontró index.html en ${indexPath}`);
        res.status(500).send("Error interno: Build de Vite no encontrado (index.html no existe).");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express escuchando en el puerto ${PORT}...`);
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
