/**
 * Monitor interactivo de promociones — enlazado con coleccion.html
 */
(function () {
    'use strict';

    var clickCount = 0;
    var isTyping = false;
    var logoShown = false;
    var CODIGO_PROMO = 'CAFE2026';

    function $(id) {
        return document.getElementById(id);
    }

    function formatCOP(n) {
        return window.PAZ_CATALOGO ? window.PAZ_CATALOGO.formatCOP(n) : '$' + n;
    }

    function getOfertas() {
        if (!window.PAZ_CATALOGO) return [];
        return window.PAZ_CATALOGO.getOfertas().slice(0, 4);
    }

    function buildPromoMessages() {
        var ofertas = getOfertas();
        var lines = [
            { text: '> Iniciando sistema Paz Magdalena...', delay: 700 },
            { text: '> Cargando catálogo de café especial colombiano', delay: 600 },
            {
                text: '> <span class="highlight">¡PROMO DEL DÍA!</span> Ofertas en catálogo',
                delay: 500
            }
        ];
        ofertas.forEach(function (p) {
            var precio = p.compare
                ? formatCOP(p.precio) + ' <span class="compare">' + formatCOP(p.compare) + '</span>'
                : (p.desde ? 'desde ' : '') + '<span class="price">' + formatCOP(p.precio) + '</span>';
            lines.push({
                text: '> ' + p.nombre + ': ' + precio,
                delay: 650
            });
        });
        lines.push({
            text: '> Código <span class="highlight">' + CODIGO_PROMO + '</span> — 20% primera compra',
            delay: 700
        });
        lines.push({
            text: '> <a href="coleccion.html?promo=oferta&codigo=' +
                CODIGO_PROMO +
                '" class="monitor-link">Ver todo en el catálogo →</a>',
            delay: 800
        });
        return lines;
    }

    function createParticles() {
        var container = $('monitorParticles');
        if (!container) return;
        for (var i = 0; i < 24; i++) {
            var p = document.createElement('div');
            p.className = 'monitor-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            container.appendChild(p);
        }
    }

    function showNotification(text) {
        var notif = $('monitorNotification');
        if (!notif) return;
        notif.textContent = text;
        notif.classList.add('show');
        setTimeout(function () {
            notif.classList.remove('show');
        }, 2800);
    }

    function createBurst(x, y) {
        var container = document.createElement('div');
        container.className = 'monitor-click-burst';
        container.style.left = x + 'px';
        container.style.top = y + 'px';
        var colors = ['#d4a056', '#2d4a32', '#8a7560', '#e8d5b7'];
        for (var i = 0; i < 10; i++) {
            var p = document.createElement('div');
            p.className = 'monitor-burst-particle';
            var angle = (i / 10) * Math.PI * 2;
            var dist = 28 + Math.random() * 40;
            p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
            p.style.background = colors[i % colors.length];
            container.appendChild(p);
        }
        document.body.appendChild(container);
        setTimeout(function () {
            container.remove();
        }, 800);
    }

    function showLogo() {
        var logo = $('monitorCoffeeLogo');
        if (logo) logo.classList.add('active');
        logoShown = true;
    }

    function renderOfferCards() {
        var grid = $('monitorOffersGrid');
        if (!grid || !window.PAZ_CATALOGO) return;
        var ofertas = getOfertas();
        grid.innerHTML = ofertas
            .map(function (p) {
                var badge = p.badge === 'oferta' ? 'OFERTA' : p.badge === 'premium' ? 'PREMIUM' : 'DESTACADO';
                var url = window.PAZ_CATALOGO.catalogUrl(p, { codigo: CODIGO_PROMO });
                return (
                    '<a class="monitor-offer-card" href="' +
                    url +
                    '">' +
                    '<span class="monitor-offer-badge">' +
                    badge +
                    '</span>' +
                    '<img src="' +
                    p.img +
                    '" alt="" width="120" height="80">' +
                    '<div class="monitor-offer-name">' +
                    p.nombre +
                    '</div>' +
                    '<div class="monitor-offer-desc">' +
                    p.marca +
                    '</div>' +
                    '<div class="monitor-offer-price">' +
                    formatCOP(p.precio) +
                    '</div></a>'
                );
            })
            .join('');
    }

    function showOffers() {
        var panel = $('monitorOffersPanel');
        if (!panel) return;
        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            showNotification('Elige una oferta — te llevamos al catálogo');
        }
    }

    function showModal(icon, title, text, linkHref) {
        var overlay = $('monitorModalOverlay');
        if (!overlay) return;
        $('monitorModalIcon').textContent = icon;
        $('monitorModalTitle').textContent = title;
        $('monitorModalText').innerHTML = text;
        var link = $('monitorModalLink');
        if (link) {
            link.href = linkHref || 'coleccion.html?promo=oferta&codigo=' + CODIGO_PROMO;
            link.style.display = linkHref === null ? 'none' : 'inline-block';
        }
        overlay.classList.add('show');
    }

    function closeModal(e) {
        if (e && e.target !== $('monitorModalOverlay') && !e.target.classList.contains('monitor-modal-close')) return;
        $('monitorModalOverlay')?.classList.remove('show');
    }

    function startTyping() {
        if (isTyping) return;
        isTyping = true;
        if (!logoShown) showLogo();
        var container = $('monitorTypedContent');
        var statusText = $('monitorStatusText');
        if (!container) return;
        container.innerHTML = '';
        var promoMessages = buildPromoMessages();
        var index = 0;

        function typeNext() {
            if (index >= promoMessages.length) {
                isTyping = false;
                if (statusText) {
                    statusText.textContent = 'PROMO ACTIVA';
                    statusText.style.color = '#d4a056';
                }
                return;
            }
            if (statusText) {
                statusText.textContent = 'ESCRIBIENDO...';
                statusText.style.color = '#c0392b';
            }
            var line = document.createElement('div');
            line.className = 'monitor-typed-line';
            line.innerHTML = promoMessages[index].text;
            container.appendChild(line);
            setTimeout(function () {
                line.classList.add('visible');
                index++;
                setTimeout(typeNext, promoMessages[index - 1].delay);
            }, 280);
        }
        typeNext();
    }

    function resetPC() {
        clickCount = 0;
        isTyping = false;
        logoShown = false;
        var count = $('monitorClickCount');
        if (count) count.textContent = '0';
        var typed = $('monitorTypedContent');
        if (typed) typed.innerHTML = '';
        $('monitorCoffeeLogo')?.classList.remove('active');
        $('monitorOffersPanel')?.classList.remove('show');
        var st = $('monitorStatusText');
        if (st) {
            st.textContent = 'EN LÍNEA';
            st.style.color = '';
        }
        showNotification('Monitor reiniciado');
    }

    function handleMonitorClick(e) {
        clickCount++;
        var count = $('monitorClickCount');
        if (count) count.textContent = String(clickCount);
        createBurst(e.clientX, e.clientY);

        if (clickCount === 1) {
            showNotification('Bienvenido a Paz Magdalena');
            showLogo();
        } else if (clickCount === 2) {
            showNotification('Escribiendo promoción...');
            startTyping();
        } else if (clickCount === 3) {
            showNotification('Ofertas del catálogo');
            showOffers();
        } else if (clickCount === 4) {
            sessionStorage.setItem('paz_codigo_promo', CODIGO_PROMO);
            showModal(
                '🎉',
                'Código de descuento',
                'Usa <strong>' +
                    CODIGO_PROMO +
                    '</strong> en el catálogo para 20% en tu primera compra.',
                'coleccion.html?promo=oferta&codigo=' + CODIGO_PROMO
            );
        } else {
            showOffers();
        }
    }

    function handleCupClick(e) {
        e.stopPropagation();
        createBurst(e.clientX, e.clientY);
        showNotification('Recargado — sigue explorando promos');
        clickCount++;
        var count = $('monitorClickCount');
        if (count) count.textContent = String(clickCount);
    }

    function bindUI() {
        $('monitorScreen')?.addEventListener('click', handleMonitorClick);
        $('monitorBtnOffers')?.addEventListener('click', showOffers);
        $('monitorBtnReset')?.addEventListener('click', resetPC);
        $('monitorBtnTyping')?.addEventListener('click', startTyping);
        $('monitorBtnLogo')?.addEventListener('click', showLogo);
        $('monitorCup')?.addEventListener('click', handleCupClick);
        $('monitorModalOverlay')?.addEventListener('click', closeModal);
        document.querySelectorAll('.monitor-modal-close').forEach(function (btn) {
            btn.addEventListener('click', closeModal);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && document.getElementById('monitor-promo')) startTyping();
            if (e.key === 'Escape') closeModal();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('monitor-promo')) return;
        createParticles();
        renderOfferCards();
        bindUI();
    });
})();
