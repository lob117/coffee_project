/**
 * UI — Trazabilidad inmutable por roles (Productor / Intermediario / Compradora)
 */
(function () {
    'use strict';

    var BC = window.PAZ_BLOCKCHAIN;
    if (!BC) return;

    var state = {
        role: 'producer',
        lastLot: null,
        photoCache: {}
    };

    function $(id) {
        return document.getElementById(id);
    }

    function showAlert(el, msg, ok) {
        if (!el) return;
        el.className = 'bc-alert ' + (ok ? 'ok' : 'err');
        el.textContent = msg;
        el.hidden = !msg;
    }

    function switchRole(role) {
        state.role = role;
        document.querySelectorAll('.bc-role-btn').forEach(function (b) {
            b.classList.toggle('is-active', b.dataset.role === role);
        });
        document.querySelectorAll('.bc-view').forEach(function (v) {
            v.classList.toggle('is-active', v.id === 'view-' + role);
        });
        if (role === 'buyer') {
            refreshBuyerView($('buyerCodeInput')?.value || BC.DEFAULT_LOT.packageCode);
        }
    }

    function formatTs(iso) {
        try {
            return new Date(iso).toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (e) {
            return iso;
        }
    }

    function bindPhotoInput(inputId, previewId, cacheKey) {
        var input = $(inputId);
        var preview = $(previewId);
        if (!input) return;
        input.addEventListener('change', function () {
            var file = input.files[0];
            if (!file) return;
            BC.readPhotoFile(file).then(function (url) {
                state.photoCache[cacheKey] = url;
                if (preview) {
                    preview.innerHTML = '<img src="' + url + '" alt="Vista previa">';
                    preview.closest('.bc-photo-zone')?.classList.add('has-file');
                }
            });
        });
    }

    function handleProducerSubmit(e) {
        e.preventDefault();
        var alert = $('producerAlert');
        var photo = state.photoCache.producer || null;
        if (!photo) {
            showAlert(alert, 'Debe tomar o subir la foto de la caja con QR antes de registrar.', false);
            return;
        }
        BC.createLot({
            productType: $('prodType')?.value,
            lotNumber: $('prodLot')?.value,
            weightKg: $('prodWeight')?.value,
            photoDataUrl: photo,
            iotSensorId: $('prodIot')?.value || null
        }).then(function (res) {
            if (!res.ok) {
                showAlert(alert, res.error, false);
                return;
            }
            state.lastLot = res.lot;
            $('prodHashOut').textContent = res.lot.blocks[0].hash;
            $('prodCodeOut').textContent = res.lot.packageCode;
            $('prodLotIdOut').textContent = res.lot.lotId;
            $('producerHashPanel').hidden = false;
            showAlert(
                alert,
                'Lote registrado. Código único: ' + res.lot.packageCode + ' — compártalo con logística.',
                true
            );
        });
    }

    function handleIntermediarySubmit(e) {
        e.preventDefault();
        var alert = $('interAlert');
        var photo = state.photoCache.inter || null;
        BC.appendCheckpoint({
            packageCode: $('interCode')?.value,
            weightKg: $('interWeight')?.value,
            photoDataUrl: photo,
            intermediaryType: $('interType')?.value,
            iotWeight: $('interIotWeight')?.value,
            note: $('interNote')?.value
        }).then(function (res) {
            if (!res.ok) {
                showAlert(alert, res.error, false);
                $('interBlockPreview').hidden = true;
                return;
            }
            var b = res.block;
            $('interBlockPreview').hidden = false;
            $('interBlockText').innerHTML =
                '<strong>Nuevo bloque #' +
                b.index +
                '</strong> añadido<br>' +
                '<span class="bc-ts">' +
                formatTs(b.timestamp) +
                '</span><br>' +
                b.location.label +
                '<br>Hash: <code style="color:var(--bc-hash)">' +
                b.hash.slice(0, 24) +
                '…</code>';
            showAlert(alert, 'Punto de control inmutable registrado. Peso verificado.', true);
            state.photoCache.inter = null;
        });
    }

    function handleBuyerLookup() {
        var code = $('buyerCodeInput')?.value?.trim();
        refreshBuyerView(code);
    }

    function renderTimeline(lot, container) {
        if (!container || !lot) return;
        var labels = {
            GENESIS: 'Origen — Productor',
            CHECKPOINT: 'Punto de control',
            DELIVERY: 'Entrega internacional'
        };

        container.innerHTML = lot.blocks
            .map(function (b) {
                var stepLabel = labels[b.type] || b.type;
                if (b.type === 'CHECKPOINT' && b.meta && b.meta.intermediaryType === 'hotel') {
                    stepLabel = 'Hotel — Custodia pre-exportación';
                } else if (b.type === 'CHECKPOINT') {
                    stepLabel = 'Transporte — Logística';
                }
                var photoHtml = b.photoDataUrl
                    ? '<img class="bc-tl-photo" src="' +
                      b.photoDataUrl +
                      '" alt="Evidencia">'
                    : '<div class="bc-tl-photo placeholder">📷 Placeholder — evidencia en finca / ruta simulada</div>';
                var wBadge = b.weightMatch
                    ? '<span class="bc-weight-badge ok">Peso ' + b.weightKg + ' kg ✓</span>'
                    : '<span class="bc-weight-badge fail">Peso alterado</span>';

                return (
                    '<article class="bc-tl-item done">' +
                    '<h3>' +
                    stepLabel +
                    '</h3>' +
                    '<p class="bc-tl-meta">' +
                    b.actorName +
                    ' · ' +
                    b.actorOrg +
                    '<br>' +
                    formatTs(b.timestamp) +
                    ' · ' +
                    (b.location && b.location.label ? b.location.label : '') +
                    '</p>' +
                    wBadge +
                    photoHtml +
                    '<p class="bc-tl-hash">#' +
                    b.index +
                    ' · ' +
                    b.hash.slice(0, 32) +
                    '…</p></article>'
                );
            })
            .join('');
    }

    function refreshBuyerView(code) {
        var lot =
            BC.findLot(code) ||
            BC.findLot(BC.DEFAULT_LOT.lotId) ||
            BC.listLots()[0];
        var timeline = $('buyerTimeline');
        var summary = $('buyerSummary');
        var verify = $('buyerVerify');

        if (!lot) {
            if (summary) summary.textContent = 'No hay lotes. Registre uno como productor.';
            if (timeline) timeline.innerHTML = '';
            return;
        }

        if (summary) {
            summary.innerHTML =
                '<strong>' +
                lot.productType +
                '</strong> · Lote ' +
                lot.lotNumber +
                '<br>Vendedor: <em>' +
                lot.producer.name +
                '</em> (' +
                lot.producer.org +
                ')<br>Compradora: <em>' +
                lot.buyer.name +
                '</em> — ' +
                lot.buyer.country +
                '<br>Código inmutable: <code style="color:var(--bc-hash)">' +
                lot.packageCode +
                '</code> · Peso sellado: <strong>' +
                lot.weightKg +
                ' kg</strong>';
        }

        renderTimeline(lot, timeline);

        BC.verifyChain(lot).then(function (v) {
            if (verify) {
                verify.className = 'bc-alert ' + (v.valid ? 'ok' : 'err');
                verify.textContent = v.valid
                    ? '✓ Cadena íntegra — Smart contract visual validado (SHA-256 simulado)'
                    : '✗ Integridad comprometida: ' + v.errors.join('; ');
            }
        });

        var certs = $('buyerCerts');
        if (certs) {
            certs.innerHTML = (lot.certifications || [])
                .map(function (c) {
                    return '<div class="bc-cert"><strong>Verificado</strong>' + c + '</div>';
                })
                .join('');
        }
    }

    function handleDeliveryConfirm() {
        var code = $('buyerCodeInput')?.value;
        BC.confirmDelivery({ packageCode: code, weightKg: $('buyerWeight')?.value }).then(function (res) {
            var el = $('buyerDeliveryAlert');
            if (res.ok) {
                showAlert(el, 'Entrega internacional registrada en blockchain.', true);
                refreshBuyerView(code);
            } else {
                showAlert(el, res.error, false);
            }
        });
    }

    function getDemoLot() {
        var lots = BC.listLots();
        if (lots.length) return lots[0];
        return {
            lotNumber: BC.DEFAULT_LOT.lotNumber,
            weightKg: BC.DEFAULT_LOT.weightKg,
            packageCode: BC.DEFAULT_LOT.packageCode,
            lotId: BC.DEFAULT_LOT.lotId
        };
    }

    function initDefaults() {
        var demo = getDemoLot();
        var prodLot = $('prodLot');
        if (prodLot && !prodLot.value) prodLot.value = demo.lotNumber;
        var prodWeight = $('prodWeight');
        if (prodWeight && !prodWeight.value) prodWeight.value = String(demo.weightKg);
        var prodType = $('prodType');
        if (prodType) prodType.value = 'Cacao y Café Artesanal';

        var interCode = $('interCode');
        if (interCode) interCode.value = demo.packageCode || '';
        var interWeight = $('interWeight');
        if (interWeight) interWeight.value = String(demo.weightKg);

        var buyerCode = $('buyerCodeInput');
        if (buyerCode) buyerCode.value = demo.packageCode || demo.lotId || '';
        var buyerWeight = $('buyerWeight');
        if (buyerWeight) buyerWeight.value = String(demo.weightKg);

        setTimeout(function () {
            refreshBuyerView(buyerCode?.value);
        }, 100);
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('bc-page')) return;

        document.querySelectorAll('.bc-role-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchRole(btn.dataset.role);
            });
        });

        $('producerForm')?.addEventListener('submit', handleProducerSubmit);
        $('interForm')?.addEventListener('submit', handleIntermediarySubmit);
        $('btnBuyerLookup')?.addEventListener('click', handleBuyerLookup);
        $('btnBuyerDelivery')?.addEventListener('click', handleDeliveryConfirm);
        $('btnResetDemo')?.addEventListener('click', function () {
            BC.resetDemo().then(function () {
                initDefaults();
                refreshBuyerView(BC.DEFAULT_LOT.packageCode);
                alert('Demo restaurada: caso Eder Ochoa → Vianis Flórez.');
            });
        });

        bindPhotoInput('prodPhoto', 'prodPhotoPreview', 'producer');
        bindPhotoInput('interPhoto', 'interPhotoPreview', 'inter');

        initDefaults();
        switchRole('buyer');

        var hash = (location.hash || '').replace('#', '');
        if (hash === 'intermediary' || hash === 'inter') switchRole('intermediary');
        if (hash === 'buyer' || hash === 'compradora') switchRole('buyer');
    });
})();
