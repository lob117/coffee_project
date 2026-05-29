/**
 * Navegación global uniforme — Paz Magdalena
 * Inicio · Catálogo · Historia · Trazabilidad · Cuenta
 */
(function () {
    var PAGINA_VENTAS = 'ventas de cafe.html';
    var navHTML =
        '<div class="ltc-top-promo"><strong>Paz Magdalena</strong> — Café de origen · Sierra Nevada · Magdalena</div>' +
        '<header class="ltc-header">' +
        '<div class="ltc-header-inner">' +
        '<a href="' + PAGINA_VENTAS + '" class="ltc-brand"><h1>Paz Magdalena</h1><span>Trazabilidad y comercio justo</span></a>' +
        '<nav class="ltc-nav" aria-label="Principal">' +
        '<a href="' + PAGINA_VENTAS + '" data-nav="inicio">Inicio</a>' +
        '<a href="coleccion.html" data-nav="catalogo">Catálogo</a>' +
        '<a href="Historia.html" data-nav="historia">Historia</a>' +
        '<a href="trazabilidad.html" data-nav="trazabilidad">Trazabilidad</a>' +
        '<a href="Registrarse.html" data-nav="cuenta">Cuenta</a>' +
        '</nav></div></header>';

    function markActiveNav() {
        var path = (window.location.pathname || '').split('/').pop() || '';
        var map = {
            'ventas de cafe.html': 'inicio',
            'Benta de cafe.html': 'inicio',
            'coleccion.html': 'catalogo',
            'Historia.html': 'historia',
            'trazabilidad.html': 'trazabilidad',
            'blockchain-trazabilidad.html': 'trazabilidad',
            'certificado cafe.html': 'trazabilidad',
            'Registrarse.html': 'cuenta',
            'registro-usuario.html': 'cuenta',
            'registro-empresa.html': 'cuenta',
            'registro-productor.html': 'cuenta',
            'iniciar-sesion.html': 'cuenta',
            'panel-usuario.html': 'cuenta',
            'panel-productor.html': 'cuenta'
        };
        var key = map[path] || '';
        document.querySelectorAll('.ltc-nav a[data-nav]').forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('data-nav') === key);
        });
    }

    var slot = document.getElementById('ltc-nav-global');
    if (slot) {
        slot.innerHTML = navHTML;
        markActiveNav();
        return;
    }

    var path = (window.location.pathname || '').split('/').pop() || '';
    var esVentas = path === 'ventas de cafe.html' || path === 'Benta de cafe.html';
    if (!esVentas && document.querySelector('.ltc-header')) return;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    markActiveNav();
})();
