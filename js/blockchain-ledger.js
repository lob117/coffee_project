/**
 * PAZ Magdalena — Ledger de trazabilidad inmutable (simulación blockchain)
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'paz_blockchain_ledger_v1';

    var LOCATIONS = {
        finca: { label: 'Sierra Nevada de Santa Marta', lat: 11.1418, lng: -74.0712 },
        transport: { label: 'Vía Minca — Troncal Magdalena', lat: 11.1082, lng: -74.152 },
        puesto: { label: 'Santa Marta, Magdalena', lat: 11.2412, lng: -74.2145 },
        buyer: { label: 'Hub de importación internacional', lat: 25.7617, lng: -80.1918 }
    };

    var DEFAULT_LOT = {
        lotId: 'TRZ-SN-2026-0842',
        productType: 'Cacao y Café Artesanal',
        lotNumber: 'LOTE-2026-001',
        weightKg: 25.4,
        producerCompany: 'Finca La Esperanza',
        producerTipo: 'finca_produccion',
        buyerEmail: null,
        certifications: ['Fairtrade International', 'Rainforest Alliance', 'Protocolo TIC Paz Magdalena v1.2'],
        status: 'delivered'
    };

    var ledger = {};

    function nowIso() {
        return new Date().toISOString();
    }

    function sha256Hex(input) {
        if (global.crypto && global.crypto.subtle && global.TextEncoder) {
            var enc = new TextEncoder().encode(input);
            return global.crypto.subtle.digest('SHA-256', enc).then(function (buf) {
                return Array.from(new Uint8Array(buf))
                    .map(function (b) {
                        return b.toString(16).padStart(2, '0');
                    })
                    .join('');
            });
        }
        return Promise.resolve(fallbackHash(input));
    }

    function fallbackHash(str) {
        var h = 0x811c9dc5;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 0x01000193) >>> 0;
        }
        var out = '';
        for (var j = 0; j < 8; j++) {
            h = (h * 0x01000193) ^ (str.charCodeAt(j % str.length) || 0);
            out += (h >>> 0).toString(16).padStart(8, '0');
        }
        return ('00000000' + out).slice(-64);
    }

    function blockPayload(block) {
        return JSON.stringify({
            index: block.index,
            type: block.type,
            role: block.role,
            actorName: block.actorName,
            weightKg: block.weightKg,
            timestamp: block.timestamp,
            location: block.location,
            prevHash: block.prevHash,
            photoRef: block.photoDataUrl ? block.photoDataUrl.slice(0, 80) : null,
            meta: block.meta || {}
        });
    }

    function computeBlockHash(block) {
        return sha256Hex(blockPayload(block));
    }

    function genesisHash() {
        return '0'.repeat(64);
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
        } catch (e) {
            console.warn('Ledger no persistido:', e);
        }
    }

    function indexLot(record) {
        ledger[record.lotId] = record;
        ledger[record.packageCode] = record;
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                ledger = JSON.parse(raw);
                return;
            }
        } catch (e) {
            ledger = {};
        }
        seedDemoChain();
    }

    function seedDemoChain() {
        var lot = {
            lotId: DEFAULT_LOT.lotId,
            productType: DEFAULT_LOT.productType,
            lotNumber: DEFAULT_LOT.lotNumber,
            weightKg: DEFAULT_LOT.weightKg,
            producerCompany: DEFAULT_LOT.producerCompany,
            producerEmail: null,
            producerTipo: DEFAULT_LOT.producerTipo,
            buyerEmail: null,
            certifications: DEFAULT_LOT.certifications.slice(),
            status: DEFAULT_LOT.status,
            packageCode: '',
            blocks: []
        };

        var steps = [
            {
                type: 'GENESIS',
                role: 'producer',
                company: 'Finca La Esperanza',
                weightKg: lot.weightKg,
                location: LOCATIONS.finca,
                meta: { note: 'Registro de lote en origen' }
            },
            {
                type: 'CHECKPOINT',
                role: 'intermediary',
                company: 'Transportes del Caribe SAS',
                weightKg: 25.4,
                location: LOCATIONS.transport,
                meta: { intermediaryType: 'transport', note: 'Ruta logística' }
            },
            {
                type: 'CHECKPOINT',
                role: 'intermediary',
                company: 'Café Origen Santa Marta',
                weightKg: 25.4,
                location: LOCATIONS.puesto,
                meta: { intermediaryType: 'puesto_venta', note: 'Puesto de venta — custodia' }
            },
            {
                type: 'DELIVERY',
                role: 'buyer',
                company: 'Comprador internacional (sin asignar)',
                weightKg: 25.4,
                location: LOCATIONS.buyer,
                meta: { note: 'Pendiente de vincular comprador registrado' }
            }
        ];

        var blocks = [];
        var chain = Promise.resolve(genesisHash());
        steps.forEach(function (step, idx) {
            chain = chain.then(function (previousHash) {
                var block = {
                    index: idx,
                    type: step.type,
                    role: step.role,
                    actorName: step.company,
                    actorOrg: step.company,
                    timestamp: new Date(Date.now() - (steps.length - idx) * 86400000 * 2).toISOString(),
                    location: step.location,
                    weightKg: step.weightKg,
                    weightMatch: Math.abs(step.weightKg - lot.weightKg) < 0.05,
                    photoDataUrl: null,
                    prevHash: previousHash,
                    hash: '',
                    meta: step.meta
                };
                return computeBlockHash(block).then(function (h) {
                    block.hash = h;
                    blocks.push(block);
                    return h;
                });
            });
        });

        return chain.then(function (lastHash) {
            lot.packageCode = lastHash.slice(0, 16).toUpperCase();
            lot.blocks = blocks;
            indexLot(lot);
            persist();
        });
    }

    function createLot(input) {
        var productType = (input.productType || '').trim();
        var lotNumber = (input.lotNumber || '').trim();
        var weightKg = parseFloat(input.weightKg);
        var photoDataUrl = input.photoDataUrl || null;
        var company = (input.producerCompany || 'Empresa productora').trim();
        var producerEmail = input.producerEmail || null;

        if (!productType || !lotNumber || isNaN(weightKg) || weightKg <= 0) {
            return Promise.resolve({ ok: false, error: 'Complete tipo, lote y peso válido (kg).' });
        }
        if (!photoDataUrl) {
            return Promise.resolve({ ok: false, error: 'Suba la foto de la caja con el QR impreso (captura inicial).' });
        }

        var lotId = 'TRZ-SN-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);

        var block = {
            index: 0,
            type: 'GENESIS',
            role: 'producer',
            actorName: company,
            actorOrg: company,
            timestamp: nowIso(),
            location: LOCATIONS.finca,
            weightKg: weightKg,
            weightMatch: true,
            photoDataUrl: photoDataUrl,
            prevHash: genesisHash(),
            hash: '',
            meta: { note: 'Captura inicial', iotSensorId: input.iotSensorId || null }
        };

        return computeBlockHash(block).then(function (hash) {
            block.hash = hash;
            var record = {
                lotId: lotId,
                productType: productType,
                lotNumber: lotNumber,
                weightKg: weightKg,
                producerCompany: company,
                producerEmail: producerEmail,
                producerTipo: input.producerTipo || 'finca_produccion',
                buyerEmail: null,
                certifications: DEFAULT_LOT.certifications.slice(),
                status: 'registered',
                packageCode: hash.slice(0, 16).toUpperCase(),
                blocks: [block]
            };
            indexLot(record);
            persist();
            return { ok: true, lot: record };
        });
    }

    function appendCheckpoint(input) {
        var code = (input.packageCode || '').trim().toUpperCase();
        var weightKg = parseFloat(input.weightKg);
        var photoDataUrl = input.photoDataUrl || null;
        var company = (input.companyName || 'Intermediario').trim();
        var interType = input.intermediaryType || 'transport';
        var location =
            interType === 'puesto_venta' ? LOCATIONS.puesto : LOCATIONS.transport;

        var lot = findLot(code);
        if (!lot) {
            return Promise.resolve({ ok: false, error: 'Código no encontrado en el ledger.' });
        }
        if (!photoDataUrl) {
            return Promise.resolve({ ok: false, error: 'La foto del estado de la caja es obligatoria.' });
        }
        if (isNaN(weightKg) || weightKg <= 0) {
            return Promise.resolve({ ok: false, error: 'Ingrese el peso actual del paquete.' });
        }

        var weightMatch = Math.abs(weightKg - lot.weightKg) < 0.15;
        var prevBlock = lot.blocks[lot.blocks.length - 1];

        var block = {
            index: lot.blocks.length,
            type: 'CHECKPOINT',
            role: 'intermediary',
            actorName: company,
            actorOrg: company,
            timestamp: nowIso(),
            location: location,
            weightKg: weightKg,
            weightMatch: weightMatch,
            photoDataUrl: photoDataUrl,
            prevHash: prevBlock.hash,
            hash: '',
            meta: {
                intermediaryType: interType,
                operatorEmail: input.operatorEmail || null,
                iotWeight: input.iotWeight != null ? parseFloat(input.iotWeight) : null,
                note: input.note || 'Punto de control validado'
            }
        };

        return computeBlockHash(block).then(function (hash) {
            if (!weightMatch) {
                return {
                    ok: false,
                    error:
                        'Peso no coincide con origen (' +
                        lot.weightKg +
                        ' kg). Integridad comprometida — bloque rechazado.'
                };
            }
            block.hash = hash;
            lot.blocks.push(block);
            lot.status = interType === 'puesto_venta' ? 'at_puesto' : 'in_transit';
            persist();
            return { ok: true, lot: lot, block: block };
        });
    }

    function confirmDelivery(input) {
        var code = (input.packageCode || '').trim().toUpperCase();
        var buyerEmail = (input.buyerEmail || '').trim().toLowerCase();
        var lot = findLot(code);
        if (!lot) {
            return Promise.resolve({ ok: false, error: 'Código no encontrado.' });
        }
        if (!buyerEmail) {
            return Promise.resolve({ ok: false, error: 'Debe iniciar sesión como comprador.' });
        }
        if (lot.buyerEmail && lot.buyerEmail !== buyerEmail) {
            return Promise.resolve({ ok: false, error: 'Este lote está asignado a otro comprador.' });
        }

        var prevBlock = lot.blocks[lot.blocks.length - 1];
        var weightKg = parseFloat(input.weightKg) || lot.weightKg;
        var buyerCompany = input.buyerCompany || 'Comprador registrado';

        var block = {
            index: lot.blocks.length,
            type: 'DELIVERY',
            role: 'buyer',
            actorName: buyerCompany,
            actorOrg: buyerCompany,
            timestamp: nowIso(),
            location: LOCATIONS.buyer,
            weightKg: weightKg,
            weightMatch: Math.abs(weightKg - lot.weightKg) < 0.15,
            photoDataUrl: input.photoDataUrl || null,
            prevHash: prevBlock.hash,
            hash: '',
            meta: { note: 'Recepción por comprador registrado' }
        };

        return computeBlockHash(block).then(function (hash) {
            block.hash = hash;
            lot.blocks.push(block);
            lot.status = 'delivered';
            lot.buyerEmail = buyerEmail;
            persist();
            if (global.PazCuenta && global.PazCuenta.registrarCompraLote) {
                global.PazCuenta.registrarCompraLote(buyerEmail, lot.packageCode);
            }
            return { ok: true, lot: lot };
        });
    }

    function assignBuyer(packageCode, buyerEmail) {
        var lot = findLot(packageCode);
        if (!lot) return { ok: false, error: 'Código no encontrado.' };
        buyerEmail = (buyerEmail || '').trim().toLowerCase();
        if (lot.buyerEmail && lot.buyerEmail !== buyerEmail) {
            return { ok: false, error: 'Lote ya asignado a otro comprador.' };
        }
        lot.buyerEmail = buyerEmail;
        persist();
        if (global.PazCuenta && global.PazCuenta.registrarCompraLote) {
            global.PazCuenta.registrarCompraLote(buyerEmail, lot.packageCode);
        }
        return { ok: true, lot: lot };
    }

    function userCanViewAsBuyer(lot, buyerEmail) {
        if (!lot || !buyerEmail) return false;
        buyerEmail = buyerEmail.toLowerCase();
        if (lot.buyerEmail === buyerEmail) return true;
        if (global.PazCuenta && global.PazCuenta.usuarioComproLote) {
            return global.PazCuenta.usuarioComproLote(buyerEmail, lot.packageCode);
        }
        return false;
    }

    function getSuccessionLine(code) {
        var lot = findLot(code);
        if (!lot || !lot.blocks || !lot.blocks.length) return null;
        return {
            packageCode: lot.packageCode,
            lotId: lot.lotId,
            productType: lot.productType,
            weightKg: lot.weightKg,
            steps: lot.blocks.map(function (b, i) {
                var tipo = 'Paso ' + (i + 1);
                if (b.type === 'GENESIS') tipo = 'Origen';
                if (b.type === 'DELIVERY') tipo = 'Destino';
                if (b.type === 'CHECKPOINT') {
                    tipo =
                        b.meta && b.meta.intermediaryType === 'puesto_venta'
                            ? 'Puesto de venta'
                            : 'Transporte';
                }
                return {
                    tipo: tipo,
                    empresa: b.actorOrg || b.actorName,
                    fecha: b.timestamp
                };
            })
        };
    }

    function findLot(code) {
        if (!code) return null;
        code = code.toUpperCase();
        if (ledger[code]) return ledger[code];
        var key = Object.keys(ledger).find(function (k) {
            var r = ledger[k];
            return r && r.lotId && r.lotId.toUpperCase() === code;
        });
        return key ? ledger[key] : null;
    }

    function verifyChain(lot) {
        if (!lot || !lot.blocks || !lot.blocks.length) {
            return Promise.resolve({ valid: false, errors: ['Cadena vacía'] });
        }
        var errors = [];
        var chain = Promise.resolve(genesisHash());
        lot.blocks.forEach(function (block, i) {
            chain = chain.then(function (expectedPrev) {
                if (block.prevHash !== expectedPrev) {
                    errors.push('Bloque ' + i + ': prevHash inválido');
                }
                if (!block.weightMatch && block.type !== 'GENESIS') {
                    errors.push('Bloque ' + i + ': peso alterado');
                }
                return computeBlockHash(block).then(function (expectedHash) {
                    if (block.hash !== expectedHash) {
                        errors.push('Bloque ' + i + ': hash no coincide');
                    }
                    return block.hash;
                });
            });
        });
        return chain.then(function () {
            return { valid: errors.length === 0, errors: errors };
        });
    }

    function listLots() {
        var seen = {};
        return Object.keys(ledger)
            .filter(function (k) {
                var r = ledger[k];
                if (!r || !r.lotId || seen[r.lotId]) return false;
                seen[r.lotId] = true;
                return true;
            })
            .map(function (k) {
                return ledger[k];
            });
    }

    function readPhotoFile(file) {
        return new Promise(function (resolve, reject) {
            if (!file) {
                resolve(null);
                return;
            }
            var reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function ingestIoTReading(payload) {
        return {
            received: true,
            sensorId: payload.sensorId,
            weightKg: payload.weightKg,
            timestamp: payload.timestamp || nowIso(),
            endpointHint: 'POST /api/v1/checkpoints/iot'
        };
    }

    load();

    global.PAZ_BLOCKCHAIN = {
        LOCATIONS: LOCATIONS,
        DEFAULT_LOT: DEFAULT_LOT,
        createLot: createLot,
        appendCheckpoint: appendCheckpoint,
        confirmDelivery: confirmDelivery,
        assignBuyer: assignBuyer,
        userCanViewAsBuyer: userCanViewAsBuyer,
        getSuccessionLine: getSuccessionLine,
        findLot: findLot,
        verifyChain: verifyChain,
        listLots: listLots,
        readPhotoFile: readPhotoFile,
        ingestIoTReading: ingestIoTReading,
        sha256Hex: sha256Hex,
        reload: load,
        resetDemo: function () {
            localStorage.removeItem(STORAGE_KEY);
            ledger = {};
            return seedDemoChain();
        }
    };
})(window);
