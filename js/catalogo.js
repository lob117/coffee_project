/**
 * Catálogo café especial — filtros por rango de precio (estilo La Tienda del Café)
 */
(function () {
    'use strict';

    var data = window.PAZ_CATALOGO;
    if (!data) return;

    var MAX_PRECIO = data.MAX_PRECIO;
    var productos = data.productos;
    var formatCOP = data.formatCOP;

    var state = {
        min: 0,
        max: MAX_PRECIO,
        regiones: [],
        orden: 'relevancia',
        soloOfertas: false
    };

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
            grid.innerHTML =
                '<div class="ltc-empty"><p>No hay cafés en este rango de precio.</p><p>Prueba ampliar el filtro o restablecer.</p></div>';
            if (countEl) countEl.textContent = '0 resultados';
            return;
        }

        grid.innerHTML = list
            .map(function (p) {
                var precioHtml = p.desde
                    ? '<span class="desde">A partir de</span>' + formatCOP(p.precio)
                    : formatCOP(p.precio);
                if (p.compare) precioHtml += '<span class="compare">' + formatCOP(p.compare) + '</span>';
                var highlight = p._destacar ? ' ltc-product-destacado' : '';

                return (
                    '<article class="ltc-product' +
                    highlight +
                    '" data-id="' +
                    p.id +
                    '" data-precio="' +
                    p.precio +
                    '" data-region="' +
                    p.region +
                    '">' +
                    '<div class="ltc-product-img-wrap">' +
                    badgeHtml(p.badge) +
                    '<img src="' +
                    p.img +
                    '" alt="' +
                    p.nombre +
                    '" loading="lazy" width="400" height="400">' +
                    '<span class="ltc-quick-view">Vista rápida</span></div>' +
                    '<div class="ltc-product-body">' +
                    '<div class="ltc-product-brand">' +
                    p.marca +
                    '</div>' +
                    '<h3 class="ltc-product-name">' +
                    p.nombre +
                    '</h3>' +
                    '<div class="ltc-product-price">' +
                    precioHtml +
                    '</div></div></article>'
                );
            })
            .join('');

        if (countEl) {
            countEl.textContent = list.length + ' resultado' + (list.length !== 1 ? 's' : '');
        }

        var destacado = list.find(function (p) {
            return p._destacar;
        });
        if (destacado) {
            setTimeout(function () {
                var el = grid.querySelector('.ltc-product-destacado');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
        }
    }

    function filtrar() {
        var list = productos.filter(function (p) {
            if (p.precio < state.min || p.precio > state.max) return false;
            if (state.regiones.length && state.regiones.indexOf(p.region) < 0) return false;
            if (state.soloOfertas && p.badge !== 'oferta' && !p.compare) return false;
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

        if (minIn) minIn.value = state.min;
        if (maxIn) maxIn.value = state.max;
        if (minR) minR.value = state.min;
        if (maxR) maxR.value = state.max;
        var rango = document.getElementById('rangoDisplay');
        if (rango) rango.textContent = formatCOP(state.min) + ' — ' + formatCOP(state.max);
    }

    function setPreset(min, max) {
        state.min = min;
        state.max = max;
        document.querySelectorAll('.ltc-price-presets button').forEach(function (btn) {
            btn.classList.toggle(
                'active',
                parseInt(btn.dataset.min, 10) === min && parseInt(btn.dataset.max, 10) === max
            );
        });
        syncInputs();
        filtrar();
    }

    function initPromo() {
        var scroll = document.getElementById('promoScroll');
        if (!scroll) return;
        var promos = productos
            .filter(function (p) {
                return p.badge === 'oferta' || p.desde;
            })
            .slice(0, 4);
        scroll.innerHTML = promos
            .map(function (p) {
                return (
                    '<a class="ltc-promo-card" href="' +
                    data.catalogUrl(p, { codigo: sessionStorage.getItem('paz_codigo_promo') || '' }) +
                    '">' +
                    '<img src="' +
                    p.img +
                    '" alt="">' +
                    '<h4>' +
                    p.nombre +
                    '</h4>' +
                    '<p class="precio">' +
                    (p.desde ? 'A partir de ' : '') +
                    formatCOP(p.precio) +
                    '</p></a>'
                );
            })
            .join('');
    }

    function showPromoBanner(codigo) {
        var wrap = document.querySelector('.ltc-mega-promo');
        if (!wrap || !codigo) return;
        var note = document.getElementById('promoCodigoBanner');
        if (!note) {
            note = document.createElement('p');
            note.id = 'promoCodigoBanner';
            note.className = 'ltc-promo-codigo';
            wrap.appendChild(note);
        }
        note.textContent = 'Código activo: ' + codigo + ' — 20% en tu primera compra (ofertas del catálogo).';
    }

    function applyUrlPromo() {
        var params = new URLSearchParams(window.location.search);
        var codigo = params.get('codigo');
        var promo = params.get('promo');
        var id = parseInt(params.get('id') || params.get('producto') || '', 10);

        if (codigo) {
            sessionStorage.setItem('paz_codigo_promo', codigo);
            showPromoBanner(codigo);
        } else if (sessionStorage.getItem('paz_codigo_promo')) {
            showPromoBanner(sessionStorage.getItem('paz_codigo_promo'));
        }

        if (promo === 'oferta') {
            state.soloOfertas = true;
            var ofertas = productos.filter(function (p) {
                return p.badge === 'oferta' || p.compare;
            });
            if (ofertas.length) {
                var minP = Math.min.apply(
                    null,
                    ofertas.map(function (p) {
                        return p.precio;
                    })
                );
                var maxP = Math.max.apply(
                    null,
                    ofertas.map(function (p) {
                        return p.precio;
                    })
                );
                state.min = Math.max(0, minP - 5000);
                state.max = Math.min(MAX_PRECIO, maxP + 10000);
            }
        }

        if (!isNaN(id) && id > 0) {
            var prod = data.getById(id);
            if (prod) {
                prod._destacar = true;
                state.min = Math.max(0, prod.precio - 8000);
                state.max = Math.min(MAX_PRECIO, prod.precio + 12000);
                if (prod.region) state.regiones = [prod.region];
            }
        }
    }

    function initRegions() {
        var regions = [];
        productos.forEach(function (p) {
            if (regions.indexOf(p.region) < 0) regions.push(p.region);
        });
        regions.sort();
        var ul = document.getElementById('regionFilters');
        if (!ul) return;
        ul.innerHTML = regions
            .map(function (r) {
                return '<li><label><input type="checkbox" value="' + r + '"> ' + r + '</label></li>';
            })
            .join('');
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
            document.querySelectorAll('.ltc-price-presets button').forEach(function (b) {
                b.classList.remove('active');
            });
            filtrar();
        }

        if (minIn) minIn.addEventListener('change', fromInputs);
        if (maxIn) maxIn.addEventListener('change', fromInputs);
        if (minR)
            minR.addEventListener('input', function () {
                state.min = parseInt(minR.value, 10);
                if (state.min > state.max) state.max = state.min;
                syncInputs();
                filtrar();
            });
        if (maxR)
            maxR.addEventListener('input', function () {
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
            state.soloOfertas = false;
            document.querySelectorAll('#regionFilters input').forEach(function (cb) {
                cb.checked = false;
            });
            document.querySelectorAll('.ltc-price-presets button').forEach(function (b) {
                b.classList.remove('active');
            });
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
        if (minR) {
            minR.max = MAX_PRECIO;
            minR.min = 0;
        }
        applyUrlPromo();
        initPromo();
        initRegions();
        bindEvents();
        syncInputs();
        filtrar();
        if (window.location.hash === '#productos' || new URLSearchParams(location.search).get('id')) {
            document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
        }
    });
})();
