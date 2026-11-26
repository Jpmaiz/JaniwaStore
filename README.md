# Janiwa

Wishlist personal para compras en USA (Amazon, StockX, Urban Outfitters, Adidas…) con
calculadora de costo **en tus manos en USA** y conversión a **Bs al dólar paralelo** del día.

## Qué hace (v0.3)
- Grilla tipo Pinterest: **una tarjeta = un modelo + un color**.
- **Comparador de tiendas** (estilo Kayak): cada tarjeta guarda ofertas de varias tiendas,
  ordenadas por el total en mano (precio + envío + tax + colchón) y marca la más barata.
- **Categoría automática** (zapatillas, ropa, skate, accesorios, tecnología, deportes, hogar,
  belleza, coleccionables u otros): usa la ruta de categorías de la tienda y el nombre.
  Palabras clave en `src/lib/tiendas.ts`. Se corrige desde la ficha.
- **Pegas el link y se lee solo**: nombre, color, precio, imagen y stock (método fácil, sin IA).
  La tienda y su envío se detectan del link.
- Si el modelo y color ya existen, te ofrece agregarlo como oferta a esa tarjeta.
- **↻ Revisar precios**: vuelve a leer todos los links y avisa si algo bajó o se agotó.
- Botones de búsqueda rápida (Google Shopping, Amazon, eBay, StockX, Zappos, Urban).
- Dólar oficial y paralelo (Binance) automático, o manual en Ajustes.
- **Foto a mano**: si la tienda no deja leer la imagen, pega el link de la imagen
  (clic derecho en la foto › *Copiar dirección de imagen*). También se cambia desde la ficha.
- **Efectos Arcade 8 bits**: al guardar, la tarjeta nueva aparece en la grilla armándose por filas
  con píxeles de colores y un ¡NUEVO!; al eliminar, la tarjeta parpadea y estalla con ¡BOOM!
  (paleta en `src/lib/arcade.ts`, animaciones al final de `globals.css`).
- **Tiendas** (`/tiendas`): las tiendas que visitas con lo que te interesa de cada una
  (etiquetas), notas, favoritas, envío y en cuántos productos es la más barata.
  Las tiendas de tus ofertas aparecen solas.

## Cómo arrancar

1. **Instala dependencias** (en la carpeta del proyecto):
   ```
   npm install
   ```
2. **Crea tu proyecto en Supabase** (supabase.com → New project, plan gratis).
3. **Crea las tablas**: en Supabase abre *SQL Editor* → *New query* y ejecuta, en orden:
   - `supabase/schema.sql`
   - `supabase/002_ofertas.sql` (ofertas por tienda y color)
   - `supabase/003_tiendas.sql` (apartado de tiendas)
   - `supabase/005_monedas.sql` (precios en $, Bs o €)
4. **Variables de entorno**: copia `.env.example` como `.env.local` y llena:
   - `SUPABASE_URL` → Project Settings › API › Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → Project Settings › API › `service_role` (secreta)
5. **Corre la app**:
   ```
   npm run dev
   ```
   Abre http://localhost:3000

## Estructura
```
src/
  app/
    page.tsx          wishlist
    tiendas/page.tsx  apartado de tiendas
    icon.png          ícono de la pestaña
    actions.ts        agregar / cambiar estado / eliminar / guardar ajustes
    layout.tsx        fuentes Zodiak + IBM Plex Mono
    globals.css       estilo Janiwa (chocolate, cursores, grilla)
  components/         Sidebar, Tile, ProductSheet, formularios, Dialog
  lib/
    datos.ts          carga de productos, ofertas, ajustes y tiendas
    calc.ts           fórmula de costo y mejor oferta
    scraper.ts        lector de links (JSON-LD y Open Graph)
    tiendas.ts        tiendas conocidas, envíos, búsqueda y comparación de modelos
    dolar.ts          cotización desde bo.dolarapi.com (caché 15 min)
    supabase.ts       cliente del servidor
    types.ts          tipos, categorías y tiendas
supabase/schema.sql       tablas settings y products
supabase/002_ofertas.sql  color + tabla offers
supabase/003_tiendas.sql  tabla stores
supabase/005_monedas.sql  moneda por oferta + euro manual
public/logo.png       logo (El pensador)
public/fonts          Zodiak, IBM Plex Mono y Press Start 2P (texto pixelado) (Indian Type Foundry) e IBM Plex Mono
public/cursors        cursores retro
```

## Monedas
- **Dólares ($)**: precio + envío en USA + tax + colchón → × dólar paralelo.
- **Euros (€)**: se convierte a dólares con el cambio del Banco Central Europeo
  (api.frankfurter.dev, automático; o manual en Ajustes) y sigue la fórmula de dólares.
- **Bolivianos (Bs)**: precio + entrega local, directo en Bs (sin tax, colchón ni cambio).
- Todas las ofertas se comparan en Bs. La moneda se detecta del link (`.bo` → Bs, `.es`/`.de`… → €).

## Fórmula
```
tax       = precio × tax%
subtotal  = precio + envío USA + tax
colchón   = subtotal × colchón%
total USD = subtotal + colchón
total Bs  = total USD × dólar paralelo
```

## Seguridad
La app usa la *service role key* solo en el servidor y las tablas tienen RLS activo sin
políticas, así la clave pública no puede leer nada. **No subas `.env.local` a GitHub.**
Si publicas la app en internet (Vercel), agrega antes un login: hoy cualquiera con el link
podría verla.

## Lector de links: límites
- Funciona con las tiendas que publican sus datos para Google (la mayoría).
- Amazon y StockX a veces bloquean la lectura: la oferta se guarda y escribes el precio a mano.
- Los envíos por tienda son estimados: cámbialos en `src/lib/tiendas.ts`.

## Próximos pasos
- Lotes de envío (con peso y fecha de viaje)
- Capital (billeteras, aportes, reparto de ganancias)
- Stock, ventas e histórico
- Extracción automática del producto con IA a partir del link o una captura
