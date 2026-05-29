/**
 * Mapa GIS Magdalena + perfiles QR — Leaflet
 */
(function () {
    'use strict';

    var FINCAS = {
        qr01: {
            id: 'qr01',
            qrLabel: 'QR_01',
            nombre: 'Finca La Esperanza',
            lat: 11.1284,
            lng: -74.0821,
            escena:
                'Amanecer en terrazas verdes: doña Carmen Ruiz, 2ª generación, revisa sacos secos junto a un beneficio de madera con tejas de zinc.',
            historia: [
                'Finca La Esperanza nació en 1968 cuando la familia Ruiz compró tres hectáreas abandonadas en la ladera de Minca. Con manos de campesinos y semillas donadas por vecinos, transformaron barbecho en café de sombra bajo guamos centenarios.',
                'En 2014 enfrentaron una plaga de broca que casi los obliga a arrancar el cultivo. En lugar de químicos agresivos, implementaron monitoreo semanal y fermentación controlada; hoy exportan microlotes con sello de origen Sierra Nevada y registro digital TRZ-SN-2026-0842.'
            ],
            produccion: '2 picos principales (abril–mayo y octubre–noviembre)',
            ambiente: '1.420 m s.n.m., niebla matutina, suelo franco-arcilloso con materia orgánica alta',
            semilla: 'Variedad Castillo: dulce, notas de chocolate con nueces y caramelo suave'
        },
        qr02: {
            id: 'qr02',
            qrLabel: 'QR_02',
            nombre: 'Hacienda El Recuerdo',
            lat: 11.0956,
            lng: -74.1148,
            escena:
                'Vista desde el corredor del patio: el patriarca José Méndez muestra un álbum de fotos sepia mientras jóvenes clasifican cerezas rojas en mesas de malla.',
            historia: [
                'El nombre honra a los abuelos que fundaron la hacienda tras la migración desde el interior en los años 50. El Recuerdo conserva diarios de cosecha escritos a mano, hoy digitalizados para trazabilidad turística.',
                'Su método distintivo es el “reposo en sombra de guayacán”: los granos secan lentamente bajo canopy nativo, lo que reduce estrés térmico y realza acidez balanceada. Colaboran con Transportes SierraMar para llevar el café a Santa Marta en menos de cuatro horas.'
            ],
            produccion: '1 pico principal (septiembre–diciembre) con cosecha selectiva manual',
            ambiente: '1.380 m, valle protegido del viento, microclima húmedo con lluvias orográficas',
            semilla: 'Variedad Caturra: cuerpo medio, notas de panela y frutos rojos maduros'
        },
        qr03: {
            id: 'qr03',
            qrLabel: 'QR_03',
            nombre: 'Finca Las Nubes',
            lat: 11.1562,
            lng: -74.0589,
            escena:
                'Niebla baja sobre el lote: ingeniera agrónoma Laura Peña y su equipo miden humedad del suelo con sensores IoT junto a líneas de café bajo sombra de nogales.',
            historia: [
                'Las Nubes debe su nombre a las brumas que cubren la finca casi todo el año. Fundada por mujeres cafeteras en 2001, prioriza equidad de género y capacitación en catación para jóvenes del corregimiento.',
                'Fueron pioneras en registrar lotes con geolocalización y QR en el empaque. Su desafío fue conectar señal en zona rural: instalaron punto Wi‑Fi comunitario en el beneficio, permitiendo escaneos en tiempo real para turistas y compradores internacionales.'
            ],
            produccion: '2 picos (marzo–abril y septiembre–octubre)',
            ambiente: '1.550 m, alta montaña con niebla persistente, suelo volcánico y sombra nativa',
            semilla: 'Variedad Typica: ácido cítrico, notas herbales y florales, menos dulce, final limpio'
        },
        qr04: {
            id: 'qr04',
            qrLabel: 'QR_04',
            nombre: 'Hacienda Sol Naciente',
            lat: 11.0723,
            lng: -74.1365,
            escena:
                'Rayos dorados iluminan campos orientados al este: hermanos Vega inspeccionan plantones de café orgánico junto a canales de biodiversidad para aves migratorias.',
            historia: [
                'Sol Naciente se estableció en laderas expuestas al amanecer, ideales para fotosíntesis lenta y maduración uniforme. La familia Vega combina apicultura con café para polinización natural y un ingreso complementario en temporadas bajas.',
                'Tras una sequía en 2015, construyeron represas de infiltración y reforestaron quebradas. Hoy certifican prácticas Rainforest Alliance y ofrecen tours de “del grano a la taza” enlazados al mapa GIS de Paz Magdalena.'
            ],
            produccion: '1 pico extendido (octubre–enero) con repaso de cereza sobremadura',
            ambiente: '1.290 m, ladera este, suelo volcánico bien drenado, menor niebla que cumbres',
            semilla: 'Variedad Bourbon Rosado: aromático, frutas amarillas, miel de caña y acidez brillante'
        },
        qr05: {
            id: 'qr05',
            qrLabel: 'QR_05',
            nombre: 'Finca El Mirador',
            lat: 11.1418,
            lng: -74.0712,
            escena:
                'Retrato de Eder Ochoa, 3ª generación, sonriendo frente al beneficio de café con la bahía de Santa Marta visible entre nubes al fondo — Finca Porvenir / El Mirador.',
            historia: [
                'Finca El Mirador, también conocida como Porvenir en registros comerciales, corona una loma con vista al mar Caribe. Eder Ochoa heredó el mando de su abuelo y combina cacao de fino aroma con café especial en lotes separados y trazables.',
                'El Mirador fue la finca piloto del hackathon Paz Magdalena: cada saco lleva QR, hash blockchain simulado y enlace al perfil del turista. Vianis Flórez, compradora en EE.UU., validó aquí el primer lote TRZ-SN-2026-0842 con certificaciones Fairtrade y Rainforest Alliance.'
            ],
            produccion: '2 picos (mayo–junio café; noviembre cacao-café combinado)',
            ambiente: '1.480 m, terraza mirador, brisa marina moderada, suelo rico en hummus de bosque',
            semilla: 'Variedad Colombia: balanceada, chocolate negro, nuez tostada y final dulce persistente'
        }
    };

    var map;
    var markersLayer = [];

    function iconHtml(emoji, className) {
        return L.divIcon({
            className: 'trz-custom-marker',
            html: '<div class="' + className + '"><span>' + emoji + '</span></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });
    }

    function initMap() {
        var el = document.getElementById('trzMap');
        if (!el || typeof L === 'undefined') return;

        map = L.map('trzMap', { scrollWheelZoom: true }).setView([11.12, -74.1], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Paz Magdalena GIS simulado',
            maxZoom: 16
        }).addTo(map);

        addMarkers();
        bindFiltros();
    }

    function addMarkers() {
        markersLayer.forEach(function (m) {
            map.removeLayer(m);
        });
        markersLayer = [];

        Object.keys(FINCAS).forEach(function (key) {
            var f = FINCAS[key];
            var m = L.marker([f.lat, f.lng], { icon: iconHtml('☕', 'trz-marker-finca') })
                .bindPopup(
                    '<strong>' +
                        f.nombre +
                        '</strong><br>Finca cafetera · Sierra Nevada<br>' +
                        '<a href="#" class="trz-popup-link" data-perfil="' +
                        f.id +
                        '">Ver perfil de trazabilidad</a>'
                )
                .addTo(map);
            m._trzCategory = 'finca';
            m._trzId = f.id;
            markersLayer.push(m);
        });

        var transportes = [
            { lat: 11.1082, lng: -74.152, nombre: 'Ruta Troncal · Minca' },
            { lat: 11.1985, lng: -74.218, nombre: 'Ruta Costera · Santa Marta' }
        ];
        transportes.forEach(function (t) {
            var m = L.marker([t.lat, t.lng], { icon: iconHtml('🚚', 'trz-marker-transporte') })
                .bindPopup(
                    '<strong>Transportes SierraMar</strong><br>' +
                        t.nombre +
                        '<br>Ruta logística asegurada — temperatura controlada'
                )
                .addTo(map);
            m._trzCategory = 'transporte';
            markersLayer.push(m);
        });

        var hoteles = [
            { lat: 11.2412, lng: -74.2145, nombre: 'Hotel Bahía Dorada' },
            { lat: 11.2489, lng: -74.1892, nombre: 'Hotel Casa Tayrona' },
            { lat: 11.2356, lng: -74.2018, nombre: 'Hotel Miramar Boutique' }
        ];
        hoteles.forEach(function (h) {
            var m = L.marker([h.lat, h.lng], { icon: iconHtml('🏨', 'trz-marker-hotel') })
                .bindPopup(
                    '<strong>' +
                        h.nombre +
                        '</strong><br>Café de origen disponible en lobby<br>Sierra Nevada · Paz Magdalena'
                )
                .addTo(map);
            m._trzCategory = 'hotel';
            markersLayer.push(m);
        });

        map.on('popupopen', function (e) {
            var popupEl = e.popup.getElement();
            var link = popupEl ? popupEl.querySelector('.trz-popup-link') : null;
            if (link) {
                link.onclick = function (ev) {
                    ev.preventDefault();
                    var id = link.getAttribute('data-perfil');
                    switchTab('perfiles');
                    openPerfil(id);
                    map.closePopup();
                };
            }
        });
    }

    function bindFiltros() {
        document.querySelectorAll('.trz-filtro-cat').forEach(function (cb) {
            cb.addEventListener('change', applyFiltros);
        });
    }

    function applyFiltros() {
        var show = {
            finca: document.getElementById('filtroFincas')?.checked !== false,
            transporte: document.getElementById('filtroTransporte')?.checked !== false,
            hotel: document.getElementById('filtroHoteles')?.checked !== false
        };
        markersLayer.forEach(function (m) {
            if (show[m._trzCategory]) {
                if (!map.hasLayer(m)) m.addTo(map);
            } else {
                map.removeLayer(m);
            }
        });
    }

    function switchTab(tabId) {
        document.querySelectorAll('.trz-tab').forEach(function (t) {
            t.classList.toggle('is-active', t.dataset.tab === tabId);
        });
        document.querySelectorAll('.trz-panel').forEach(function (p) {
            p.classList.toggle('is-active', p.id === 'panel-' + tabId);
        });
        if (tabId === 'mapa' && map) {
            setTimeout(function () {
                map.invalidateSize();
            }, 200);
        }
    }

    function renderPerfil(id) {
        var f = FINCAS[id];
        if (!f) return;
        var box = document.getElementById('trzPerfilDetalle');
        if (!box) return;

        box.innerHTML =
            '<div class="trz-perfil is-visible" id="perfil-' +
            f.id +
            '">' +
            '<div class="trz-perfil-header">' +
            '<div><span class="trz-perfil-tag">' +
            f.qrLabel +
            ' · Escaneo simulado</span>' +
            '<h2>' +
            f.nombre +
            '</h2></div>' +
            '<button type="button" class="trz-btn-back" data-action="cerrar-perfil">← Volver a códigos QR</button>' +
            '</div>' +
            '<div class="trz-img-placeholder" role="img" aria-label="Imagen de referencia">' +
            '<span>📷 Imagen de referencia (placeholder)<br>' +
            f.escena +
            '</span></div>' +
            '<div class="trz-historia">' +
            '<p>' +
            f.historia[0] +
            '</p><p>' +
            f.historia[1] +
            '</p></div>' +
            '<div class="trz-datos-grid">' +
            '<div class="trz-dato-card"><h4>Producciones al año</h4><p>' +
            f.produccion +
            '</p></div>' +
            '<div class="trz-dato-card"><h4>Condición ambiental</h4><p>' +
            f.ambiente +
            '</p></div>' +
            '<div class="trz-dato-card"><h4>Características de la semilla</h4><p>' +
            f.semilla +
            '</p></div>' +
            '</div></div>';

        box.querySelector('[data-action="cerrar-perfil"]')?.addEventListener('click', closePerfil);

        document.querySelectorAll('.trz-qr-card').forEach(function (card) {
            card.classList.toggle('is-selected', card.dataset.perfil === id);
        });

        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openPerfil(id) {
        renderPerfil(id);
        if (location.hash !== '#perfil-' + id) {
            history.replaceState(null, '', '#perfil-' + id);
        }
    }

    function closePerfil() {
        var box = document.getElementById('trzPerfilDetalle');
        if (box) box.innerHTML = '';
        document.querySelectorAll('.trz-qr-card').forEach(function (c) {
            c.classList.remove('is-selected');
        });
        history.replaceState(null, '', '#perfiles');
    }

    function bindUI() {
        document.querySelectorAll('.trz-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchTab(tab.dataset.tab);
            });
        });

        document.querySelectorAll('.trz-qr-card').forEach(function (card) {
            card.addEventListener('click', function () {
                switchTab('perfiles');
                openPerfil(card.dataset.perfil);
            });
        });

        var hash = (location.hash || '').replace('#', '');
        if (hash.indexOf('perfil-') === 0) {
            switchTab('perfiles');
            openPerfil(hash.replace('perfil-', ''));
        } else if (hash === 'mapa') {
            switchTab('mapa');
        } else if (hash === 'perfiles') {
            switchTab('perfiles');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('trzMap')) return;
        bindUI();
        initMap();
        window.PAZ_TRZ_FINCAS = FINCAS;
        window.PAZ_TRZ_openPerfil = function (id) {
            switchTab('perfiles');
            openPerfil(id);
        };
    });
})();
