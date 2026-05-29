/**
 * Navegación global uniforme — Paz Magdalena
 */
(function () {
    var PAGINA_VENTAS = 'ventas de cafe.html';
    var navHTML =
        '<div class="ltc-top-promo"><strong>Paz Magdalena</strong> — Café de origen · Sierra Nevada · Magdalena</div>' +
        '<header class="ltc-header">' +
        '<div class="ltc-header-inner">' +
        '<a href="' + PAGINA_VENTAS + '" class="ltc-brand"><h1>Paz Magdalena</h1><span>Trazabilidad y comercio justo</span></a>' +
        '<nav class="ltc-nav">' +
        '<a href="' + PAGINA_VENTAS + '">Inicio</a>' +
        '<a href="coleccion.html">Catálogo</a>' +
        '<a href="Historia.html">Historia</a>' +
        '<a href="Granos de café.html">Narrador</a>' +
        '<a href="certificado cafe.html">Trazabilidad</a>' +
        '<a href="Registrarse.html">Cuenta</a>' +
        '<a href="iniciar-sesion.html">Entrar</a>' +
        '</nav></div></header>';

    var slot = document.getElementById('ltc-nav-global');
    if (slot) {
        slot.innerHTML = navHTML;
        return;
    }

    var path = (window.location.pathname || '').split('/').pop() || '';
    var esVentas = path === 'ventas de cafe.html' || path === 'Benta de cafe.html';
    if (!esVentas && document.querySelector('.ltc-header')) return;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
})();
