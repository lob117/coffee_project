# coffee_project — Paz Magdalena / Ciera Origen

Proyecto de cafés especiales colombianos con trazabilidad (hackathon Magdalena).

## Diseño

El estilo visual está inspirado en [La Tienda del Café — café especial colombiano](https://latiendadelcafe.co/collections/cafe-especial-colombiano):

- Fondo blanco y tipografía **DM Sans** + títulos **Cormorant Garamond**
- Barra superior **Mega promo del día**
- Grid de productos con **Vista rápida**, precios en COP (“A partir de…”)
- Barra de colección con **Ordenar** y **Filtros**
- Navbar clara, minimalista

Archivos del tema:

- `css/latienda-del-cafe.css` — hoja de estilos global
- `js/latienda-ui.js` — barra promo, toolbar de colección

## Cómo ver en VS Code

1. Abre la carpeta del repo en Visual Studio Code.
2. Instala la extensión **Live Server** (opcional).
3. Abre `index.html` o `Benta de cafe.html` → clic derecho → **Open with Live Server**.

O abre directamente `Benta de cafe.html` en el navegador.

## Páginas

| Archivo | Uso |
|---------|-----|
| `index.html` | Entrada → redirige al catálogo |
| `Benta de cafe.html` | Tienda principal / catálogo |
| `Historia.html` | Historia del café |
| `Granos de café.html` | Narrador + contenido |
| `pagina 2 cafe.html` | Agente IA / experiencia |
| `Registrarse.html` | Registro |
| `certificado cafe.html` | Certificado / trazabilidad |

## Subir cambios a GitHub

```bash
cd coffee_project
git add css/ js/ index.html README.md *.html
git commit -m "Aplicar tema visual inspirado en La Tienda del Café"
git push origin main
```
