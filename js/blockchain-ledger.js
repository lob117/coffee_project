/**
 * PAZ Magdalena — Ledger de trazabilidad inmutable (simulación blockchain)
 * Diseñado para futura integración: REST Python, n8n, sensores IoT (peso).
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'paz_blockchain_ledger_v1';

    var ACTORS = {
        producer: {
            id: 'eder-ochoa',
            name: 'Eder Ochoa',
            role: 'Productor',
            org: 'Finca Porvenir',
            location: { label: 'Sierra Nevada de Santa Marta', lat: 11.1418, lng: -74.0712 }
        },
        transport: {
            id: 'sierramar',
            name: 'Transportes SierraMar',
            role: 'Intermediario logístico',
            location: { label: 'Vía Minca — Troncal Magdalena', lat: 11.1082, lng: -74.152 }
        },
        hotel: {
            id: 'bahia-dorada',
            name: 'Hotel Bahía Dorada',
            role: 'Intermediario hotelero',
            location: { label: 'Santa Marta, Magdalena', lat: 11.2412, lng: -74.2145 }
        },
        buyer: {
            id: 'vianis-florez',
            name: 'Vianis Judith Flórez Ramos',
            role: 'Compradora internacional',
            country: 'Estados Unidos',
            location: { label: 'Miami, FL — Hub de importación', lat: 25.7617, lng: -80.1918 }
        }
    };

    var DEFAULT_LOT = {
        lotId: 'TRZ-SN-2026-0842',
        productType: 'Cacao y Café Artesanal',
        lotNumber: 'LOTE-PV-2026-001',
        weightKg: 25.4,
        producer: ACTORS.producer,
        buyer: ACTORS.buyer,
        certifications: ['Fairtrade International', 'Rainforest Alliance', 'Protocolo TIC Paz Magdalena v1.2'],
        status: 'delivered'
    };

    /** @type {Object<string, ChainRecord>} */
    var ledger = {};

    /**
     * @typedef {Object} ChainRecord
     * @property {string} lotId
     * @property {string} productType
     * @property {string} lotNumber
     * @property {number} weightKg — peso sellado en origen
     * @property {Object} producer
     * @property {Object} buyer
     * @property {string[]} certifications
     * @property {string} status
     * @property {string} packageCode — hash público / QR
     * @property {Block[]} blocks
     */

    /**
     * @typedef {Object} Block
     * @property {number} index
     * @property {string} type — GENESIS | CHECKPOINT | DELIVERY
     * @property {string} role — producer | intermediary | buyer
     * @property {string} actorName
     * @property {string} actorOrg
     * @property {string} timestamp ISO
     * @property {Object} location
     * @property {number} weightKg
     * @property {boolean} weightMatch
     * @property {string|null} photoDataUrl
     * @property {string} prevHash
     * @property {string} hash
     * @property {Object} meta — IoT, notas, tipo intermediario
     */

    function nowIso() {
        return new Date().toISOString();
    }

    /** Simula SHA-256 (async vía SubtleCrypto o fallback determinista) */
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
        var lot = Object.assign({}, DEFAULT_LOT);
        var blocks = [];
        var prev = genesisHash();

        var steps = [
            {
                type: 'GENESIS',
                role: 'producer',
                actor: ACTORS.producer,
                weightKg: lot.weightKg,
                location: ACTORS.producer.location,
                meta: { note: 'Registro de lote y foto de caja con QR impreso', iot: false }
            },
            {
                type: 'CHECKPOINT',
                role: 'intermediary',
                actor: ACTORS.transport,
                weightKg: 25.4,
                location: ACTORS.transport.location,
                meta: { intermediaryType: 'transport', note: 'Recibido en ruta logística' }
            },
            {
                type: 'CHECKPOINT',
                role: 'intermediary',
                actor: ACTORS.hotel,
                weightKg: 25.4,
                location: ACTORS.hotel.location,
                meta: { intermediaryType: 'hotel', note: 'Custodia pre-exportación — lobby' }
            },
            {
                type: 'DELIVERY',
                role: 'buyer',
                actor: ACTORS.buyer,
                weightKg: 25.4,
                location: ACTORS.buyer.location,
                meta: { note: 'Recepción internacional — transacción TIC verificada' }
            }
        ];

        var chain = Promise.resolve(prev);
        steps.forEach(function (step, idx) {
            chain = chain.then(function (previousHash) {
                var block = {
                    index: idx,
                    type: step.type,
                    role: step.role,
                    actorName: step.actor.name,
                    actorOrg: step.actor.org || step.actor.role,
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
            ledger[lot.lotId] = lot;
            ledger[lot.packageCode] = lot;
            persist();
        });
    }

    /**
     * API pública — crear lote (productor)
     * @param {Object} input
     * @returns {Promise<{ok:boolean, lot?:ChainRecord, error?:string}>}
     */
    function createLot(input) {
        var productType = (input.productType || '').trim();
        var lotNumber = (input.lotNumber || '').trim();
        var weightKg = parseFloat(input.weightKg);
        var photoDataUrl = input.photoDataUrl || null;

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
            actorName: ACTORS.producer.name,
            actorOrg: ACTORS.producer.org,
            timestamp: nowIso(),
            location: ACTORS.producer.location,
            weightKg: weightKg,
            weightMatch: true,
            photoDataUrl: photoDataUrl,
            prevHash: genesisHash(),
            hash: '',
            meta: { note: 'Captura inicial finca', iotSensorId: input.iotSensorId || null }
        };

        return computeBlockHash(block).then(function (hash) {
            block.hash = hash;
            var record = {
                lotId: lotId,
                productType: productType,
                lotNumber: lotNumber,
                weightKg: weightKg,
                producer: ACTORS.producer,
                buyer: ACTORS.buyer,
                certifications: DEFAULT_LOT.certifications,
                status: 'registered',
                packageCode: hash.slice(0, 16).toUpperCase(),
                blocks: [block]
            };
            ledger[lotId] = record;
            ledger[record.packageCode] = record;
            persist();
            return { ok: true, lot: record };
        });
    }

    /**
     * Punto de control intermediario
     * @param {Object} input — packageCode, weightKg, photoDataUrl, intermediaryType
     */
    function appendCheckpoint(input) {
        var code = (input.packageCode || '').trim().toUpperCase();
        var weightKg = parseFloat(input.weightKg);
        var photoDataUrl = input.photoDataUrl || null;
        var type = input.intermediaryType === 'hotel' ? 'hotel' : 'transport';
        var actor = type === 'hotel' ? ACTORS.hotel : ACTORS.transport;

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
            actorName: actor.name,
            actorOrg: actor.org || actor.role,
            timestamp: nowIso(),
            location: actor.location,
            weightKg: weightKg,
            weightMatch: weightMatch,
            photoDataUrl: photoDataUrl,
            prevHash: prevBlock.hash,
            hash: '',
            meta: {
                intermediaryType: type,
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
            lot.status = type === 'hotel' ? 'at_hotel' : 'in_transit';
            persist();
            return { ok: true, lot: lot, block: block };
        });
    }

    /**
     * Cierre compradora (entrega internacional)
     */
    function confirmDelivery(input) {
        var code = (input.packageCode || '').trim().toUpperCase();
        var lot = findLot(code);
        if (!lot) {
            return Promise.resolve({ ok: false, error: 'Código no encontrado.' });
        }
        if (lot.blocks.length < 2) {
            return Promise.resolve({ ok: false, error: 'La cadena aún no tiene puntos de control intermedios.' });
        }

        var prevBlock = lot.blocks[lot.blocks.length - 1];
        var weightKg = parseFloat(input.weightKg) || lot.weightKg;
        var block = {
            index: lot.blocks.length,
            type: 'DELIVERY',
            role: 'buyer',
            actorName: ACTORS.buyer.name,
            actorOrg: ACTORS.buyer.country,
            timestamp: nowIso(),
            location: ACTORS.buyer.location,
            weightKg: weightKg,
            weightMatch: Math.abs(weightKg - lot.weightKg) < 0.15,
            photoDataUrl: input.photoDataUrl || null,
            prevHash: prevBlock.hash,
            hash: '',
            meta: { smartContract: 'PAZ-TIC-EXPORT-2026', note: 'Transacción internacional cerrada' }
        };

        return computeBlockHash(block).then(function (hash) {
            block.hash = hash;
            lot.blocks.push(block);
            lot.status = 'delivered';
            persist();
            return { ok: true, lot: lot };
        });
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

    /** Hook futuro IoT / n8n */
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
        ACTORS: ACTORS,
        DEFAULT_LOT: DEFAULT_LOT,
        createLot: createLot,
        appendCheckpoint: appendCheckpoint,
        confirmDelivery: confirmDelivery,
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
