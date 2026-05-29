# coffee_project — Paz Magdalena

Café especial colombiano con diseño inspirado en [La Tienda del Café](https://latiendadelcafe.co/collections/cafe-especial-colombiano).

## Página principal del catálogo

Abre **`ventas de cafe.html`** (o `index.html`, que redirige ahí). Catálogo: **`coleccion.html`**.

Incluye:

- Diseño tipo colección Shopify (barra promo, grid, “Vista rápida”)
- **Imágenes** de café especial (Unsplash) por marca/origen
- **Filtro por rango de precio**: campos min/max, deslizadores y rangos rápidos ($0–30k, 30k–60k, etc.)
- Filtro por **región** (Huila, Magdalena, Nariño, …)
- **Ordenar** por precio o nombre

## Archivos del catálogo

| Archivo | Descripción |
|---------|-------------|
| `coleccion.html` | Catálogo completo estilo latiendadelcafe.co |
| `css/coleccion-ltc.css` | Estilos de la colección |
| `js/catalogo.js` | Productos, filtros y renderizado |

## Otras páginas

- `ventas de cafe.html` — Inicio / landing
- `Historia.html` — Historia + narrador de voz
- `ventas de cafe.html#monitor-promo` — Monitor de ofertas (antes `pagina 2 cafe.html`)
- `trazabilidad.html` — Mapa GIS (Leaflet) + perfiles QR (5 fincas)
- `blockchain-trazabilidad.html` — Cadena inmutable (productor / intermediario / compradora Vianis)
- `certificado cafe.html` — Pasaporte digital mock (complemento)

## Ver en VS Code

1. Abre esta carpeta en VS Code.
2. Clic derecho en `coleccion.html` → **Open with Live Server**.

## Subir a GitHub

```bash
git add coleccion.html css/coleccion-ltc.css js/catalogo.js index.html README.md
git commit -m "Catálogo estilo La Tienda del Café con filtro de precios e imágenes"
git push origin main
```
