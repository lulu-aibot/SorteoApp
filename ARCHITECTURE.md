# Arquitectura de Plataforma SaaS para Sorteos en Instagram

Este documento detalla la arquitectura técnica, decisiones de diseño, flujos y estrategias para el desarrollo de un SaaS de sorteos en Instagram, enfocado en escalabilidad, transparencia y experiencia premium.

---

## 1. Arquitectura de Extracción de Datos (El core problemático)

Instagram posee fuertes defensas contra el scraping (bloqueos de IP, rate limiting, shadowbans, CAPTCHAs, requerimiento de sesión). Las API oficiales son restrictivas.

### Enfoque Propuesto: Sistema Híbrido (API Oficial + Scraping Controlado vía Cola Domiciliada)

**Opción A: Graph API de Instagram (Oficial, pero Limitada)**
- **Pros:** 100% Legal, estable, no hay bloqueos inesperados.
- **Contras:** Requiere que el usuario conecte su cuenta de Instagram Business/Creator mediante OAuth. El sorteo **solo** puede hacerse sobre publicaciones de la cuenta conectada. No servirá si el usuario quiere sortear algo de otra cuenta o si usa cuenta personal.
- **Recomendación para Escalabilidad:** Implementar esto como la opción "Premium" o principal para agencias y cuentas de empresa, ya que garantiza el 100% de confiabilidad.

**Opción B: Scraping Distribuido (Para el MVP y cuentas públicas generales)**
- **Pros:** Permite pegar cualquier URL pública y obtener los comentarios sin requerir autenticación del usuario.
- **Contras:** Alto riesgo de bloqueo de IPs, requiere infraestructura especializada, cambios constantes en el DOM de Instagram.
- **Solución Arquitectónica:**
  1. No hacer peticiones desde el frontend o el servidor principal de web API.
  2. Implementar un **Servicio de Scraping Aislado**: Un cluster de puppeteer/playwright o scripts de HTTP en Python gestionado a través de colas (Redis/BullMQ o AWS SQS).
  3. **Rotación de Proxies:** Usar servicios de proxy residenciales (BrightData, Oxylabs) para rotar IPs en cada petición.
  4. **Emulación de Sesiones:** Mantener un pool de cuentas "bot" de Instagram (throwaway accounts) con manejo automático de cookies y sessions para acceder al endpoint GraphQL no documentado de comentarios.

**Decisión para el MVP:**
Implementar un sistema que simula la extracción para la capa visual, pero diseñar el Backend con un patrón Pub/Sub. El servidor API recibe la URL de Instagram, encola un job, retorna un `jobId` al cliente, y el cliente hace Long Polling (o WebSockets) para suscribirse a los eventos de progreso. En un principio, el Worker de extracción puede usar una librería ligera de Node.js o una API de terceros (como Apify) para reducir la complejidad inicial.

---

## 2. Pila Tecnológica (Stack)

### Frontend
- **Framework:** Next.js (o React + Vite para SPA). *Decisión:* React + Vite es perfecto para el MVP (SPA rápido), pero Next.js ofrece gran ventaja en SEO para aterrizaje (Landing page estática) y API Routes para MVP de backend integrado. Para este prototipo usaremos **React 19 + Vite** y `react-router` para simular un SPA de alto rendimiento.
- **Estilos:** Tailwind CSS v4 para iteración rápida.
- **UI Components:** shadcn/ui. Provee accesibilidad (Radix) sin acoplar estilos opacos, manteniendo consistencia visual.
- **Animaciones:** Framer Motion (`motion/react`) para micro-interacciones premium (ruleta, transiciones de vistas).
- **Manejo de Estado Local/Formularios:** React Hook Form + Zod para validaciones estrictas y Zustand si el estado del sorteo se vuelve complejo y debe compartirse, aunque un flujo paso-a-paso puede manejarse localmente.

### Backend (Diseño Lógico para el SaaS Completo)
- **Framework:** NestJS (Node.js + TS) para escalabilidad estructurada o Express para MVP rápido.
- **Base de Datos:** PostgreSQL. ¿Por qué? Relaciones claras entre Subscriptions, Users, Raffles y Winners. Garantía ACID.
- **Caché & Colas:** Redis. Esencial para limitar la tasa (Rate Limiting) y manejar las colas de procesamiento de extracción de comentarios.
- **ORM:** Prisma ORM. Provee tipos TypeScript inferidos directamente de la base de datos, acelerando el desarrollo seguro.

### Infraestructura (DevOps & Deploy)
- **Frontend / Fullstack (Si es Next.js):** Vercel. Despliegue automático con CDN global.
- **Backend / Workers:** Railway o Render, por la facilidad de desplegar contenedores, bases de datos PostgreSQL gestionadas y Redis sin la sobrecarga operativa inmediata de AWS EKS/ECS.
- **Protección Perimetral:** Cloudflare. Para mitigar ataques DDoS, aplicar WAF y caching de assets.

---

## 3. Modelo de Base de Datos Principal

```sql
-- Resumen Estructura Relacional

Table users {
  id String [pk]
  email String [unique]
  created_at DateTime
}

Table raffles {
  id String [pk]
  user_id String [ref: > users.id] -- Null si es usuario invitado (guest)
  instagram_url String
  status ENUM ('PENDING', 'EXTRACTING', 'COMPLETED', 'FAILED')
  total_comments Int
  settings JSONB -- {winners: 1, filter_dupes: true, keyword: ''}
  seed String -- Para verificabilidad
  created_at DateTime
}

Table winners {
  id String [pk]
  raffle_id String [ref: > raffles.id]
  username String
  comment_text Text
  profile_pic_url String
  selected_at DateTime
}

Table audit_logs {
  id String [pk]
  raffle_id String [ref: > raffles.id]
  action String -- ej. 'COMMENTS_FETCHED', 'WINNER_DRAWN'
  timestamp DateTime
}
```

---

## 4. Algoritmo de Selección y Transparencia

Para que la herramienta sea confiable ("Provably Fair"), el algoritmo de selección aleatoria debe evitar manipulaciones:
1. Al momento de iniciar la selección, el servidor genera un **Seed (Semilla)** criptográfica (usando `crypto.randomBytes`).
2. Se asigna un identificador único al sorteo.
3. Se selecciona al ganador/es usando un Pseudo-Random Number Generator (PRNG) alimentado por el Seed y el array de comentarios válidos, ordenado determinísticamente (por ejemplo, orden alfabético de ID de comentario).
4. El certificado público del sorteo mostrará:
   - El Seed utilizado.
   - El número total de participantes válidos.
   - La fecha y hora exacta (Timestamp validado por servidor).
   - Un Hash (SHA-256) del array final de participantes, demostrando que no se inyectaron registros a última hora.

---

## 5. Arquitectura del Flujo Principal (UX)

1. **Pantalla inicial (URL):** Validación instantánea del formato de la URL de Instagram con RegEx en el frontend y ping en backend para verificar disponibilidad de la publicación.
2. **Pantalla Configuración (Settings):** El motor principal. Un formulario que gestiona las exclusiones y reglas. Al ser un producto abierto y gratuito, sugerimos implementar un Rate Limit simple para evitar abusos y denegación de servicio.
3. **Extracción (Loading screen):** Implementa WebSockets / Polling para mostrar "Comentarios extraídos: 345/1000". Los *skeleton loaders* mantienen al usuario visualmente entretenido.
4. **Ruleta:** Usa `framer-motion` para animar una transición tipo slot-machine/ruleta girando entre nombres extraídos. Incrementa la tensión, lo cual da una vibra 'premium'.
5. **Ganador y Certificado:** Muestra confeti (efecto visual). Permite exportar imagen, el resultado es almacenado permanentemente generándose una URL pública (`/cert/abc-123`) inmutable.

---

## 6. Siguientes Pasos (Roadmap de Escalabilidad)

- **Fase 1 (MVP):** SPA Frontend conectado a Node.js simple, scraping básico (librería open source), sin login requerido. Completamente gratuito y abierto al público.
- **Fase 2 (Plataforma v1):** Login social (Google/Instagram), persistencia de sorteos, e historial completo. Infraestructura con BullMQ y Proxies para alta demanda.
- **Fase 3 (Sistemas Multi-Plataforma):** Sorteos cruzados YouTube+Instagram, exportación a CSV, Dashboards analíticos. Siempre manteniendo la filosofía 100% gratuita.

*Autor: Lead Architect & CTO*
