/**
 * Narrador de historias — Web Speech API
 * Secciones: elementos con clase .narrable
 */
class NarradorRobusto {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voces = [];
        this.hablando = false;
        this.pausado = false;
        this.actual = 0;
        this.secciones = [];
        this.utterance = null;
    }

    init() {
        this.prepararSecciones();
        this.cargarVoces();
        this.bindEvents();
        if (location.hash === '#narrador') {
            document.getElementById('panelNarrador')?.classList.add('visible');
        }
    }

    cargarVoces() {
        const selector = document.getElementById('selectorVoz');
        if (!selector) return;

        const llenarSelector = () => {
            this.voces = this.synth.getVoices() || [];
            if (this.voces.length === 0) {
                selector.innerHTML = '<option value="">Sin voces disponibles</option>';
                return;
            }
            const esp = this.voces.filter((v) => v.lang && v.lang.includes('es'));
            const otras = this.voces.filter((v) => !esp.includes(v));
            const todas = [...esp, ...otras].slice(0, 10);
            selector.innerHTML = '';
            todas.forEach((voz, i) => {
                const opt = document.createElement('option');
                opt.value = this.voces.indexOf(voz);
                opt.textContent =
                    voz.name.replace('Google ', '').replace('Microsoft ', '') + ' — ' + voz.lang;
                if (i === 0) opt.selected = true;
                selector.appendChild(opt);
            });
        };

        llenarSelector();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = llenarSelector;
        }
        setTimeout(llenarSelector, 500);
    }

    prepararSecciones() {
        const cards = document.querySelectorAll('.narrable');
        const lista = document.getElementById('listaSecciones');
        if (!lista) return;

        cards.forEach((card, idx) => {
            const raw =
                card.querySelector('h2, h3')?.textContent ||
                'Sección ' + (idx + 1);
            const titulo = raw
                .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                .trim();
            const texto = this.extraerTextoLimpio(card);

            this.secciones.push({ idx, titulo, texto, card });

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-seccion';
            btn.textContent = titulo;
            btn.onclick = () => this.narrarSeccion(idx);
            lista.appendChild(btn);
        });
    }

    extraerTextoLimpio(elemento) {
        const clone = elemento.cloneNode(true);
        const prohibidos = clone.querySelectorAll(
            'code, script, style, noscript, input, select, textarea, button, .narrador-btn, .panel-narrador, .comic-frame, [aria-hidden="true"], [hidden]'
        );
        prohibidos.forEach((el) => el.remove());

        let texto = '';
        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (
                    parent &&
                    (parent.style.display === 'none' || parent.style.visibility === 'hidden')
                ) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        });

        let node;
        while ((node = walker.nextNode())) {
            texto += node.textContent + ' ';
        }

        texto = texto
            .replace(/#[0-9a-fA-F]{6}\b/g, '')
            .replace(/0x[a-fA-F0-9]{4,}/gi, '')
            .replace(/\b[A-Z]{3}-[A-Z]{2}-\d{4}-\d{4}\b/g, '')
            .replace(/\s*\/\s*/g, ' de ')
            .replace(/\s*&\s*/g, ' y ')
            .replace(/@/g, ' arroba ')
            .replace(/[<>{}\[\]()*+?|^$]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s+\./g, '.')
            .replace(/\.\s*\./g, '.')
            .trim();

        return texto;
    }

    bindEvents() {
        document.getElementById('btnAbrir')?.addEventListener('click', () => {
            document.getElementById('panelNarrador')?.classList.add('visible');
        });
        document.getElementById('btnCerrar')?.addEventListener('click', () => {
            this.detener();
            document.getElementById('panelNarrador')?.classList.remove('visible');
        });
        document.getElementById('btnPlay')?.addEventListener('click', () => this.narrarTodo());
        document.getElementById('btnPause')?.addEventListener('click', () => this.togglePausa());
        document.getElementById('btnStop')?.addEventListener('click', () => this.detener());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.detener();
                document.getElementById('panelNarrador')?.classList.remove('visible');
            }
        });

        document.querySelectorAll('a[href="#narrador"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('panelNarrador')?.classList.add('visible');
                history.replaceState(null, '', '#narrador');
            });
        });
    }

    hablar(texto, onFin) {
        if (!texto || !texto.trim()) {
            if (onFin) onFin();
            return;
        }
        if (this.synth.speaking) this.synth.cancel();

        this.utterance = new SpeechSynthesisUtterance(texto);
        const idxVoz = document.getElementById('selectorVoz')?.value;
        if (idxVoz !== '' && this.voces[idxVoz]) {
            this.utterance.voice = this.voces[idxVoz];
        }
        this.utterance.rate = 0.95;
        this.utterance.pitch = 1.0;
        this.utterance.volume = 1.0;

        this.utterance.onstart = () => {
            this.hablando = true;
            this.pausado = false;
            this.actualizarUI();
        };
        this.utterance.onend = () => {
            this.hablando = false;
            this.pausado = false;
            this.utterance = null;
            this.actualizarUI();
            if (onFin) onFin();
        };
        this.utterance.onerror = () => {
            this.hablando = false;
            this.pausado = false;
            this.utterance = null;
            this.actualizarUI();
            this.setEstado('Error de voz. Prueba otra voz o navegador.');
            if (onFin) onFin();
        };

        try {
            this.synth.speak(this.utterance);
        } catch (err) {
            this.setEstado('No se pudo iniciar la narración');
            if (onFin) onFin();
        }
    }

    narrarSeccion(idx) {
        this.detener();
        this.actual = idx;
        const sec = this.secciones[idx];
        if (!sec) return;
        this.resaltar(idx);
        this.setEstado('🎙️ ' + sec.titulo);
        this.hablar(sec.texto, () => this.setEstado('Completado'));
    }

    async narrarTodo() {
        this.detener();
        this.actual = 0;
        const intro =
            'Bienvenidos. Les contaré la historia del café y cacao artesanal de la Sierra Nevada.';
        this.setEstado('Iniciando...');
        await new Promise((resolve) => this.hablar(intro, resolve));
        await this.esperar(600);
        await this.narrarSecuencial();
    }

    async narrarSecuencial() {
        if (this.actual >= this.secciones.length) {
            const outro =
                'Y así, desde las montañas hasta tu taza, viaja una historia de tradición y tecnología. Gracias por escuchar.';
            await new Promise((resolve) => this.hablar(outro, resolve));
            this.setEstado('Historia finalizada');
            return;
        }
        const sec = this.secciones[this.actual];
        this.resaltar(this.actual);
        this.setEstado(
            sec.titulo + ' (' + (this.actual + 1) + '/' + this.secciones.length + ')'
        );
        await new Promise((resolve) => this.hablar(sec.texto, resolve));
        this.actual++;
        await this.esperar(700);
        if (!this.pausado && !this.hablando) {
            await this.narrarSecuencial();
        }
    }

    togglePausa() {
        if (!this.synth) return;
        if (this.hablando && !this.pausado) {
            this.synth.pause();
            this.pausado = true;
            this.setEstado('Pausado');
        } else if (this.pausado) {
            this.synth.resume();
            this.pausado = false;
            this.setEstado('Reanudando...');
        }
        this.actualizarUI();
    }

    detener() {
        if (this.synth) this.synth.cancel();
        this.hablando = false;
        this.pausado = false;
        this.utterance = null;
        this.quitarResaltado();
        this.setEstado('Detenido');
        this.actualizarUI();
    }

    resaltar(idx) {
        this.quitarResaltado();
        const sec = this.secciones[idx];
        if (sec?.card) {
            sec.card.classList.add('highlight');
            sec.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        document.querySelectorAll('.btn-seccion').forEach((btn, i) => {
            btn.classList.toggle('activa', i === idx);
        });
    }

    quitarResaltado() {
        document.querySelectorAll('.highlight').forEach((el) => el.classList.remove('highlight'));
        document.querySelectorAll('.btn-seccion.activa').forEach((btn) =>
            btn.classList.remove('activa')
        );
    }

    setEstado(msg) {
        const el = document.getElementById('estado');
        if (el) el.textContent = msg;
    }

    actualizarUI() {
        const pause = document.getElementById('btnPause');
        const stop = document.getElementById('btnStop');
        const play = document.getElementById('btnPlay');
        if (pause) pause.disabled = !this.hablando || this.pausado;
        if (stop) stop.disabled = !this.hablando && !this.pausado;
        if (play) play.disabled = this.hablando && !this.pausado;
    }

    esperar(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnAbrir');
    if (!btn) return;

    if ('speechSynthesis' in window) {
        const narrador = new NarradorRobusto();
        narrador.init();
        window.pazNarrador = narrador;
    } else {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Narración no disponible';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Tu navegador no soporta narración de voz. Prueba Chrome, Edge o Safari.');
        });
    }
});
