/**
 * UI blockchain — acceso por tipo de empresa y comprador vinculado
 */
(function () {
    'use strict';

    var BC = window.PAZ_BLOCKCHAIN;
    var Cuenta = window.PazCuenta;
    if (!BC || !Cuenta) return;

    var state = {
        role: null,
        allowedRoles: [],
        session: null,
        account: null,
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
        if (state.allowedRoles.indexOf(role) < 0) return;
        state.role = role;
        document.querySelectorAll('.bc-role-btn').forEach(function (b) {
            b.classList.toggle('is-active', b.dataset.role === role);
            b.style.display = state.allowedRoles.indexOf(b.dataset.role) >= 0 ? '' : 'none';
        });
        document.querySelectorAll('.bc-view').forEach(function (v) {
            v.classList.toggle('is-active', v.id === 'view-' + role);
        });
        if (role === 'buyer') {
            var code = $('buyerCodeInput')?.value;
            if (code) refreshBuyerView(code);
        }
    }

    function formatTs(iso) {
        try {
            return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
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
                    var zone = preview.closest('.bc-photo-zone');
                    if (zone) zone.classList.add('has-file');
                }
            });
        });
    }

    function setupAccess() {
        var gate = $('bcAccessGate');
        var main = $('bcMain');
        state.session = Cuenta.getSesion();

        if (!state.session) {
            if (gate) {
                gate.hidden = false;
                gate.innerHTML =
                    '<div class="bc-card"><h2>Acceso restringido</h2><p>Inicie sesión con su cuenta de <strong>empresa</strong> (productor) o de <strong>comprador</strong> para operar la blockchain.</p>' +
                    '<p style="margin-top:1rem"><a href="iniciar-sesion.html" class="bc-btn bc-btn-primary" style="display:inline-block;width:auto;text-decoration:none">Iniciar sesión</a></p></div>';
            }
            if (main) main.hidden = true;
            document.querySelector('.bc-role-nav')?.style.setProperty('display', 'none');
            return;
        }

        if (gate) gate.hidden = true;
        if (main) main.hidden = false;

        state.allowedRoles = Cuenta.getBlockchainRolesPermitidos();

        if (state.session.tipo === 'productor') {
            state.account = Cuenta.getProductores().find(function (p) {
                return p.email === state.session.email;
            });
            var sub = $('producerSub');
            if (sub && state.account) {
                sub.textContent =
                    Cuenta.getTipoEmpresaLabel(state.account.tipoEmpresa) +
                    ' — ' +
                    state.account.nombreEmpresa;
            }
            var interSub = $('intermediarySub');
            if (interSub && state.account) {
                interSub.textContent = state.account.nombreEmpresa;
            }
            if (Cuenta.puedeVerBlockchainIntermediario(state.account)) {
                var interType = $('interType');
                if (interType) {
                    if (state.account.tipoEmpresa === Cuenta.TIPO_EMPRESA.TRANSPORTE) {
                        interType.innerHTML =
                            '<option value="transport">Transportadora de café</option>';
                    } else {
                        interType.innerHTML =
                            '<option value="puesto_venta">Puesto de venta de café</option>';
                    }
                }
            }
        }

        if (state.session.tipo === 'usuario') {
            state.account = Cuenta.getUsuarios().find(function (u) {
                return u.email === state.session.email;
            });
            var buyerSub = $('buyerSub');
            if (buyerSub && state.account) {
                buyerSub.textContent = 'Comprador: ' + state.account.email;
            }
        }

        if (!state.allowedRoles.length) {
            if (gate) {
                gate.hidden = false;
                gate.innerHTML =
                    '<div class="bc-card"><h2>Sin permiso blockchain</h2><p>Su tipo de cuenta no puede operar este módulo. Las fincas registran lotes; transportadoras y puestos de venta validan puntos de control; los compradores ven productos que hayan vinculado con su código.</p></div>';
            }
            if (main) main.hidden = true;
            return;
        }

        document.querySelectorAll('.bc-role-btn').forEach(function (btn) {
            var r = btn.dataset.role;
            btn.style.display = state.allowedRoles.indexOf(r) >= 0 ? '' : 'none';
        });

        switchRole(state.allowedRoles[0]);
    }

    function handleProducerSubmit(e) {
        e.preventDefault();
        if (state.session.tipo !== 'productor' || !Cuenta.puedeVerBlockchainProductor(state.account)) return;

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
            iotSensorId: $('prodIot')?.value || null,
            producerCompany: state.account.nombreEmpresa,
            producerEmail: state.account.email,
            producerTipo: state.account.tipoEmpresa
        }).then(function (res) {
            if (!res.ok) {
                showAlert(alert, res.error, false);
                return;
            }
            $('prodHashOut').textContent = res.lot.blocks[0].hash;
            $('prodCodeOut').textContent = res.lot.packageCode;
            $('prodLotIdOut').textContent = res.lot.lotId;
            $('producerHashPanel').hidden = false;
            showAlert(
                alert,
                'Lote registrado. Código principal: ' + res.lot.packageCode,
                true
            );
        });
    }

    function handleIntermediarySubmit(e) {
        e.preventDefault();
        if (state.session.tipo !== 'productor' || !Cuenta.puedeVerBlockchainIntermediario(state.account)) return;

        var alert = $('interAlert');
        var photo = state.photoCache.inter || null;
        if (!photo) {
            showAlert(alert, 'Suba la foto obligatoria del estado de la caja.', false);
            return;
        }

        var interType =
            state.account.tipoEmpresa === Cuenta.TIPO_EMPRESA.PUESTO ? 'puesto_venta' : 'transport';

        BC.appendCheckpoint({
            packageCode: $('interCode')?.value,
            weightKg: $('interWeight')?.value,
            photoDataUrl: photo,
            intermediaryType: interType,
            companyName: state.account.nombreEmpresa,
            operatorEmail: state.account.email,
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
                '</strong><br><span class="bc-ts">' +
                formatTs(b.timestamp) +
                '</span><br>' +
                b.location.label;
            showAlert(alert, 'Punto de control registrado en la cadena.', true);
            state.photoCache.inter = null;
        });
    }

    function refreshBuyerView(code) {
        var alert = $('buyerAccessAlert');
        var timeline = $('buyerTimeline');
        var summary = $('buyerSummary');
        var verify = $('buyerVerify');
        var certs = $('buyerCerts');
        var deliveryBox = $('buyerDeliveryBox');

        code = (code || '').trim().toUpperCase();
        if (!code) {
            if (alert) {
                alert.hidden = false;
                alert.className = 'bc-alert err';
                alert.textContent = 'Ingrese el código principal del producto.';
            }
            if (timeline) timeline.innerHTML = '';
            return;
        }

        var lot = BC.findLot(code);
        if (!lot) {
            if (alert) {
                alert.hidden = false;
                alert.className = 'bc-alert err';
                alert.textContent = 'Código no encontrado.';
            }
            if (timeline) timeline.innerHTML = '';
            return;
        }

        if (!BC.userCanViewAsBuyer(lot, state.account.email)) {
            if (alert) {
                alert.hidden = false;
                alert.className = 'bc-alert err';
                alert.textContent =
                    'Solo el comprador que vinculó este producto puede ver esta cadena. Use "Vincular compra" en su panel de usuario con este código.';
            }
            if (timeline) timeline.innerHTML = '';
            if (summary) summary.textContent = '';
            if (deliveryBox) deliveryBox.hidden = true;
            return;
        }

        if (alert) alert.hidden = true;
        if (deliveryBox) deliveryBox.hidden = false;

        if (summary) {
            summary.innerHTML =
                '<strong>' +
                lot.productType +
                '</strong> · Lote ' +
                lot.lotNumber +
                '<br>Origen: <em>' +
                lot.producerCompany +
                '</em><br>Código: <code style="color:var(--bc-hash)">' +
                lot.packageCode +
                '</code> · Peso sellado: <strong>' +
                lot.weightKg +
                ' kg</strong>';
        }

        if (timeline) {
            timeline.innerHTML = lot.blocks
                .map(function (b) {
                    var label =
                        b.type === 'GENESIS'
                            ? 'Origen — Finca'
                            : b.type === 'DELIVERY'
                              ? 'Entrega comprador'
                              : b.meta && b.meta.intermediaryType === 'puesto_venta'
                                ? 'Puesto de venta'
                                : 'Transporte';
                    return (
                        '<article class="bc-tl-item done"><h3>' +
                        label +
                        '</h3><p class="bc-tl-meta">' +
                        (b.actorOrg || b.actorName) +
                        '<br>' +
                        formatTs(b.timestamp) +
                        '</p><span class="bc-weight-badge ok">Peso ' +
                        b.weightKg +
                        ' kg</span></article>'
                    );
                })
                .join('');
        }

        BC.verifyChain(lot).then(function (v) {
            if (verify) {
                verify.className = 'bc-alert ' + (v.valid ? 'ok' : 'err');
                verify.textContent = v.valid
                    ? 'Cadena íntegra verificada (SHA-256)'
                    : 'Integridad comprometida: ' + v.errors.join('; ');
            }
        });

        if (certs) {
            certs.innerHTML = (lot.certifications || [])
                .map(function (c) {
                    return '<div class="bc-cert"><strong>Verificado</strong>' + c + '</div>';
                })
                .join('');
        }
    }

    function handleBuyerLookup() {
        refreshBuyerView($('buyerCodeInput')?.value);
    }

    function handleLinkPurchase() {
        var code = $('buyerLinkCode')?.value;
        var res = BC.assignBuyer(code, state.account.email);
        var el = $('buyerLinkAlert');
        if (res.ok) {
            showAlert(el, 'Producto vinculado. Ya puede consultar la cadena completa.', true);
            $('buyerCodeInput').value = res.lot.packageCode;
            refreshBuyerView(res.lot.packageCode);
        } else {
            showAlert(el, res.error, false);
        }
    }

    function handleDeliveryConfirm() {
        var code = $('buyerCodeInput')?.value;
        BC.confirmDelivery({
            packageCode: code,
            weightKg: $('buyerWeight')?.value,
            buyerEmail: state.account.email,
            buyerCompany: state.account.nacionalidad
                ? 'Comprador · ' + state.account.nacionalidad
                : 'Comprador registrado'
        }).then(function (res) {
            var el = $('buyerDeliveryAlert');
            if (res.ok) {
                showAlert(el, 'Entrega registrada en blockchain.', true);
                refreshBuyerView(code);
            } else {
                showAlert(el, res.error, false);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('bc-page')) return;

        setupAccess();

        document.querySelectorAll('.bc-role-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchRole(btn.dataset.role);
            });
        });

        $('producerForm')?.addEventListener('submit', handleProducerSubmit);
        $('interForm')?.addEventListener('submit', handleIntermediarySubmit);
        $('btnBuyerLookup')?.addEventListener('click', handleBuyerLookup);
        $('btnBuyerLink')?.addEventListener('click', handleLinkPurchase);
        $('btnBuyerDelivery')?.addEventListener('click', handleDeliveryConfirm);
        $('btnResetDemo')?.addEventListener('click', function () {
            BC.resetDemo().then(function () {
                alert('Cadena de demostración restaurada.');
                location.reload();
            });
        });

        bindPhotoInput('prodPhoto', 'prodPhotoPreview', 'producer');
        bindPhotoInput('interPhoto', 'interPhotoPreview', 'inter');

        var hash = (location.hash || '').replace('#', '');
        if (hash && state.allowedRoles.indexOf(hash) >= 0) switchRole(hash);
    });
})();
