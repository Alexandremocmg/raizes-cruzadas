// Ajustes de acessibilidade e conforto: tamanho do texto, velocidade da narração e som.
// Ficam salvos no navegador (valem para qualquer jogo, mesmo depois de reiniciar).
import { ui } from './ui.js';
import { som } from './som.js';
import { salvar } from './salvar.js';

const TEXTOS = [[1, 'Normal'], [1.25, 'Grande'], [1.5, 'Maior']];
const VELOCIDADES = [[1, 'Normal'], [1.6, 'Lenta'], [2.2, 'Bem lenta']];

export const ajustes = {
  valores: salvar.lerAjustes(),

  aplicar() {
    const v = ajustes.valores;
    document.documentElement.style.setProperty('--tx', String(v.texto));
    ui.velNarracao = v.narracao;
    som.definirLigado(v.som);
    const b = document.getElementById('btnSom');
    if (b) {
      b.textContent = v.som ? '🔊' : '🔇';
      b.setAttribute('aria-label', v.som ? 'Desligar o som' : 'Ligar o som');
    }
  },

  alterar(chave, valor) {
    ajustes.valores[chave] = valor;
    salvar.gravarAjustes(ajustes.valores);
    ajustes.aplicar();
  },

  alternarSom() { ajustes.alterar('som', !ajustes.valores.som); },

  /** `aoReiniciar` apaga o jogo salvo e recomeça. */
  abrir({ aoReiniciar }) {
    const v = ajustes.valores;
    const grupo = (rotulo, chave, opcoes) => `
      <div class="ajuste"><b>${rotulo}</b><div class="seg" data-chave="${chave}">
        ${opcoes.map(([valor, nome]) => `<button class="${v[chave] === valor ? 'ativo' : ''}" data-valor="${valor}">${nome}</button>`).join('')}
      </div></div>`;
    const p = ui.abrirOverlay(`
      <h2>Ajustes</h2>
      ${grupo('Tamanho do texto', 'texto', TEXTOS)}
      ${grupo('Velocidade da narração', 'narracao', VELOCIDADES)}
      ${grupo('Som', 'som', [[true, 'Ligado'], [false, 'Desligado']])}
      <p class="nota">Seu jogo é salvo sozinho, neste navegador. Nada sai do seu aparelho.</p>
      <p><a href="guia.html" target="_blank" rel="noopener">Guia do educador</a> ·
         <a href="https://github.com/Alexandremocmg/raizes-cruzadas" target="_blank" rel="noopener">Projeto aberto no GitHub</a></p>
      <div class="reiniciar"><button class="btn" data-a="reiniciar">Recomeçar do início…</button></div>`);

    p.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('button').forEach((b) => {
        b.onclick = () => {
          const bruto = b.dataset.valor;
          const valor = bruto === 'true' ? true : bruto === 'false' ? false : Number(bruto);
          ajustes.alterar(seg.dataset.chave, valor);
          seg.querySelectorAll('button').forEach((o) => o.classList.toggle('ativo', o === b));
        };
      });
    });

    const caixa = p.querySelector('.reiniciar');
    caixa.querySelector('[data-a="reiniciar"]').onclick = () => {
      caixa.innerHTML = `<p class="nota">Isso apaga o seu progresso. Tem certeza?</p>
        <button class="btn primario" data-a="sim">Sim, recomeçar</button>
        <button class="btn" data-a="nao">Cancelar</button>`;
      caixa.querySelector('[data-a="sim"]').onclick = () => aoReiniciar();
      caixa.querySelector('[data-a="nao"]').onclick = () => ui.fecharOverlay();
    };
  },
};
