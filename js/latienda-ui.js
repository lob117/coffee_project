/**
 * UI complementaria — estilo latiendadelcafe.co
 */
(function () {
    'use strict';

    function injectPromoBar() {
        if (document.querySelector('.ltc-promo-bar')) return;
        var bar = document.createElement('div');
        bar.className = 'ltc-promo-bar';
        bar.innerHTML = '<strong>Mega promo del día</strong> — 10% en cafés especiales seleccionados · Envío nacional · <em>latienda.delcafé</em> style';
        document.body.insertBefore(bar, document.body.firstChild);
    }

    function injectCollectionToolbar() {
        var products = document.querySelector('.products, #productos, #catalogo, .container#catalogo');
        var grid = document.querySelector('.products-grid, #productGrid');
        if (!grid || document.querySelector('.ltc-toolbar')) return;

        var parent = products || grid.parentElement;
        if (!parent) return;

        var count = grid.querySelectorAll('.product-card, .card.product-card, .card').length;
        var toolbar = document.createElement('div');
        toolbar.className = 'ltc-toolbar';
        toolbar.innerHTML =
            '<div>' +
            '<h1>Café especial colombiano</h1>' +
            '<p class="ltc-count">' + (count || '—') + ' resultados · Origen verificado Magdalena</p>' +
            '</div>' +
            '<div class="ltc-toolbar-actions">' +
            '<select aria-label="Ordenar"><option>Ordenar</option><option>Precio: menor a mayor</option><option>Precio: mayor a menor</option><option>Más vendidos</option></select>' +
            '<button type="button" onclick="alert(\'Filtros: Región, Puntaje, Variedad — demo hackathon\')">Filtros</button>' +
            '</div>';
        parent.insertBefore(toolbar, grid);
    }

    function formatPricesCOP() {
        document.querySelectorAll('.product-price').forEach(function (el) {
            var t = el.textContent.trim();
            if (t.indexOf('$') === -1) return;
            var raw = t.replace(/[^\d.]/g, '');
            if (raw.indexOf('.') !== -1 && raw.split('.').pop().length === 3) return;
            var num = parseFloat(t.replace(/[$,]/g, ''));
            if (isNaN(num) || num > 5000) return;
            var cop = Math.round(num * 2500);
            el.textContent = '$' + cop.toLocaleString('es-CO');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectPromoBar();
        injectCollectionToolbar();
        formatPricesCOP();
    });
})();
