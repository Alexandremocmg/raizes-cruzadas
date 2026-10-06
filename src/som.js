// Som do jogo, todo sintetizado com a Web Audio API: nada de arquivos de áudio (sem direitos
// autorais, sem peso extra). Suave de propósito: pano de fundo e pequenos sinos, nunca música alta.
// O áudio só começa depois de um gesto do jogador (regra dos navegadores) e pode ser silenciado.
let ctx = null, mestre = null, analisador = null;
let ligado = true;
const amb = { filtro: null, brilho: null, agua: null };

// Escala pentatônica (Dó): qualquer combinação soa bem junta, sem notas "erradas".
const PENTA = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5 };

function nota(freq, { t = 0, dur = 0.8, tipo = 'sine', vol = 0.1, ataque = 0.012, para = null } = {}) {
  if (!ctx || !ligado) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  const t0 = ctx.currentTime + t;
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (para) o.frequency.exponentialRampToValueAtTime(para, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(mestre);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

let bufferRuido = null;
function ruido({ t = 0, dur = 0.5, freq = 800, q = 1, vol = 0.08, tipo = 'bandpass', ate = null } = {}) {
  if (!ctx || !ligado) return;
  if (!bufferRuido) {
    bufferRuido = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = bufferRuido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const fonte = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  const t0 = ctx.currentTime + t;
  fonte.buffer = bufferRuido;
  f.type = tipo;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (ate) f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  fonte.connect(f).connect(g).connect(mestre);
  fonte.start(t0);
  fonte.stop(t0 + dur + 0.05);
}

const EFEITOS = {
  gota() { nota(1100, { dur: 0.2, para: 520, vol: 0.11 }); },
  tirar() { [0, 0.22, 0.4].forEach((t, i) => nota(900 - i * 120, { t, dur: 0.18, para: 450, vol: 0.09 })); },
  enviar() { ruido({ dur: 0.6, freq: 500, ate: 2200, q: 1.5, vol: 0.07 }); nota(PENTA.G5, { t: 0.05, dur: 0.5, vol: 0.05 }); },
  chegar() { nota(PENTA.E5, { dur: 1.4, vol: 0.09 }); nota(PENTA.A5, { t: 0.09, dur: 1.6, vol: 0.07 }); },
  ponte() { [PENTA.G4, PENTA.C5, PENTA.E5, PENTA.G5].forEach((f, i) => nota(f, { t: i * 0.16, dur: 1.2, vol: 0.07 })); },
  pagina() { nota(PENTA.G5, { dur: 1.2, vol: 0.07 }); nota(PENTA.C6, { t: 0.18, dur: 1.5, vol: 0.06 }); },
  certa() { nota(PENTA.A5, { dur: 1.0, vol: 0.08 }); nota(PENTA.E5, { t: 0.1, dur: 1.0, vol: 0.06 }); },
  errada() { nota(150, { dur: 0.35, para: 90, vol: 0.12, tipo: 'triangle' }); },
  promessa() { [PENTA.C5, PENTA.E5, PENTA.G5, PENTA.C6].forEach((f, i) => nota(f, { t: i * 0.07, dur: 1.4, vol: 0.06, tipo: 'triangle' })); },
  exigencia() { nota(196, { dur: 1.8, vol: 0.09, tipo: 'sawtooth' }); nota(207.65, { t: 0.05, dur: 1.8, vol: 0.07, tipo: 'sawtooth' }); },
  rachadura() {
    ruido({ dur: 1.4, freq: 220, tipo: 'lowpass', vol: 0.16 });
    [0.05, 0.38, 0.7].forEach((t) => ruido({ t, dur: 0.12, freq: 2400, q: 4, vol: 0.12 }));
  },
  revelacao() { [110, 165, 220, 330, 440].forEach((f, i) => nota(f, { t: i * 0.5, dur: 6, vol: 0.05, ataque: 2.4 })); },
  fonte() { [PENTA.C5, PENTA.E5, PENTA.G5, PENTA.A5].forEach((f, i) => nota(f, { t: i * 0.25, dur: 3.2, vol: 0.06, ataque: 0.5 })); },
  final() { [PENTA.C4, PENTA.G4, PENTA.C5, PENTA.E5, PENTA.G5, PENTA.C6].forEach((f, i) => nota(f, { t: i * 0.5, dur: 5, vol: 0.06, ataque: 0.6 })); },
};

export const som = {
  get ligado() { return ligado; },
  get pronto() { return !!ctx; },

  /** Cria o áudio. Chamar de dentro de um clique/toque do jogador. */
  iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    mestre = ctx.createGain();
    mestre.gain.value = ligado ? 0.9 : 0;
    analisador = ctx.createAnalyser();
    analisador.fftSize = 1024;
    mestre.connect(analisador);
    analisador.connect(ctx.destination);
    montarAmbiente();
  },

  definirLigado(v) {
    ligado = !!v;
    if (!ctx) return;
    mestre.gain.setTargetAtTime(ligado ? 0.9 : 0, ctx.currentTime, 0.15);
    if (ligado && ctx.state === 'suspended') ctx.resume();
  },

  efeito(nome) { try { EFEITOS[nome]?.(); } catch (e) { console.warn('[som]', nome, e); } },

  /**
   * Ajusta o fundo ao momento: `escuro` (0 dia · 1 tudo se desfazendo) e `fonte` (0 a 1: presença
   * da Fonte). Chamado de vez em quando; as mudanças são suaves.
   */
  clima({ escuro = 0, fonte = 0, tensao = 0 } = {}) {
    if (!ctx) return;
    const agora = ctx.currentTime;
    amb.filtro.frequency.setTargetAtTime(900 - 560 * escuro - 200 * tensao, agora, 1.2);
    amb.brilho.gain.setTargetAtTime(0.012 * fonte, agora, 1.5);
    amb.agua.gain.setTargetAtTime(0.012 + 0.012 * fonte - 0.008 * tensao, agora, 1.5);
  },

  /** Volume atual do que está saindo (0 a 1), para testes automáticos. */
  nivel() {
    if (!analisador) return 0;
    const d = new Float32Array(analisador.fftSize);
    analisador.getFloatTimeDomainData(d);
    let s = 0;
    for (const x of d) s += x * x;
    return Math.sqrt(s / d.length);
  },
  get estado() { return ctx ? ctx.state : 'sem-contexto'; },
};

function montarAmbiente() {
  // Base: duas notas graves e longas, com um leve balanço
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 900;
  const base = ctx.createGain();
  base.gain.value = 0.03;
  filtro.connect(base).connect(mestre);
  amb.filtro = filtro;
  for (const [f, tipo, det] of [[110, 'triangle', 0], [164.81, 'sine', 4], [220, 'sine', -3]]) {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(filtro);
    o.start();
  }
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 0.012;
  lfo.connect(lfoG).connect(base.gain);
  lfo.start();

  // Brilho da Fonte: notas agudas bem baixinhas que só aparecem quando ela está presente
  const brilho = ctx.createGain();
  brilho.gain.value = 0;
  brilho.connect(mestre);
  for (const f of [784, 1174.7, 1568]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const trem = ctx.createGain();
    trem.gain.value = 0.5;
    const lf = ctx.createOscillator(), lg = ctx.createGain();
    lf.frequency.value = 0.15 + Math.random() * 0.2;
    lg.gain.value = 0.5;
    lf.connect(lg).connect(trem.gain);
    lf.start();
    o.connect(trem).connect(brilho);
    o.start();
  }
  amb.brilho = brilho;

  // Água corrente ao longe: ruído filtrado, quase imperceptível
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const fonte = ctx.createBufferSource();
  fonte.buffer = buf;
  fonte.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 500;
  bp.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.012;
  fonte.connect(bp).connect(g).connect(mestre);
  fonte.start();
  amb.agua = g;
}

// Navegador em segundo plano: silencia, para não tocar numa aba que ninguém está vendo
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend();
  else if (ligado) ctx.resume();
});
