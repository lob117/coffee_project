/**
 * Datos compartidos del catálogo (colección + monitor promocional)
 */
(function (global) {
    'use strict';

    var MAX_PRECIO = 120000;

    var productos = [
        { id: 1, nombre: 'Café Especial La Iguana', marca: 'Huila · Origen', region: 'Huila', precio: 7500, desde: true, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80', badge: '' },
        { id: 2, nombre: 'Café Especial Tierra Mágica', marca: 'Quindío', region: 'Quindío', precio: 48300, img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80', badge: '' },
        { id: 3, nombre: 'Café Especial Don Gallo', marca: 'Santander', region: 'Santander', precio: 45000, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80', badge: '' },
        { id: 4, nombre: 'Café Especial Supremo Huila', marca: 'Paz Magdalena', region: 'Huila', precio: 47475, img: 'https://images.unsplash.com/photo-1447933608593-3dded0854bef?w=500&q=80', badge: 'premium' },
        { id: 5, nombre: 'Café Especial Origen Volcánico', marca: 'Nariño Volcánico', region: 'Nariño', precio: 62475, img: 'https://images.unsplash.com/photo-1611854771653-86587a506038?w=500&q=80', badge: 'oferta', compare: 72000 },
        { id: 6, nombre: 'Café Especial Sierra Nevada', marca: 'Finca Porvenir · Eder Ochoa', region: 'Magdalena', precio: 82475, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80', badge: 'nuevo' },
        { id: 7, nombre: 'Café Especial Jardín Antioqueño', marca: 'Antioquia Tradicional', region: 'Antioquia', precio: 54975, img: 'https://images.unsplash.com/photo-1511920170033-f8396924c10b?w=500&q=80', badge: '' },
        { id: 8, nombre: 'Café Especial Geisha Tarqui', marca: 'Risaralda · SCAA 90+', region: 'Risaralda', precio: 89900, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80', badge: 'nuevo' },
        { id: 9, nombre: 'Café Especial Coff Bourbon Rosado', marca: 'Cauca', region: 'Cauca', precio: 71400, img: 'https://images.unsplash.com/photo-1559496417-4139a8fb79d2?w=500&q=80', badge: '' },
        { id: 10, nombre: 'Café Especial Para ti', marca: 'Tolima', region: 'Tolima', precio: 7500, desde: true, img: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80', badge: '' },
        { id: 11, nombre: 'Café Especial Better Together', marca: 'Bourbon Rosado', region: 'Huila', precio: 75600, img: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500&q=80', badge: 'oferta', compare: 89000 },
        { id: 12, nombre: 'Pack Degustación 4 Orígenes', marca: 'Paz Magdalena', region: 'Magdalena', precio: 105000, img: 'https://images.unsplash.com/photo-1498808672522-eb0eafe4732c?w=500&q=80', badge: 'nuevo' },
        { id: 13, nombre: 'Café Especial Ojalá Llueva Café', marca: 'Caldas', region: 'Caldas', precio: 12000, desde: true, img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&q=80', badge: '' },
        { id: 14, nombre: 'Café Especial Get Guts', marca: 'Valle del Cauca', region: 'Valle del Cauca', precio: 61425, img: 'https://images.unsplash.com/photo-1511537635665-974fd84791aa?w=500&q=80', badge: 'nuevo' },
        { id: 15, nombre: 'Café Especial Colombia Exotic', marca: 'Cundinamarca', region: 'Cundinamarca', precio: 28500, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80', badge: '' },
        { id: 16, nombre: 'Suscripción Diamante (2 bolsas)', marca: 'Paz Magdalena', region: 'Magdalena', precio: 85900, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80', badge: 'oferta', compare: 95900 }
    ];

    function formatCOP(n) {
        return '$' + n.toLocaleString('es-CO');
    }

    function getOfertas() {
        return productos.filter(function (p) {
            return p.badge === 'oferta' || p.badge === 'premium' || p.desde;
        });
    }

    function getById(id) {
        return productos.find(function (p) {
            return p.id === id;
        });
    }

    function catalogUrl(producto, extra) {
        var q = new URLSearchParams();
        if (producto) {
            q.set('id', String(producto.id));
            if (producto.badge === 'oferta') q.set('promo', 'oferta');
        }
        if (extra && extra.codigo) q.set('codigo', extra.codigo);
        var s = q.toString();
        return 'coleccion.html' + (s ? '?' + s : '');
    }

    global.PAZ_CATALOGO = {
        MAX_PRECIO: MAX_PRECIO,
        productos: productos,
        formatCOP: formatCOP,
        getOfertas: getOfertas,
        getById: getById,
        catalogUrl: catalogUrl
    };
})(window);
