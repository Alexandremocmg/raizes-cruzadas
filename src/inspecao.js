// Página de inspeção: mostra um modelo na mesma luz, mar e ilha do jogo, para aprovar o estilo
// e cada clipe de animação ANTES de integrar.
// Uso: inspecao.html?modelo=lume  (padrão: lume animada)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { criarMundo } from './mundo.js';
import { Ilha } from './ilha.js';
import { criarFigura, animarFigura } from './figura.js';

const MODELOS = {
  lume: { arquivo: 'assets/modelos/lume.glb', altura: 1.0, nome: 'Lume (Tripo P1 + Mixamo)' },
  jogador: { arquivo: 'assets/modelos/jogador.glb', altura: 1.45, nome: 'Jogador (Tripo P1 + Mixamo)' },
  'lume-estatica': { arquivo: 'assets/tripo/lume/tripo-out/lume-91fe7e2e/model.glb', altura: 1.0, nome: 'Lume estática (Tripo P1)' },
  salvia: { arquivo: 'assets/modelos/salvia.glb', altura: 1.25, nome: 'Dona Sálvia (Tripo P1 + Mixamo)' },
  ferro: { arquivo: 'assets/modelos/ferro.glb', altura: 1.6, nome: 'Ferro (Tripo P1 + Mixamo)' },
  'ferro-original': { arquivo: 'assets/tripo/ferro/tripo-out/ferro-867cb05e/model.glb', altura: 1.6, nome: 'Ferro original (mangas azuis)' },
  'ferro-estatico': { arquivo: 'assets/tripo/ferro/tripo-out/ferro-867cb05e/model_mangas_corrigidas.glb', altura: 1.6, nome: 'Ferro (mangas corrigidas)' },
  'salvia-estatica': { arquivo: 'assets/tripo/salvia/tripo-out/salvia-5a19c59d/model.glb', altura: 1.3, nome: 'Dona Sálvia estática (Tripo P1)' },
  'jogador-estatico': { arquivo: 'assets/tripo/jogador/tripo-out/jogador-af4ef3e2/model.glb', altura: 1.45, nome: 'Jogador estático (Tripo P1)' },
};
const chave = new URLSearchParams(location.search).get('modelo') || 'lume';
const cfg = MODELOS[chave];
document.getElementById('titulo').textContent = `Inspeção · ${cfg.nome}`;

const mundo = criarMundo(document.getElementById('c'));
const { scene, camera, renderer } = mundo;
mundo.aplicarEscuro(0);

const ilha = new Ilha({ x: 0, z: 0, raio: 6, seed: 7, saude: 1, livre: [{ x: 0, z: 0, r: 2.4 }] });
scene.add(ilha.group);

const jogador = criarFigura({ corpo: '#fbf2e2', lenco: '#2fc4b2' });
jogador.raiz.position.set(-1.3, 0.15, -0.4);
jogador.raiz.rotation.y = 0.5;
scene.add(jogador.raiz);

const controles = new OrbitControls(camera, renderer.domElement);
controles.target.set(0, 0.6, 0);
controles.enableDamping = true;
camera.position.set(1.6, 1.4, 3.4);

let modelo = null, mixer = null, acaoAtual = null;
const ossos = [], pes = [], materiais = [];
let quadril = null;
let facetas = true, girar = false, velocidade = 1;
const $ = (id) => document.getElementById(id);

new GLTFLoader().load(cfg.arquivo, (gltf) => {
  modelo = gltf.scene;
  modelo.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false; // SkinnedMesh: a esfera da bind pose não acompanha os ossos
      materiais.push(o.material);
    }
    if (o.isBone) {
      ossos.push(o);
      if (/Foot|Toe/i.test(o.name)) pes.push(o);
      if (/Hips/i.test(o.name) && !quadril) quadril = o;
    }
  });
  aplicarFacetas();

  scene.add(modelo);
  // Escala pela altura medida nos OSSOS (Box3 numa SkinnedMesh do Mixamo erra o tamanho)
  modelo.updateMatrixWorld(true);
  let alturaAtual;
  if (pes.length) {
    let topo = -Infinity;
    for (const b of ossos) { b.getWorldPosition(_p); topo = Math.max(topo, _p.y); }
    alturaAtual = topo - peMaisBaixo();
  } else {
    const caixa = new THREE.Box3().setFromObject(modelo);
    alturaAtual = caixa.max.y - caixa.min.y;
  }
  modelo.scale.multiplyScalar(cfg.altura / alturaAtual);

  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(modelo);
    const box = $('clipes');
    for (const clip of gltf.animations) {
      const b = document.createElement('button');
      b.textContent = `${clip.name} · ${clip.duration.toFixed(2)} s`;
      b.onclick = () => tocar(clip, b);
      box.appendChild(b);
    }
    const inicial = gltf.animations.find((c) => c.name === 'idle') || gltf.animations[0];
    tocar(inicial, [...box.querySelectorAll('button')][gltf.animations.indexOf(inicial)]);
  }
  apoiarNoChao();
}, undefined, (erro) => {
  $('info').textContent = 'Erro ao carregar: ' + erro.message;
  console.error(erro);
});

function tocar(clip, botao) {
  const nova = mixer.clipAction(clip);
  nova.reset().setEffectiveTimeScale(velocidade).play();
  if (acaoAtual && acaoAtual !== nova) acaoAtual.crossFadeTo(nova, 0.25, false);
  acaoAtual = nova;
  document.querySelectorAll('#clipes button').forEach((b) => b.classList.toggle('ativo', b === botao));
  medidas.reset();
}

// Apoia os pés no chão da ilha medindo os OSSOS (Box3 ignora a pose animada)
const _p = new THREE.Vector3();
function peMaisBaixo() {
  let min = Infinity;
  for (const b of pes) { b.getWorldPosition(_p); min = Math.min(min, _p.y); }
  return min;
}
function apoiarNoChao() {
  if (!modelo) return;
  if (mixer) mixer.update(0);
  modelo.updateMatrixWorld(true);
  if (pes.length) modelo.position.y += 0.15 - peMaisBaixo();
  else {
    const c = new THREE.Box3().setFromObject(modelo);
    modelo.position.y += 0.15 - c.min.y;
  }
}

// Medição contínua pelos ossos, por clipe: pé mais baixo, topo e deriva do quadril
const medidas = {
  reset() { this.peMin = Infinity; this.peMax = -Infinity; this.topoMin = Infinity; this.topoMax = -Infinity; this.deriva = 0; this.q0 = null; },
  atualizar() {
    if (!ossos.length) return;
    modelo.updateMatrixWorld(true);
    const pe = peMaisBaixo();
    let topo = -Infinity;
    for (const b of ossos) { b.getWorldPosition(_p); topo = Math.max(topo, _p.y); }
    this.peMin = Math.min(this.peMin, pe); this.peMax = Math.max(this.peMax, pe);
    this.topoMin = Math.min(this.topoMin, topo); this.topoMax = Math.max(this.topoMax, topo);
    if (quadril) {
      quadril.getWorldPosition(_p);
      if (!this.q0) this.q0 = _p.clone();
      this.deriva = Math.max(this.deriva, Math.hypot(_p.x - this.q0.x, _p.z - this.q0.z));
    }
    $('info').innerHTML =
      `Pé mais baixo: ${(this.peMin - 0.15).toFixed(3)} a ${(this.peMax - 0.15).toFixed(3)} (0 = no chão)<br>` +
      `Topo: ${this.topoMin.toFixed(2)} a ${this.topoMax.toFixed(2)} (tem que variar)<br>` +
      `Deriva horizontal do quadril: ${this.deriva.toFixed(3)} (perto de 0 = no lugar)`;
  },
};
medidas.reset();

function aplicarFacetas() {
  for (const m of materiais) { m.flatShading = facetas; m.needsUpdate = true; }
  $('bFacetas').querySelector('b').textContent = facetas ? 'ligadas' : 'desligadas';
  $('bFacetas').classList.toggle('ativo', facetas);
}
$('bFacetas').onclick = () => { facetas = !facetas; aplicarFacetas(); };
$('bGirar').onclick = () => {
  girar = !girar;
  $('bGirar').querySelector('b').textContent = girar ? 'ligado' : 'desligado';
  $('bGirar').classList.toggle('ativo', girar);
};
$('vel').oninput = (e) => {
  velocidade = Number(e.target.value);
  $('velN').textContent = velocidade.toFixed(2) + '×';
  if (acaoAtual) acaoAtual.setEffectiveTimeScale(velocidade);
};
// Mesmo enquadramento do jogo: câmera 9,5 acima e 12 atrás do personagem
$('bCamJogo').onclick = () => { camera.position.set(0, 9.5, 12); controles.target.set(0, 0.8, 0); };
$('bPerto').onclick = () => { camera.position.set(1.6, 1.4, 3.4); controles.target.set(0, 0.6, 0); };

const relogio = new THREE.Clock();
let t = 0;
function quadro() {
  requestAnimationFrame(quadro);
  const dt = Math.min(relogio.getDelta(), 0.05);
  t += dt;
  if (mixer) mixer.update(dt);
  if (modelo) {
    if (girar) modelo.rotation.y += dt * 0.5;
    medidas.atualizar();
  }
  animarFigura(jogador, t, false);
  ilha.update(dt);
  controles.update();
  mundo.update(dt, t);
  mundo.composer.render();
}
quadro();

// Para testes automatizados
window.inspecao = { get modelo() { return modelo; }, medidas, tocar: (n) => { const b = [...document.querySelectorAll('#clipes button')].find((x) => x.textContent.startsWith(n)); b?.click(); } };
