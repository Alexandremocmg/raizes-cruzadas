// Interface em HTML por cima do canvas: narração, botões de ação, rótulos, overlay e Diário.
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _v = new THREE.Vector3();

const fila = [];
let atual = null, restante = 0, pausa = 0;
let acoes = [], chaveAcoes = '';
let overlayAberto = false, overlayFechavel = true;
let paginas = [];
const desbloqueadas = new Set();
let timerToast = 0;

function projetar(pos, camera) {
  _v.copy(pos).project(camera);
  const vis = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1;
  return { vis, x: (_v.x * 0.5 + 0.5) * innerWidth, y: (-_v.y * 0.5 + 0.5) * innerHeight };
}

export const ui = {
  camera: null,

  /** Enfileira uma fala de narração (ou de um personagem, com `quem`). */
  dizer(texto, { quem = '', dur } = {}) {
    fila.push({ texto, quem, dur: dur ?? Math.max(3, texto.length * 0.06) });
  },

  update(dt) {
    const el = $('fala');
    if (atual) {
      restante -= dt;
      if (restante <= 0) { atual = null; el.classList.add('hidden'); pausa = 0.35; }
    } else if (pausa > 0) {
      pausa -= dt;
    } else if (fila.length) {
      atual = fila.shift();
      restante = atual.dur;
      el.innerHTML = (atual.quem ? `<b>${esc(atual.quem)}</b>` : '') + `<span>${esc(atual.texto)}</span>`;
      el.classList.remove('hidden');
    }
  },

  setAcoes(lista) {
    acoes = lista;
    const chave = lista.map((a) => a.rotulo).join('|');
    if (chave === chaveAcoes) return;
    chaveAcoes = chave;
    const box = $('acoes');
    box.innerHTML = '';
    lista.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'acao';
      b.innerHTML = `<kbd>${i === 0 ? 'E' : i + 1}</kbd>${esc(a.rotulo)}`;
      b.onclick = () => acoes[i]?.fn();
      box.appendChild(b);
    });
  },

  acionar(i) { acoes[i]?.fn(); },

  setAgua(n) {
    $('aguaN').textContent = n;
    const el = $('agua');
    el.classList.remove('pulsa'); void el.offsetWidth; el.classList.add('pulsa');
  },

  mostrarHud() { $('hud').classList.remove('hidden'); },

  get overlayAberto() { return overlayAberto; },

  abrirOverlay(html, { fechavel = true } = {}) {
    const ov = $('overlay');
    const p = ov.querySelector('.painel');
    p.innerHTML = html;
    if (fechavel) {
      const x = document.createElement('button');
      x.className = 'fechar'; x.textContent = '×'; x.setAttribute('aria-label', 'Fechar');
      x.onclick = () => ui.fecharOverlay();
      p.prepend(x);
    }
    ov.classList.remove('hidden');
    p.scrollTop = 0;
    overlayAberto = true;
    overlayFechavel = fechavel;
    return p;
  },

  fecharOverlay(forcar = false) {
    if (!overlayAberto || (!overlayFechavel && !forcar)) return;
    $('overlay').classList.add('hidden');
    overlayAberto = false;
  },

  criarRotulo(texto) {
    const d = document.createElement('div');
    d.className = 'rotulo';
    d.textContent = texto;
    $('rotulos').appendChild(d);
    return d;
  },

  posicionarRotulo(el, pos) {
    const p = projetar(pos, ui.camera);
    const longe = ui.camera.position.distanceTo(pos) > 70;
    el.style.display = p.vis && !longe ? '' : 'none';
    if (p.vis) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
  },

  /** Texto que sobe e some sobre um ponto do mundo. */
  flutuar(texto, pos) {
    const p = projetar(pos, ui.camera);
    if (!p.vis) return;
    const d = document.createElement('div');
    d.className = 'flutua';
    d.textContent = texto;
    d.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    $('rotulos').appendChild(d);
    setTimeout(() => d.remove(), 2500);
  },

  toast(texto) {
    const t = $('toast');
    t.textContent = texto;
    t.classList.remove('hidden');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => t.classList.add('hidden'), 3200);
  },

  // ---------- Diário da Fonte (camada explícita, opcional) ----------
  iniciarDiario(p) {
    paginas = p;
    $('btnDiario').onclick = () => ui.abrirDiario();
  },

  desbloquear(id) {
    if (desbloqueadas.has(id)) return;
    desbloqueadas.add(id);
    ui.toast('📖 Nova página no Diário da Fonte');
    $('btnDiario').classList.add('novo');
  },

  abrirDiario() {
    if (overlayAberto && !overlayFechavel) return; // não interrompe a Caverna
    $('btnDiario').classList.remove('novo');
    const lista = paginas.filter((p) => desbloqueadas.has(p.id));
    const corpo = lista.length
      ? lista.map((p) => `
        <article class="pagina">
          <h3>${esc(p.titulo)}</h3>
          <blockquote>${esc(p.verso)}<cite>${esc(p.ref)}</cite></blockquote>
          <p>${esc(p.texto)}</p>
          ${p.pergunta ? `<p class="pergunta">${esc(p.pergunta)}</p>` : ''}
        </article>`).join('')
      : '<p>Nenhuma página ainda. Continue jogando.</p>';
    ui.abrirOverlay(`<h2>Diário da Fonte</h2><p class="nota">Páginas opcionais: o que inspirou cada parte do jogo.</p>${corpo}`);
  },
};
