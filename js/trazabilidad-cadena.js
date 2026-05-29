/**
 * Línea de sucesión pública (solo nombres de empresa) — sin acceso a blockchain.html
 */
(function () {
    'use strict';

    function $(id) {
        return document.getElementById(id);
    }

    function render(line) {
        var out = $('trzCadenaResult');
        if (!out) return;

        if (!line || !line.steps || !line.steps.length) {
            out.innerHTML =
                '<p class="trz-cadena-empty">No se encontró cadena para ese código. Verifique el código principal del empaque.</p>';
            return;
        }

        var html =
            '<div class="trz-cadena-meta"><strong>' +
            line.productType +
            '</strong> · Código <code>' +
            line.packageCode +
            '</code> · ' +
            line.weightKg +
            ' kg</div><ol class="trz-cadena-steps">';

        line.steps.forEach(function (s) {
            html +=
                '<li><span class="trz-cadena-tipo">' +
                s.tipo +
                '</span><span class="trz-cadena-empresa">' +
                s.empresa +
                '</span></li>';
        });
        html += '</ol>';
        out.innerHTML = html;
    }

    document.addEventListener('DOMContentLoaded', function () {
        var form = $('trzCadenaForm');
        if (!form || !window.PAZ_BLOCKCHAIN) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var code = $('trzCodigoPrincipal')?.value;
            render(window.PAZ_BLOCKCHAIN.getSuccessionLine(code));
        });

        var params = new URLSearchParams(location.search);
        var q = params.get('codigo') || params.get('code');
        if (q) {
            $('trzCodigoPrincipal').value = q;
            render(window.PAZ_BLOCKCHAIN.getSuccessionLine(q));
        }
    });
})();
