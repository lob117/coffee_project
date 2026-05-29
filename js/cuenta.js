/**
 * Cuentas: usuario (comprador) y productor (campesino)
 */
var PazCuenta = (function () {
    'use strict';

    var KEY_USUARIOS = 'paz_usuarios_compradores';
    var KEY_PRODUCTORES = 'paz_usuarios_productores';
    var KEY_SESSION = 'paz_sesion_activa';
    var KEY_CAMPESINOS = 'cafeteria_campesinos';
    var KEY_COMPRAS_LOTES = 'paz_compras_lotes';

    var TIPO_EMPRESA = {
        FINCA: 'finca_produccion',
        TRANSPORTE: 'transportadora',
        PUESTO: 'puesto_venta'
    };

    var TIPO_EMPRESA_LABELS = {
        finca_produccion: 'Finca de producción de café',
        transportadora: 'Transportadora de café',
        puesto_venta: 'Puesto de venta de café'
    };

    function getUsuarios() {
        return JSON.parse(localStorage.getItem(KEY_USUARIOS) || '[]');
    }
    function getProductores() {
        return JSON.parse(localStorage.getItem(KEY_PRODUCTORES) || '[]');
    }
    function saveUsuarios(arr) {
        localStorage.setItem(KEY_USUARIOS, JSON.stringify(arr));
    }
    function saveProductores(arr) {
        localStorage.setItem(KEY_PRODUCTORES, JSON.stringify(arr));
    }

    function validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function validarCelular(cel) {
        return /^\d{10}$/.test(cel);
    }
    function validarPassword(p) {
        return p.length >= 6;
    }

    function registrarUsuario(datos) {
        var lista = getUsuarios();
        if (lista.some(function (u) { return u.email.toLowerCase() === datos.email.toLowerCase(); })) {
            return { ok: false, msg: 'Este correo ya está registrado.' };
        }
        datos.fecha = new Date().toISOString();
        datos.tipo = 'usuario';
        lista.push(datos);
        saveUsuarios(lista);
        return { ok: true };
    }

    function registrarProductor(datos) {
        var lista = getProductores();
        if (lista.some(function (p) { return p.email.toLowerCase() === datos.email.toLowerCase(); })) {
            return { ok: false, msg: 'Este correo ya está registrado como productor.' };
        }
        if (!datos.tipoEmpresa || !TIPO_EMPRESA_LABELS[datos.tipoEmpresa]) {
            return { ok: false, msg: 'Seleccione un tipo de empresa válido.' };
        }
        if (!datos.nombreEmpresa || !datos.nombreEmpresa.trim()) {
            return { ok: false, msg: 'Indique el nombre de la empresa.' };
        }
        datos.fecha = new Date().toISOString();
        datos.tipo = 'productor';
        lista.push(datos);
        saveProductores(lista);
        return { ok: true };
    }

    function getTipoEmpresaLabel(tipo) {
        return TIPO_EMPRESA_LABELS[tipo] || tipo || '—';
    }

    function puedeVerBlockchainProductor(productor) {
        return productor && productor.tipoEmpresa === TIPO_EMPRESA.FINCA;
    }

    function puedeVerBlockchainIntermediario(productor) {
        return (
            productor &&
            (productor.tipoEmpresa === TIPO_EMPRESA.TRANSPORTE ||
                productor.tipoEmpresa === TIPO_EMPRESA.PUESTO)
        );
    }

    function getComprasLotes() {
        return JSON.parse(localStorage.getItem(KEY_COMPRAS_LOTES) || '[]');
    }

    function saveComprasLotes(arr) {
        localStorage.setItem(KEY_COMPRAS_LOTES, JSON.stringify(arr));
    }

    function registrarCompraLote(email, packageCode) {
        email = (email || '').trim().toLowerCase();
        packageCode = (packageCode || '').trim().toUpperCase();
        if (!email || !packageCode) {
            return { ok: false, msg: 'Correo y código de producto requeridos.' };
        }
        var lista = getComprasLotes();
        if (lista.some(function (c) { return c.email === email && c.packageCode === packageCode; })) {
            return { ok: true, msg: 'Ya tenías vinculado este producto.' };
        }
        lista.push({ email: email, packageCode: packageCode, fecha: new Date().toISOString() });
        saveComprasLotes(lista);
        return { ok: true, msg: 'Compra vinculada. Ya puede ver el panel de comprador en blockchain.' };
    }

    function usuarioComproLote(email, packageCode) {
        email = (email || '').trim().toLowerCase();
        packageCode = (packageCode || '').trim().toUpperCase();
        return getComprasLotes().some(function (c) {
            return c.email === email && c.packageCode === packageCode;
        });
    }

    function iniciarSesion(email, password) {
        email = email.trim().toLowerCase();
        var u = getUsuarios().find(function (x) {
            return x.email.toLowerCase() === email && x.password === password;
        });
        if (u) {
            sessionStorage.setItem(KEY_SESSION, JSON.stringify({ tipo: 'usuario', email: u.email }));
            return { ok: true, tipo: 'usuario', redirect: 'panel-usuario.html' };
        }
        var p = getProductores().find(function (x) {
            return x.email.toLowerCase() === email && x.password === password;
        });
        if (p) {
            sessionStorage.setItem(KEY_SESSION, JSON.stringify({ tipo: 'productor', email: p.email }));
            return { ok: true, tipo: 'productor', redirect: 'panel-productor.html' };
        }
        return { ok: false, msg: 'Correo o contraseña incorrectos.' };
    }

    function getSesion() {
        try {
            return JSON.parse(sessionStorage.getItem(KEY_SESSION) || 'null');
        } catch (e) {
            return null;
        }
    }

    function cerrarSesion() {
        sessionStorage.removeItem(KEY_SESSION);
        window.location.href = 'Registrarse.html';
    }

    function requireSesion(tipoEsperado) {
        var s = getSesion();
        if (!s || s.tipo !== tipoEsperado) {
            window.location.href = 'iniciar-sesion.html';
            return null;
        }
        var lista = tipoEsperado === 'usuario' ? getUsuarios() : getProductores();
        var user = lista.find(function (x) { return x.email === s.email; });
        if (!user) {
            cerrarSesion();
            return null;
        }
        if (tipoEsperado === 'productor' && !user.tipoEmpresa && user.nombreEmpresa) {
            user.tipoEmpresa = TIPO_EMPRESA.FINCA;
        }
        return user;
    }

    function getBlockchainRolesPermitidos() {
        var s = getSesion();
        if (!s) return [];
        if (s.tipo === 'productor') {
            var p = getProductores().find(function (x) { return x.email === s.email; });
            if (!p) return [];
            if (puedeVerBlockchainProductor(p)) return ['producer'];
            if (puedeVerBlockchainIntermediario(p)) return ['intermediary'];
            return [];
        }
        if (s.tipo === 'usuario') return ['buyer'];
        return [];
    }

    function getCampesinos() {
        return JSON.parse(localStorage.getItem(KEY_CAMPESINOS) || '[]');
    }
    function saveCampesinos(arr) {
        localStorage.setItem(KEY_CAMPESINOS, JSON.stringify(arr));
    }

    function bindForm(id, handler) {
        var form = document.getElementById(id);
        if (form) form.addEventListener('submit', handler);
    }

    function showAlert(id, msg, tipo) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.className = 'ltc-alert ltc-alert-' + (tipo || 'error');
        el.classList.remove('hidden');
    }

    function hideAlert(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    return {
        KEY_USUARIOS: KEY_USUARIOS,
        KEY_PRODUCTORES: KEY_PRODUCTORES,
        KEY_CAMPESINOS: KEY_CAMPESINOS,
        getUsuarios: getUsuarios,
        getProductores: getProductores,
        getCampesinos: getCampesinos,
        saveCampesinos: saveCampesinos,
        validarEmail: validarEmail,
        validarCelular: validarCelular,
        validarPassword: validarPassword,
        registrarUsuario: registrarUsuario,
        registrarProductor: registrarProductor,
        iniciarSesion: iniciarSesion,
        getSesion: getSesion,
        cerrarSesion: cerrarSesion,
        requireSesion: requireSesion,
        bindForm: bindForm,
        showAlert: showAlert,
        hideAlert: hideAlert,
        TIPO_EMPRESA: TIPO_EMPRESA,
        TIPO_EMPRESA_LABELS: TIPO_EMPRESA_LABELS,
        getTipoEmpresaLabel: getTipoEmpresaLabel,
        puedeVerBlockchainProductor: puedeVerBlockchainProductor,
        puedeVerBlockchainIntermediario: puedeVerBlockchainIntermediario,
        getBlockchainRolesPermitidos: getBlockchainRolesPermitidos,
        registrarCompraLote: registrarCompraLote,
        usuarioComproLote: usuarioComproLote,
        getComprasLotes: getComprasLotes
    };
})();
