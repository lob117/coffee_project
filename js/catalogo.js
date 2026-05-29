/**
 * Catálogo café especial — filtros por rango de precio (estilo La Tienda del Café)
 */
(function () {
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

    var state = {
        min: 0,
        max: MAX_PRECIO,
        regiones: [],
        orden: 'relevancia'
    };

    function formatCOP(n) {
        return '$' + n.toLocaleString('es-CO');
    }

    function badgeHtml(b) {
        if (!b) return '';
        var labels = { nuevo: 'Nuevo', oferta: 'Oferta', premium: 'Premium', agotado: 'Agotado' };
        return '<span class="ltc-badge ' + b + '">' + (labels[b] || b) + '</span>';
    }

    function renderGrid(list) {
        var grid = document.getElementById('productGrid');
        var countEl = document.getElementById('resultsCount');
        if (!grid) return;

        if (!list.length) {
            grid.innerHTML = '<div class="ltc-empty"><p>No hay cafés en este rango de precio.</p><p>Prueba ampliar el filtro o restablecer.</p></div>';
            if (countEl) countEl.textContent = '0 resultados';
            return;
        }

        grid.innerHTML = list.map(function (p) {
            var precioHtml = p.desde
                ? '<span class="desde">A partir de</span>' + formatCOP(p.precio)
                : formatCOP(p.precio);
            if (p.compare) precioHtml += '<span class="compare">' + formatCOP(p.compare) + '</span>';

            return (
                '<article class="ltc-product" data-id="' + p.id + '" data-precio="' + p.precio + '" data-region="' + p.region + '">' +
                '<div class="ltc-product-img-wrap">' +
                badgeHtml(p.badge) +
                '<img src="' + p.img + '" alt="' + p.nombre + '" loading="lazy" width="400" height="400">' +
                '<span class="ltc-quick-view">Vista rápida</span></div>' +
                '<div class="ltc-product-body">' +
                '<div class="ltc-product-brand">' + p.marca + '</div>' +
                '<h3 class="ltc-product-name">' + p.nombre + '</h3>' +
                '<div class="ltc-product-price">' + precioHtml + '</div></div></article>'
            );
        }).join('');

        if (countEl) countEl.textContent = list.length + ' resultado' + (list.length !== 1 ? 's' : '');
    }

    function filtrar() {
        var list = productos.filter(function (p) {
            if (p.precio < state.min || p.precio > state.max) return false;
            if (state.regiones.length && state.regiones.indexOf(p.region) < 0) return false;
            return true;
        });

        if (state.orden === 'precio-asc') list.sort(function (a, b) { return a.precio - b.precio; });
        else if (state.orden === 'precio-desc') list.sort(function (a, b) { return b.precio - a.precio; });
        else if (state.orden === 'nombre') list.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });

        renderGrid(list);
    }

    function syncInputs() {
        var minIn = document.getElementById('priceMin');
        var maxIn = document.getElementById('priceMax');
        var minR = document.getElementById('rangeMin');
        var maxR = document.getElementById('rangeMax');
        var lblMin = document.getElementById('labelMin');
        var lblMax = document.getElementById('labelMax');

        if (minIn) minIn.value = state.min;
        if (maxIn) maxIn.value = state.max;
        if (minR) minR.value = state.min;
        if (maxR) maxR.value = state.max;
        if (lblMin) lblMin.textContent = formatCOP(state.min);
        if (lblMax) lblMax.textContent = formatCOP(state.max);
        var rango = document.getElementById('rangoDisplay');
        if (rango) rango.textContent = formatCOP(state.min) + ' — ' + formatCOP(state.max);
    }

    function setPreset(min, max) {
        state.min = min;
        state.max = max;
        document.querySelectorAll('.ltc-price-presets button').forEach(function (btn) {
            btn.classList.toggle('active', parseInt(btn.dataset.min, 10) === min && parseInt(btn.dataset.max, 10) === max);
        });
        syncInputs();
        filtrar();
    }

    function initPromo() {
        var scroll = document.getElementById('promoScroll');
        if (!scroll) return;
        var promos = productos.filter(function (p) { return p.badge === 'oferta' || p.desde; }).slice(0, 4);
        scroll.innerHTML = promos.map(function (p) {
            return '<div class="ltc-promo-card" data-goto="' + p.id + '">' +
                '<img src="' + p.img + '" alt="">' +
                '<h4>' + p.nombre + '</h4>' +
                '<p class="precio">' + (p.desde ? 'A partir de ' : '') + formatCOP(p.precio) + '</p></div>';
        }).join('');
        scroll.querySelectorAll('.ltc-promo-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var id = parseInt(card.dataset.goto, 10);
                var prod = productos.find(function (x) { return x.id === id; });
                if (prod) setPreset(Math.max(0, prod.precio - 5000), Math.min(MAX_PRECIO, prod.precio + 15000));
                document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function initRegions() {
        var regions = [];
        productos.forEach(function (p) {
            if (regions.indexOf(p.region) < 0) regions.push(p.region);
        });
        regions.sort();
        var ul = document.getElementById('regionFilters');
        if (!ul) return;
        ul.innerHTML = regions.map(function (r) {
            return '<li><label><input type="checkbox" value="' + r + '"> ' + r + '</label></li>';
        }).join('');
        ul.addEventListener('change', function () {
            state.regiones = [];
            ul.querySelectorAll('input:checked').forEach(function (cb) {
                state.regiones.push(cb.value);
            });
            filtrar();
        });
    }

    function bindEvents() {
        var minIn = document.getElementById('priceMin');
        var maxIn = document.getElementById('priceMax');
        var minR = document.getElementById('rangeMin');
        var maxR = document.getElementById('rangeMax');

        function fromInputs() {
            state.min = Math.min(parseInt(minIn.value, 10) || 0, parseInt(maxIn.value, 10) || MAX_PRECIO);
            state.max = Math.max(state.min, parseInt(maxIn.value, 10) || MAX_PRECIO);
            if (state.max > MAX_PRECIO) state.max = MAX_PRECIO;
            syncInputs();
            document.querySelectorAll('.ltc-price-presets button').forEach(function (b) { b.classList.remove('active'); });
            filtrar();
        }

        if (minIn) minIn.addEventListener('change', fromInputs);
        if (maxIn) maxIn.addEventListener('change', fromInputs);
        if (minR) minR.addEventListener('input', function () {
            state.min = parseInt(minR.value, 10);
            if (state.min > state.max) state.max = state.min;
            syncInputs();
            filtrar();
        });
        if (maxR) maxR.addEventListener('input', function () {
            state.max = parseInt(maxR.value, 10);
            if (state.max < state.min) state.min = state.max;
            syncInputs();
            filtrar();
        });

        document.querySelectorAll('.ltc-price-presets button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setPreset(parseInt(btn.dataset.min, 10), parseInt(btn.dataset.max, 10));
            });
        });

        document.getElementById('btnApplyFilter')?.addEventListener('click', filtrar);
        document.getElementById('btnClearFilter')?.addEventListener('click', function () {
            state.min = 0;
            state.max = MAX_PRECIO;
            state.regiones = [];
            document.querySelectorAll('#regionFilters input').forEach(function (cb) { cb.checked = false; });
            document.querySelectorAll('.ltc-price-presets button').forEach(function (b) { b.classList.remove('active'); });
            syncInputs();
            filtrar();
        });

        document.getElementById('sortSelect')?.addEventListener('change', function (e) {
            state.orden = e.target.value;
            filtrar();
        });

        var toggle = document.getElementById('filterToggle');
        var sidebar = document.getElementById('filtersSidebar');
        var overlay = document.getElementById('filterOverlay');
        if (toggle && sidebar) {
            toggle.addEventListener('click', function () {
                sidebar.classList.add('open');
                overlay?.classList.add('show');
            });
        }
        overlay?.addEventListener('click', function () {
            sidebar?.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('productGrid')) return;
        var maxR = document.getElementById('rangeMax');
        var minR = document.getElementById('rangeMin');
        if (maxR) maxR.max = MAX_PRECIO;
        if (minR) { minR.max = MAX_PRECIO; minR.min = 0; }
        initPromo();
        initRegions();
        bindEvents();
        syncInputs();
        filtrar();
    });
})();
