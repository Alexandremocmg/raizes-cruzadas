// Raízes Cruzadas — capítulo 1.
// Fluxo: Intro (a ilha é dada) → Ato 1 (dar água) → Ato 2 (o Centro e os ídolos)
//        → Ato 3 (Ferro e a Caverna do Outro Olho, revelação da Fonte) → Ato 4 (a Fonte no centro) → Final.
import * as THREE from 'three';
import { criarMundo } from './mundo.js';
import { Ilha, Ponte } from './ilha.js';
import { criarFigura, animarFigura } from './figura.js';
import { carregarPersonagem, prepararCinza } from './personagem.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ui } from './ui.js';
import { PAGINAS } from './diario.js';
import { lerp, damp, dampAngulo, smooth } from './util.js';
import { carga } from './carga.js';
import { salvar } from './salvar.js';
import { som } from './som.js';
import { ajustes } from './ajustes.js';

const canvas = document.getElementById('c');
const mundo = criarMundo(canvas);
const { scene, camera } = mundo;
ui.camera = camera;
ui.iniciarDiario(PAGINAS);

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ====================================================================
// Arquipélago
// ====================================================================
const D = {
  casa: { x: 0, z: 0, raio: 9 },
  salvia: { x: 21, z: -5, raio: 5.5 },
  lume: { x: -17, z: -13, raio: 5 },
  ferro: { x: 4, z: 23, raio: 6 },
};
const NPC_IDS = ['salvia', 'lume', 'ferro'];
const POCO = { x: -3.2, z: 2.4 };
const SPAWN = { x: 1.6, z: 4.6 };
const ARVORE_MAE = { x: -4.6, z: -4.0 }; // fundo noroeste: atrás do Centro, sem tapar a câmera

/** Ponto local na borda de `de`, voltado para `para`. */
function bordaLocal(de, para, f) {
  const dx = para.x - de.x, dz = para.z - de.z, d = Math.hypot(dx, dz);
  return { x: (dx / d) * de.raio * f, z: (dz / d) * de.raio * f };
}

const casa = new Ilha({
  ...D.casa, seed: 7, saude: 0.03,
  livre: [
    { x: 0, z: 0, r: 2.4 },
    { x: POCO.x, z: POCO.z, r: 1.4 },
    { x: SPAWN.x, z: SPAWN.z, r: 1.2 },
    { x: ARVORE_MAE.x, z: ARVORE_MAE.z, r: 2.6 },
    ...NPC_IDS.map((id) => ({ ...bordaLocal(D.casa, D[id], 0.8), r: 1.8 })),
  ],
});
const ilhas = { casa };
for (const [id, seed, saude] of [['salvia', 21, 0.3], ['lume', 33, 0.55], ['ferro', 47, 0.12]]) {
  ilhas[id] = new Ilha({
    ...D[id], seed, saude,
    livre: [{ x: 0, z: 0, r: 1.6 }, { ...bordaLocal(D[id], D.casa, 0.8), r: 1.6 }],
  });
}
const enfeites = [
  [-42, 6, 3.2], [40, 20, 2.6], [-30, 36, 3.6], [32, -34, 3], [-6, -40, 4],
  [54, -6, 2.2], [-54, -26, 2.8], [16, 48, 2.4], [-20, 58, 3], [62, 30, 3.4],
].map(([x, z, raio], i) => new Ilha({ x, z, raio, seed: 100 + i, saude: 0.3 + (i % 3) * 0.12 }));
const todas = [...Object.values(ilhas), ...enfeites];
for (const il of todas) {
  scene.add(il.group);
  mundo.adicionarRaio(il.centro.x, il.centro.z, il.raio + 1.2);
}

const pontes = {}, DOCA = {};
for (const id of NPC_IDS) {
  DOCA[id] = casa.docaPara(ilhas[id]);
  pontes[id] = new Ponte(DOCA[id], ilhas[id].docaPara(casa));
  scene.add(pontes[id].group);
}

// Raízes de luz no mar: casa → cada vizinho, e Ferro → uma ilha distante
NPC_IDS.forEach((id, i) => {
  mundo.marU.uSegA.value[i].set(0, 0);
  mundo.marU.uSegB.value[i].set(D[id].x, D[id].z);
});
mundo.marU.uSegA.value[3].set(D.ferro.x, D.ferro.z);
mundo.marU.uSegB.value[3].set(16, 48);

// ====================================================================
// Objetos da ilha: Centro, poço, docas, marcador
// ====================================================================
const matPedra = new THREE.MeshStandardMaterial({ color: '#efe3d2', flatShading: true, roughness: 0.85 });

const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.55, 0.5, 7), matPedra);
pedestal.position.set(0, 0.3, 0);
pedestal.castShadow = pedestal.receiveShadow = true;
scene.add(pedestal);

// O Centro do Tripo (docs/objetos/centro.md) substitui o pedestal provisório quando carrega.
// Veio 1,45× mais largo que alto; esticamos para 2,6 de largura e ~0,9 de altura (deformação
// moderada, sem amassar as flores). `CENTRO.topo` é onde ficam os objetos e a Lume.
const CENTRO = { topo: 0.55 };
carga.registrar('centro', new GLTFLoader().loadAsync('assets/tripo/centro/tripo-out/centro-b8bc24bd/model_web.glb')).then((gltf) => {
  const m = gltf.scene;
  m.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.material.flatShading = true;
      o.material.needsUpdate = true;
    }
  });
  m.scale.set(2.6, 1.3, 2.6);
  m.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(m); // objeto estático: aqui a Box3 é confiável
  m.position.y = 0.08 - caixa.min.y;
  scene.remove(pedestal);
  scene.add(m);
  CENTRO.topo = 0.08 + (caixa.max.y - caixa.min.y) - 0.06; // o topo tem uma borda; os objetos ficam dentro dela
  for (const o of Object.values(objCentro)) o.position.y = CENTRO.topo;
  if (E.centro === 'lume') npcs.lume.fig.raiz.position.y = CENTRO.topo;
}).catch((erro) => console.error('[centro] não carregou o modelo; usando o pedestal provisório.', erro));

// Árvore-mãe (docs/objetos/arvore-mae.md): perde a cor junto com a saúde da ilha do jogador.
const arvoreMae = { mats: [] };
carga.registrar('arvore-mae', new GLTFLoader().loadAsync('assets/tripo/arvore-mae/tripo-out/arvore-mae-4321daba/model_web.glb')).then((gltf) => {
  const m = gltf.scene;
  m.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.material.flatShading = true;
      prepararCinza(o.material);
      arvoreMae.mats.push(o.material);
    }
  });
  const caixa = new THREE.Box3().setFromObject(m);
  m.scale.setScalar(5.5 / (caixa.max.y - caixa.min.y));
  m.updateMatrixWorld(true);
  const caixa2 = new THREE.Box3().setFromObject(m);
  m.position.set(ARVORE_MAE.x, 0.1 - caixa2.min.y, ARVORE_MAE.z);
  m.rotation.y = 0.6;
  scene.add(m);
  casa.colisores.push({ x: ARVORE_MAE.x, z: ARVORE_MAE.z, r: 0.8 }); // tronco
}).catch((erro) => console.error('[arvore-mae] não carregou o modelo.', erro));

const matAnel = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a').multiplyScalar(2), transparent: true, opacity: 0, depthWrite: false });
const anelCentro = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.95, 28), matAnel);
anelCentro.rotation.x = -Math.PI / 2;
anelCentro.position.y = 0.22;
scene.add(anelCentro);

const poco = new THREE.Group();
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.7, 8, 1, true), matPedra);
  base.position.y = 0.35;
  base.material = matPedra.clone(); base.material.side = THREE.DoubleSide;
  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.1, 4, 8), matPedra);
  borda.rotation.x = Math.PI / 2; borda.position.y = 0.7;
  const madeira = new THREE.MeshStandardMaterial({ color: '#9a6a4f', flatShading: true });
  for (const s of [-1, 1]) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), madeira);
    poste.position.set(0.72 * s, 1.05, 0);
    poco.add(poste);
  }
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.6, 4), new THREE.MeshStandardMaterial({ color: '#d9775a', flatShading: true }));
  telhado.position.y = 2.0; telhado.rotation.y = Math.PI / 4;
  poco.add(base, borda, telhado);
  poco.traverse((o) => { if (o.isMesh) o.castShadow = true; });
}
const matAguaPoco = new THREE.MeshStandardMaterial({ color: '#3fc6dc', emissive: '#3fc6dc', emissiveIntensity: 0.4, flatShading: true });
const aguaPoco = new THREE.Mesh(new THREE.CircleGeometry(0.68, 8), matAguaPoco);
aguaPoco.rotation.x = -Math.PI / 2;
poco.add(aguaPoco);
poco.position.set(POCO.x, 0.1, POCO.z);
scene.add(poco);

const matDoca = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9ff3ff').multiplyScalar(1.5), transparent: true, opacity: 0.55, depthWrite: false });
for (const id of NPC_IDS) {
  const r = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 20), matDoca);
  r.rotation.x = -Math.PI / 2;
  r.position.copy(DOCA[id]).setY(0.22);
  scene.add(r);
}

const marcador = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.28, 0),
  new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a').multiplyScalar(2.2) }),
);
scene.add(marcador);

const marcaToque = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.38, 16),
  new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
);
marcaToque.rotation.x = -Math.PI / 2;
scene.add(marcaToque);

// O que pode ocupar o Centro
const objCentro = {
  cisterna: (() => {
    const g = new THREE.Group();
    const barril = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.5, 8), new THREE.MeshStandardMaterial({ color: '#8fa6ba', flatShading: true, metalness: 0.3, roughness: 0.5 }));
    barril.position.y = 0.75;
    const tampa = new THREE.Mesh(new THREE.CircleGeometry(0.8, 8), new THREE.MeshStandardMaterial({ color: '#3d6b7a', flatShading: true }));
    tampa.rotation.x = -Math.PI / 2; tampa.position.y = 1.51;
    for (const y of [0.3, 1.2]) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.05, 4, 8), new THREE.MeshStandardMaterial({ color: '#5b6b78', flatShading: true }));
      aro.rotation.x = Math.PI / 2; aro.position.y = y; g.add(aro);
    }
    g.add(barril, tampa);
    return g;
  })(),
  espelho: (() => {
    const g = new THREE.Group();
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 6), new THREE.MeshStandardMaterial({ color: '#eaf2ff', metalness: 0.6, roughness: 0.1, emissive: '#a9c2e6', emissiveIntensity: 0.6, flatShading: true }));
    disco.rotation.x = Math.PI / 2; disco.position.y = 1.5;
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 5), new THREE.MeshStandardMaterial({ color: '#c7a76a', flatShading: true }));
    haste.position.y = 0.5;
    g.add(disco, haste);
    g.userData.gira = disco;
    return g;
  })(),
  fonte: (() => {
    const g = new THREE.Group();
    const coluna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.95, 7, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#bff6ff').multiplyScalar(1.4), transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    coluna.position.y = 3.5;
    const nucleo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e6fdff').multiplyScalar(1.8) }));
    nucleo.position.y = 0.9;
    const luz = new THREE.PointLight('#bff6ff', 14, 16, 1.6);
    luz.position.y = 1.5;
    g.add(coluna, nucleo, luz);
    g.userData.coluna = coluna;
    g.userData.nucleo = nucleo;
    return g;
  })(),
};
for (const o of Object.values(objCentro)) { o.position.y = 0.55; o.visible = false; scene.add(o); }

// ---- Objetos gerados no Tripo (docs/objetos/): trocam as versões feitas por código quando carregam.
// Se algum falhar, a versão por código continua no lugar e o erro aparece no console.
/**
 * Prepara um modelo estático: sombras, facetas, gira a "frente" do Tripo (+X) para a câmera (+Z),
 * ajusta a altura e apoia a base em y = 0, centrado em x/z. Devolve o grupo pronto.
 */
function prepararObjeto(gltf, altura) {
  const m = gltf.scene;
  m.traverse((o) => {
    if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material.flatShading = true; o.material.needsUpdate = true; }
  });
  m.rotation.y = -Math.PI / 2;
  m.updateMatrixWorld(true);
  const c0 = new THREE.Box3().setFromObject(m); // objeto estático: aqui a Box3 é confiável
  m.scale.setScalar(altura / (c0.max.y - c0.min.y));
  m.updateMatrixWorld(true);
  const c = new THREE.Box3().setFromObject(m);
  m.position.set(-(c.min.x + c.max.x) / 2, -c.min.y, -(c.min.z + c.max.z) / 2);
  const g = new THREE.Group();
  g.add(m);
  g.userData.altura = altura;
  g.userData.modelo = m;
  return g;
}
// `model_web.glb` = versão leve (scripts/otimizar_glb.py: textura 1024 px em JPEG); os originais ficam ao lado.
const urlTripo = (pasta, id, arq = 'model_web.glb') => `assets/tripo/${pasta}/tripo-out/${pasta}-${id}/${arq}`;

// Poço: a água continua sendo o disco do jogo (sobe e desce com o nível, brilha com a Fonte)
const POCO_AGUA = { y0: 0.15, y1: 0.65, r: 0.68 };
carga.registrar('poco', new GLTFLoader().loadAsync(urlTripo('poco', '1675d699', 'model_web.glb'))).then((gltf) => {
  const g = prepararObjeto(gltf, 2.4);
  for (const f of [...poco.children]) if (f !== aguaPoco) poco.remove(f); // tira o poço feito por código
  poco.add(g);
  // A boca do poço fica a ~46% da altura; a água fica um pouco abaixo da borda
  Object.assign(POCO_AGUA, { y0: 2.4 * 0.30, y1: 2.4 * 0.42, r: 0.40 });
  aguaPoco.scale.setScalar(POCO_AGUA.r / 0.68);
}).catch((erro) => console.error('[poco] não carregou o modelo; usando o poço feito por código.', erro));

// Cisterna e Espelho (sobre o Centro)
carga.registrar('cisterna', new GLTFLoader().loadAsync(urlTripo('cisterna', 'fffdbbcf', 'model_web.glb'))).then((gltf) => {
  const g = prepararObjeto(gltf, 1.5);
  objCentro.cisterna.clear();
  objCentro.cisterna.add(g);
}).catch((erro) => console.error('[cisterna] não carregou o modelo; usando a cisterna feita por código.', erro));

carga.registrar('espelho', new GLTFLoader().loadAsync(urlTripo('espelho', '8db86a7a', 'model_web.glb'))).then((gltf) => {
  const g = prepararObjeto(gltf, 2.0);
  objCentro.espelho.clear();
  objCentro.espelho.add(g);
  objCentro.espelho.userData.gira = null;
  objCentro.espelho.userData.modelo = g.userData.modelo;
}).catch((erro) => console.error('[espelho] não carregou o modelo; usando o espelho feito por código.', erro));

// ====================================================================
// Personagens
// ====================================================================
const npcs = {
  salvia: { nome: 'Dona Sálvia', fig: criarFigura({ corpo: '#a58bc4', lenco: '#f1e4c8', pele: '#e8c09c', escala: 0.92, curvado: 0.22, cajado: true }) },
  lume: { nome: 'Lume', fig: criarFigura({ corpo: '#ffd56e', lenco: '#ff8b5e', pele: '#f3cfa8', escala: 0.68 }) },
  ferro: { nome: 'Ferro', fig: criarFigura({ corpo: '#5f6873', lenco: '#2c3036', pele: '#d4ab88', escala: 1.12 }) },
};
for (const id of NPC_IDS) {
  const n = npcs[id];
  n.casa = V(D[id].x, 0.15, D[id].z);
  n.fig.raiz.position.copy(n.casa);
  // Só o giro em Y. (lookAt deixava giros de 180° em X e Z quando o personagem olhava "para trás",
  // como o Ferro, ao sul; depois o código só mexe no Y e ele acabava de costas para o jogador.)
  n.fig.raiz.rotation.set(0, Math.atan2(-n.casa.x, -n.casa.z), 0);
  n.rotulo = ui.criarRotulo(n.nome);
  n.cinza = 0;
  scene.add(n.fig.raiz);
}

// Personagens animados (Tripo + Mixamo). A figura provisória fica até o GLB carregar — e, se
// falhar, continua no lugar, mas o erro aparece no console (fallback silencioso esconde defeito).
function trocarPorAnimado(id, url, altura, aoCarregar) {
  carga.registrar(id, carregarPersonagem(url, { altura })).then((fig) => {
    const n = npcs[id], velha = n.fig;
    fig.raiz.position.copy(velha.raiz.position);
    // Só o giro em Y: copiar o quaternion recompõe os ângulos com giros de 180° em X e Z quando o
    // personagem olha "para trás" (o Ferro, ao sul), e ele passava a andar e olhar de costas.
    fig.raiz.rotation.set(0, velha.raiz.rotation.y, 0);
    scene.remove(velha.raiz);
    scene.add(fig.raiz);
    n.fig = fig;
    aoCarregar?.(fig);
  }).catch((erro) => console.error(`[${id}] não carregou o modelo animado; usando a figura provisória.`, erro));
}
trocarPorAnimado('lume', 'assets/modelos/lume.glb', 1.0);

// Dona Sálvia: o cajado é uma peça separada que acompanha a mão direita (objeto na mão
// deformaria no auto-rig do Mixamo). Fica sempre na vertical, com o topo um pouco acima da mão.
const S = { falando: 0, agradecendo: 0, cajado: null };
trocarPorAnimado('salvia', 'assets/modelos/salvia.glb', 1.25, () => {
  S.cajado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 1.05, 5),
    new THREE.MeshStandardMaterial({ color: '#8b6248', flatShading: true, roughness: 0.9 }),
  );
  S.cajado.castShadow = true;
  scene.add(S.cajado);
});
const _mao = new THREE.Vector3();
function comportamentoSalvia(dt) {
  const n = npcs.salvia, r = n.fig.raiz;
  if (S.agradecendo > 0) {
    S.agradecendo -= dt;
    virarPara(r, J.pos.x, J.pos.z, dt);
  } else if (S.falando > 0) {
    S.falando -= dt;
    virarPara(r, J.pos.x, J.pos.z, dt);
    n.fig.tocar('falar');
  } else {
    virarPara(r, 0, 0, dt * 0.3); // volta devagar a olhar para a ilha do jogador
    n.fig.tocar('idle');
  }
  if (S.cajado && n.fig.posicaoOsso(/RightHand$/, _mao)) {
    S.cajado.position.set(_mao.x, _mao.y - 0.45, _mao.z);
  }
}
// Ferro: desconfiado, acompanha o jogador com o olhar. Abatido na Caverna do Outro Olho.
// No final, com a Fonte no centro, atravessa a ponte de raiz até a ilha do jogador.
const F = { falando: 0, abatido: false, rota: null, aoChegar: null, olhar: null };
trocarPorAnimado('ferro', 'assets/modelos/ferro.glb', 1.6);
function ferroAbatido() {
  F.abatido = true;
  if (npcs.ferro.fig.animado) npcs.ferro.fig.tocar('abatido', { janela: [0, 1], duracao: 3.5, fade: 0.4 });
}
function ferroAtravessa() {
  const p = pontes.ferro;
  F.abatido = false;
  // Da ilha dele até a borda, pela ponte, e um pouco para dentro da ilha do jogador
  F.rota = [p.b.clone(), p.a.clone(), V(p.a.x * 0.72, 0.15, p.a.z * 0.72)];
}
function comportamentoFerro(dt) {
  const n = npcs.ferro, r = n.fig.raiz;
  if (F.rota) {
    const alvo = F.rota[0];
    const dx = alvo.x - r.position.x, dz = alvo.z - r.position.z, d = Math.hypot(dx, dz);
    if (d < 0.08) {
      F.rota.shift();
      if (!F.rota.length) {
        F.rota = null;
        const cb = F.aoChegar;
        F.aoChegar = null;
        cb?.();
      }
    } else {
      const passo = Math.min(d, 1.1 * dt);
      r.position.x += (dx / d) * passo;
      r.position.z += (dz / d) * passo;
      r.position.y = pontes.ferro.alturaEm(r.position.x, r.position.z) ?? 0.15;
      virarPara(r, alvo.x, alvo.z, dt);
      n.fig.tocar('andar');
      return;
    }
  }
  if (F.abatido) { // segura a pose final do "abatido", virado para o lado de onde vem o jogador
    if (F.olhar) virarPara(r, F.olhar.x, F.olhar.z, dt * 0.8);
    return;
  }
  if (F.falando > 0) {
    F.falando -= dt;
    virarPara(r, J.pos.x, J.pos.z, dt);
    n.fig.tocar('falar');
    return;
  }
  virarPara(r, J.pos.x, J.pos.z, dt * 0.5); // acompanha o jogador com o olhar
  n.fig.tocar('idle');
}

/** Chamado quando a água enviada chega à ilha dela. */
function salviaAgradece() {
  const n = npcs.salvia;
  if (!n.fig.animado) return;
  S.agradecendo = 3.0;
  S.falando = 0;
  n.fig.tocar('agradecer', { janela: [0, 1], duracao: 3.0, fade: 0.25 });
}

// Comportamento da Lume animada: passeia pela ilha dela, fala virada para o jogador,
// e no Centro alterna entre feliz (promessa) e triste (exigência e rachadura).
const L = { espera: 3, alvo: null, falando: 0 };
function virarPara(r, x, z, dt) {
  r.rotation.set(0, dampAngulo(r.rotation.y, Math.atan2(x - r.position.x, z - r.position.z), 6, dt), 0);
}
function comportamentoLume(dt) {
  const n = npcs.lume, r = n.fig.raiz;
  if (E.centro === 'lume') {
    L.alvo = null;
    n.fig.tocar(E.fase === 'exigencia' || E.fase === 'rachadura' ? 'triste' : 'idle');
    return;
  }
  if (L.falando > 0) {
    L.falando -= dt;
    L.alvo = null;
    virarPara(r, J.pos.x, J.pos.z, dt);
    n.fig.tocar('falar');
    return;
  }
  if (n.cinza > 0.3) { n.fig.tocar('triste'); return; }
  if (L.alvo) {
    const dx = L.alvo.x - r.position.x, dz = L.alvo.z - r.position.z, d = Math.hypot(dx, dz);
    if (d < 0.1) {
      L.alvo = null;
      L.espera = 4 + Math.random() * 5;
    } else {
      const passo = Math.min(d, 1.0 * dt);
      r.position.x += (dx / d) * passo;
      r.position.z += (dz / d) * passo;
      virarPara(r, L.alvo.x, L.alvo.z, dt);
      n.fig.tocar('andar');
      return;
    }
  }
  n.fig.tocar('idle');
  L.espera -= dt;
  if (L.espera <= 0) {
    // Só dentro da área livre no meio da ilha dela (sem árvores)
    const a = Math.random() * Math.PI * 2, rr = 0.3 + Math.random() * 1.0;
    L.alvo = V(n.casa.x + Math.cos(a) * rr, 0, n.casa.z + Math.sin(a) * rr);
  }
}

let jog = criarFigura({ corpo: '#fbf2e2', lenco: '#2fc4b2' });
scene.add(jog.raiz);
const J = { pos: V(SPAWN.x, 0.15, SPAWN.z), alvo: null, dir: Math.PI, andando: false, acao: null };

// Jogador animado (Tripo + Mixamo). Mesma política da Lume: provisório até carregar, erro visível se falhar.
carga.registrar('jogador', carregarPersonagem('assets/modelos/jogador.glb', { altura: 1.45 })).then((fig) => {
  scene.remove(jog.raiz);
  scene.add(fig.raiz);
  jog = fig;
}).catch((erro) => console.error('[jogador] não carregou o modelo animado; usando a figura provisória.', erro));

// Ações com gesto. Janelas medidas pelos ossos na página de inspeção (2026-10-06):
//  - tirar (Picking Up, 9,6 s): desce até 0,80 aos ~22% e volta a ~1,46 aos 56%;
//  - enviar (Throw, 2,23 s): mão no alto e soltando aos ~39%; braço desce até ~60%.
// `momento` é a fração da DURAÇÃO NO JOGO em que o efeito acontece (água entra / sai da mão).
const GESTOS = {
  tirar: { janela: [0.0, 0.56], duracao: 1.8, momento: 0.42 },
  enviar: { janela: [0.0, 0.6], duracao: 1.1, momento: 0.65 },
};
/** Faz o gesto e executa `efeito` no momento certo dele. Sem modelo animado, executa na hora. */
function gesto(nome, efeito) {
  if (!jog.animado) { efeito(); return; }
  const g = GESTOS[nome];
  J.alvo = null;
  J.acao = { nome, t: 0, dur: g.duracao, momento: g.duracao * g.momento, efeito, feito: false };
  jog.tocar(nome, { janela: g.janela, duracao: g.duracao, fade: 0.15 });
}
function atualizarGesto(dt) {
  const a = J.acao;
  if (!a) return;
  a.t += dt;
  if (!a.feito && a.t >= a.momento) { a.feito = true; a.efeito(); }
  if (a.t >= a.dur) J.acao = null;
}

// ====================================================================
// Estado do jogo
// ====================================================================
const E = {
  iniciado: false,
  ocupado: false,   // cena em andamento: sem controle do jogador
  ato: 0,
  agua: 0,
  poco: 2,
  centro: null,     // null | 'cisterna' | 'espelho' | 'lume' | 'fonte'
  centroT: 0,
  fase: null,       // 'promessa' | 'exigencia' | 'rachadura'
  idolos: new Set(),
  chegouRachadura: false,
  tempoAto2: 0,
  fonteLiberada: false,
  doacoes: 0,
  tParada: 0, tExig: 0, tVazio: 0, tAplauso: 0,
  cam: { pos: V(0, 30, 44), alvo: V(0, 0, 0), vel: 0.6 },
  avisos: new Set(),
};
const amb = { escuro: 0.8 };

function umaVez(chave, fn) {
  if (E.avisos.has(chave)) return;
  E.avisos.add(chave);
  fn();
}

const NOMES = { cisterna: 'a Cisterna', espelho: 'o Espelho', lume: 'a Lume', fonte: 'a Fonte' };

const TEXTO_FASE = {
  cisterna: {
    promessa: 'A cisterna se enche. Pela primeira vez você sente que nunca vai faltar.',
    exigencia: 'A cisterna pede mais. Dar água a alguém agora parece perigoso.',
    rachadura: 'O peso da cisterna racha o chão. A água guardada começou a apodrecer.',
  },
  espelho: {
    promessa: 'Todos olham para você. Cada gesto vira aplauso.',
    exigencia: 'Sem plateia, dar parece não valer nada. As raízes ficam rasas.',
    rachadura: 'As pessoas viraram público. As ilhas ao redor começam a secar.',
  },
  lume: {
    promessa: 'Lume veio morar no centro da sua ilha. Nunca houve tanto calor aqui.',
    exigencia: 'Lume não pode sair. A ilha dela, sozinha, começa a secar.',
    rachadura: 'Lume está perdendo a cor. Ninguém aguenta ser o centro de outra pessoa.',
  },
};
const APLAUSOS = ['Que pessoa generosa!', 'Todos falam de você!', 'Incrível!', 'Você é o melhor!'];

// ====================================================================
// Agenda e animações simples
// ====================================================================
const agenda = [];
const depois = (s, fn) => agenda.push({ t: s, fn });
const tweens = [];
function tween(obj, chave, para, dur) {
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].obj === obj && tweens[i].chave === chave) tweens.splice(i, 1);
  tweens.push({ obj, chave, de: obj[chave], para, dur, t: 0 });
}
function atualizarTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.obj[tw.chave] = lerp(tw.de, tw.para, smooth(k));
    if (k >= 1) tweens.splice(i, 1);
  }
}
function atualizarAgenda(dt) {
  for (let i = agenda.length - 1; i >= 0; i--) {
    agenda[i].t -= dt;
    if (agenda[i].t <= 0) { const { fn } = agenda[i]; agenda.splice(i, 1); fn(); }
  }
}

// Orbes de água voando entre ilhas
const orbes = [];
const geoOrbe = new THREE.IcosahedronGeometry(0.22, 0);
function lancarOrbe(de, para, cor, aoChegar) {
  const m = new THREE.Mesh(geoOrbe, new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(2.5) }));
  m.position.copy(de);
  scene.add(m);
  orbes.push({ m, de: de.clone(), para: para.clone(), t: 0, dur: Math.max(0.6, de.distanceTo(para) / 10), aoChegar });
}
function atualizarOrbes(dt) {
  for (let i = orbes.length - 1; i >= 0; i--) {
    const o = orbes[i];
    o.t += dt;
    const k = Math.min(1, o.t / o.dur);
    o.m.position.lerpVectors(o.de, o.para, k);
    o.m.position.y += Math.sin(Math.PI * k) * 3;
    o.m.rotation.y += dt * 4;
    if (k >= 1) { scene.remove(o.m); orbes.splice(i, 1); o.aoChegar?.(); }
  }
}

const acima = (p, h = 2.2) => V(p.x, p.y + h, p.z);

// ====================================================================
// Ações do jogador
// ====================================================================
function tirarAgua() {
  if (Math.floor(E.poco) < 1) return;
  // Vira para o poço e abaixa; a água entra quando as mãos chegam lá embaixo
  J.dir = Math.atan2(POCO.x - J.pos.x, POCO.z - J.pos.z);
  gesto('tirar', () => {
    const n = Math.floor(E.poco);
    if (n < 1) return;
    E.poco -= n;
    E.agua += n;
    ui.setAgua(E.agua);
    ui.flutuar(`+${n} água`, acima(J.pos));
    som.efeito('tirar');
    if (E.ato === 1) umaVez('dica-doca', () => ui.dizer('Agora vá até o círculo de luz na borda leste, de frente para a ilha de Dona Sálvia.', { dur: 5 }));
  });
}

function enviarAgua(id) {
  if (E.agua <= 0) return;
  if (E.centro === 'cisterna' && E.fase !== 'promessa') {
    ui.dizer('Você hesita. A cisterna precisa continuar cheia…', { dur: 3.5 });
    return;
  }
  // Desconta já, para um segundo toque durante o gesto não gastar a mesma água duas vezes
  E.agua--;
  ui.setAgua(E.agua);
  const il = ilhas[id];
  J.dir = Math.atan2(il.centro.x - J.pos.x, il.centro.z - J.pos.z);
  gesto('enviar', () => {
    // A água sai da mão direita, no instante em que o braço solta
    const origem = (jog.animado && jog.posicaoOsso(/RightHand$/, V(0, 0, 0))) || acima(J.pos, 1.2);
    som.efeito('enviar');
    lancarAgua(id, il, origem);
  });
}

function lancarAgua(id, il, origem) {
  lancarOrbe(origem, V(il.centro.x, 0.8, il.centro.z), '#9ff3ff', () => {
    som.efeito('chegar');
    let ganho = 0.15;
    if (E.centro === 'espelho' && E.fase !== 'promessa') {
      ganho = 0.05;
      ui.flutuar('ninguém viu… isso conta?', acima(J.pos));
    }
    if (E.centro === 'fonte') {
      ganho = 0.22;
      E.poco = Math.min(6, E.poco + 0.6);
    }
    il.alvoSaude = Math.min(1, il.alvoSaude + ganho);
    if (id === 'salvia') salviaAgradece();
    E.doacoes++;

    const pNpc = acima(npcs[id].fig.raiz.position);
    if (E.centro === 'espelho' && E.fase === 'promessa') ui.flutuar('Que generosidade! Todos vão saber!', acima(J.pos, 2.9));
    else if (id === 'ferro' && E.ato < 3) ui.flutuar('…', pNpc);

    if (E.doacoes === 1) {
      ui.desbloquear('agua');
      if (E.ato === 1) depois(3, iniciarAto2);
    }
    if (il.alvoSaude >= 0.55 && !pontes[id].crescendo) {
      pontes[id].crescer();
      som.efeito('ponte');
      ui.dizer(`Uma raiz começou a crescer entre você e ${npcs[id].nome}. Por baixo, onde ninguém vê.`, { dur: 4.5 });
    }
  });
}

function conversar(id) {
  const il = ilhas[id];
  const n = npcs[id];
  let fala;
  if (id === 'salvia') {
    if (il.saude < 0.55) fala = 'Obrigada por lembrar de mim. Não tenho nada para te dar em troca.';
    else if (E.ato < 3) fala = 'Minha terra voltou a florir. Não sei de onde vem tanta água… mas sei que não vem só de você.';
    else fala = 'Na minha idade a gente aprende: quem segura a água, perde. Quem deixa passar, nunca seca.';
  } else if (id === 'lume') {
    if (E.centro === 'lume') {
      fala = {
        promessa: 'Aqui é tão quentinho! Eu sou importante pra você, né?',
        exigencia: 'Posso ir ver as minhas flores? …Não? Tudo bem.',
        rachadura: 'Eu não consigo respirar direito aqui. Me deixa voltar pra casa?',
      }[E.fase] ?? 'Oi!';
    } else if (E.ato < 3) fala = 'Sabia que a água faz barulho quando corre? Parada, ela fica quietinha… e triste.';
    else fala = 'Eu vi a luz lá embaixo! Ela passa por todas as ilhas, até pela do Ferro.';
  } else {
    if (E.ato < 3) fala = 'O que você quer? Ninguém vem aqui sem querer alguma coisa.';
    else if (il.saude < 0.8) fala = 'Ainda não sei o que fazer com o que você fez.';
    else fala = 'Minha ilha está verde. Eu tinha esquecido dessa cor.';
  }
  ui.dizer(fala, { quem: n.nome, dur: 4.5, agora: true });
  if (id === 'lume') L.falando = 4.5;
  if (id === 'salvia') { S.falando = 4.5; S.agradecendo = 0; }
  if (id === 'ferro' && !F.abatido && !F.rota) F.falando = 4.5;
}

function abrirMenuCentro() {
  const ops = [
    ['cisterna', 'Cisterna', 'Água guardada. Segurança. Nunca mais faltar.'],
    ['espelho', 'Espelho', 'O eco dos outros. Ser visto, ser lembrado.'],
    ['lume', 'Lume', 'Alguém que você ama.'],
  ];
  if (E.fonteLiberada) ops.push(['fonte', 'A Fonte', 'Aquilo que corre por baixo de tudo.']);
  const p = ui.abrirOverlay(`
    <h2>O que vai ocupar o centro da sua ilha?</h2>
    <p class="nota">Tudo o mais vai girar em torno disso.</p>
    <div class="opcoes"></div>`);
  const box = p.querySelector('.opcoes');
  for (const [id, titulo, desc] of ops) {
    const b = document.createElement('button');
    b.className = 'opcao' + (id === 'fonte' ? ' fonte' : '');
    b.innerHTML = `<b>${titulo}</b>${desc}`;
    b.onclick = () => colocarNoCentro(id);
    box.appendChild(b);
  }
}

function colocarNoCentro(id) {
  ui.fecharOverlay();
  E.centro = id;
  E.centroT = 0;
  E.fase = null;
  E.tExig = 0;
  E.tVazio = 0;
  E.idolos.add(id);
  for (const [k, o] of Object.entries(objCentro)) o.visible = k === id;
  if (id === 'lume') {
    npcs.lume.fig.raiz.position.set(0, CENTRO.topo, 0);
    ui.flutuar('✨', acima(npcs.lume.fig.raiz.position, 1.5));
  }
  if (id === 'fonte') {
    som.efeito('fonte');
    ui.dizer('A Fonte não pesa sobre a ilha. Ela a sustenta por baixo.', { dur: 4.5 });
    if (casa.racha > 0.1) ui.dizer('As rachaduras não sumiram. Viraram veios de luz.', { dur: 4.5 });
    ui.dizer('Agora leve água a todas as ilhas. Dar já não te esvazia.', { dur: 5 });
  }
}

function tirarDoCentro() {
  const c = E.centro;
  if (!c) return;
  if (c === 'lume') {
    npcs.lume.fig.raiz.position.copy(npcs.lume.casa);
    L.alvo = null;
    L.espera = 2;
  }
  if (c === 'fonte') ui.dizer('A Fonte não obriga ninguém a nada.', { dur: 3.5 });
  else if (E.fase === 'rachadura') {
    ui.dizer('Você tirou o peso. As rachaduras ficaram, mas pararam de crescer.', { dur: 4.5 });
  } else ui.dizer('O centro ficou vazio.', { dur: 2.5 });
  if (c !== 'fonte') ui.desbloquear('cisternas');
  E.centro = null;
  E.fase = null;
  E.tVazio = 0;
  for (const o of Object.values(objCentro)) o.visible = false;
}

function acoesDisponiveis() {
  const lista = [];
  if (bloqueado() || J.acao) return lista;
  const p = J.pos;
  const perto = (x, z, r) => Math.hypot(p.x - x, p.z - z) < r;

  if (perto(POCO.x, POCO.z, 2.4) && E.poco >= 1) lista.push({ rotulo: `Tirar água do poço (${Math.floor(E.poco)})`, fn: tirarAgua });
  if (E.ato >= 2 && perto(0, 0, 3.0)) {
    if (!E.centro) lista.push({ rotulo: 'Escolher o que vai no Centro', fn: abrirMenuCentro });
    else lista.push({ rotulo: `Tirar ${NOMES[E.centro]} do Centro`, fn: tirarDoCentro });
  }
  for (const id of NPC_IDS) {
    if (E.agua > 0 && perto(DOCA[id].x, DOCA[id].z, 2.6)) lista.push({ rotulo: `Enviar água → ${npcs[id].nome}`, fn: () => enviarAgua(id) });
  }
  for (const id of NPC_IDS) {
    const q = npcs[id].fig.raiz.position;
    if (perto(q.x, q.z, 2.6)) lista.push({ rotulo: `Conversar com ${npcs[id].nome}`, fn: () => conversar(id) });
  }
  return lista;
}

// ====================================================================
// Roteiro
// ====================================================================
function intro() {
  E.ocupado = true;
  E.cam = { pos: V(5, 7, 15), alvo: V(0, 0.5, 0), vel: 0.8 };
  casa.racha = 0.75;
  depois(0.8, () => ui.dizer('Sua ilha estava se desfazendo.', { dur: 3.2 }));
  depois(4.2, () => {
    tween(mundo.marU.uFonte, 'value', 1.0, 1.6);
    tween(mundo.raiosU.uOp, 'value', 0.6, 1.6);
  });
  depois(5.2, () => {
    casa.alvoSaude = 1;
    tween(casa, 'racha', 0, 2.5);
    tween(amb, 'escuro', 0, 3.5);
    ui.dizer('…e alguma coisa, vinda de baixo, a restaurou.', { dur: 3.6 });
  });
  depois(9.2, () => {
    ui.dizer('Você ainda não tinha feito nada para merecer isso.', { dur: 3.6 });
    tween(mundo.marU.uFonte, 'value', 0.05, 3);
    tween(mundo.raiosU.uOp, 'value', 0, 3);
  });
  depois(13.2, () => {
    E.ocupado = false;
    E.cam = null;
    E.ato = 1;
    ui.mostrarHud();
    ui.desbloquear('amados');
    ui.dizer('Ande com WASD / setas, ou tocando no chão.', { dur: 4 });
    ui.dizer('O poço tem água. Leve-a até a borda, de frente para quem precisa.', { dur: 5 });
  });
}

function iniciarAto2() {
  E.ato = 2;
  E.tempoAto2 = 0;
  tween(matAnel, 'opacity', 0.85, 2);
  ui.dizer('No meio da sua ilha surgiu um Centro.', { dur: 3.5 });
  ui.dizer('O que você colocar ali vai sustentar, ou pesar sobre, todo o resto.', { dur: 5 });
}

function eventoFerro() {
  som.efeito('exigencia');
  E.ato = 3;
  E.ocupado = true;
  J.alvo = null;
  E.agua = 0;
  ui.setAgua(0);
  E.cam = { pos: V(-16, 11, 6), alvo: V(3, 0, 15), vel: 0.9 };
  const de = V(POCO.x, 0.8, POCO.z), para = V(D.ferro.x, 0.8, D.ferro.z);
  for (let k = 0; k < 5; k++) depois(0.6 + k * 0.3, () => lancarOrbe(de, para, '#4b3d5c'));
  E.poco = 0;
  depois(0.5, () => ui.dizer('Ferro desviou toda a água do seu poço para a ilha dele.', { dur: 4 }));
  depois(5, () => ui.dizer('Sua primeira vontade é revidar.', { dur: 3 }));
  depois(8.5, abrirCaverna);
}

/** Câmera que olha para `alvo` de `pos`, deslocando o alvo para o lado para que ele apareça à
 *  esquerda da tela (painel à direita) — ou no alto da tela, em telas estreitas (painel embaixo). */
function camComPainel(pos, alvo, desloc = 1.6) {
  const f = alvo.clone().sub(pos).normalize();
  const dir = new THREE.Vector3().crossVectors(f, V(0, 1, 0)).normalize();
  const estreita = innerWidth < 760;
  const olhar = alvo.clone();
  if (estreita) {
    // Tela em pé: o painel ocupa a metade de baixo. Afasta a câmera e sobe o alvo na tela, para o
    // personagem caber inteiro na metade de cima.
    pos = alvo.clone().add(pos.clone().sub(alvo).multiplyScalar(1.45));
    olhar.y -= 1.25;
  } else {
    olhar.addScaledVector(dir, desloc);
  }
  return { pos, alvo: olhar, vel: 1.6 };
}

function abrirCaverna() {
  ferroAbatido();
  const pf = npcs.ferro.fig.raiz.position;
  E.cam = camComPainel(V(pf.x - 2.6, pf.y + 1.7, pf.z - 3.4), V(pf.x, pf.y + 1.0, pf.z));
  F.olhar = V(pf.x - 0.4, 0, pf.z - 3.4);
  const cartas = [
    { ok: true, txt: 'Uma memória: a ilha de Ferro foi a primeira a secar, muitos anos atrás.' },
    { ok: false, txt: 'Um julgamento: “Ferro é mau. Sempre foi.”' },
    { ok: true, txt: 'Uma memória: ele pediu água às outras ilhas, e ninguém mandou.' },
    { ok: false, txt: 'Uma suposição: “Ele quer ver você cair.”' },
    { ok: true, txt: 'Um medo: “Se eu não pegar primeiro, vou secar de novo.”' },
  ];
  const p = ui.abrirOverlay(`
    <h2>Caverna do Outro Olho</h2>
    <p>Antes de responder, tente ver com os olhos de Ferro. Encontre os <b>3 fragmentos</b> que explicam o que ele fez.</p>
    <p class="nota">Entender não é desculpar. É enxergar a dor por trás do gesto.</p>
    <div class="cartas"></div>
    <p class="cav-msg"></p>
    <div class="cav-resp"></div>`, { fechavel: false, lateral: true });
  const box = p.querySelector('.cartas'), msg = p.querySelector('.cav-msg'), resp = p.querySelector('.cav-resp');
  let acertos = 0;
  for (const c of cartas) {
    const b = document.createElement('button');
    b.className = 'carta';
    b.textContent = c.txt;
    b.onclick = () => {
      if (b.disabled || acertos >= 3) return;
      if (c.ok) {
        b.classList.add('certa');
        b.disabled = true;
        acertos++;
        som.efeito('certa');
        msg.textContent = acertos < 3 ? 'Isso faz parte da história dele.' : '';
        if (acertos === 3) mostrarRespostas();
      } else {
        som.efeito('errada');
        b.classList.remove('errada'); void b.offsetWidth; b.classList.add('errada');
        msg.textContent = 'Isso é um julgamento sobre Ferro, não um pedaço da história dele.';
      }
    };
    box.appendChild(b);
  }
  function mostrarRespostas() {
    msg.innerHTML = 'Agora você vê: <i>quem mais tem medo de secar é quem mais segura a água.</i> Como você responde?';
    const ops = [
      ['Escutar', 'Você vai até a borda e só escuta. Ferro fala por muito tempo. No fim, diz baixinho: “Ninguém nunca tinha perguntado.”', 0.1],
      ['Oferecer', 'Você promete mandar a Ferro a primeira água que voltar ao seu poço. Ele não entende. Talvez nunca entenda. Mas a terra dele entende.', 0.2],
      ['Pôr um limite', 'Sem raiva, você fecha o canal: “Não vou deixar você tirar a água. Mas posso te dar.” Perdoar não é deixar alguém te ferir de novo.', 0.1],
    ];
    for (const [rot, texto, ganho] of ops) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = rot;
      b.onclick = () => {
        ilhas.ferro.alvoSaude = Math.min(1, ilhas.ferro.alvoSaude + ganho);
        resp.innerHTML = `
          <p class="resultado">${texto}</p>
          <p class="resultado"><b>Ferro:</b> “Quando a minha ilha secou… eu vi uma luz lá embaixo, debaixo da água. Achei que estava delirando.”</p>`;
        const seguir = document.createElement('button');
        seguir.className = 'btn primario';
        seguir.textContent = 'Olhar para baixo';
        seguir.onclick = () => { ui.fecharOverlay(true); revelacao(); };
        resp.appendChild(seguir);
      };
      resp.appendChild(b);
    }
  }
}

function revelacao() {
  ui.desbloquear('olho');
  som.efeito('revelacao');
  E.cam = { pos: V(-24, 7, 32), alvo: V(2, -1, 6), vel: 0.45 };
  tween(mundo.marU.uFonte, 'value', 0.85, 5);
  tween(mundo.raiosU.uOp, 'value', 0.6, 5);
  for (let i = 0; i < 4; i++) tween(mundo.marU.uForca.value, i, 0.8, 6);
  depois(1.5, () => ui.dizer('Debaixo de todas as ilhas, sempre correu uma Fonte.', { dur: 4.5 }));
  depois(6.5, () => ui.dizer('A água do seu poço nunca foi sua. Sempre veio daqui.', { dur: 4.5 }));
  depois(11.5, () => ui.dizer('Ninguém consegue guardar a Fonte. Só deixar que ela passe.', { dur: 4.5 }));
  depois(16.5, () => {
    tween(mundo.marU.uFonte, 'value', 0.45, 4);
    tween(mundo.raiosU.uOp, 'value', 0.12, 4);
    E.cam = null;
    E.ocupado = false;
    E.ato = 4;
    E.fonteLiberada = true;
    E.poco = 2;
    F.abatido = false; // Ferro se levanta junto com a revelação
    ui.desbloquear('fonte');
    ui.dizer('Agora a Fonte pode ocupar o centro da sua ilha. Você escolhe.', { dur: 5 });
  });
}

function final() {
  E.ato = 5;
  E.ocupado = true;
  E.finalFase = 1;
  J.alvo = null;
  salvar.apagarJogo(); // terminou: reabrir o jogo começa do início
  som.efeito('fonte');
  tween(mundo.marU.uFonte, 'value', 0.5, 6);
  tween(mundo.raiosU.uOp, 'value', 0.5, 6);
  for (let i = 0; i < 4; i++) tween(mundo.marU.uForca.value, i, 1.3, 6);

  // Parte 1: a câmera acompanha o Ferro atravessando a raiz que a generosidade do jogador fez crescer
  E.seguirFerro = true;
  F.aoChegar = finalParte2;
  depois(1.2, ferroAtravessa);
  depois(2, () => ui.dizer('Ferro está atravessando a raiz que a sua generosidade fez crescer.', { dur: 5 }));
  depois(8.5, () => ui.dizer('Ninguém o obrigou. Ele só viu que, agora, havia caminho.', { dur: 5 }));
  depois(45, () => { if (E.finalFase === 1) finalParte2(); }); // segurança: se algo travar, o final segue
}

/** Parte 2: a câmera sobe e mostra o mapa por baixo — todas as ilhas ligadas à mesma Fonte. */
function finalParte2() {
  if (E.finalFase !== 1) return;
  E.finalFase = 2;
  E.seguirFerro = false;
  E.cam = { pos: V(0, 72, 36), alvo: V(2, 0, 4), vel: 0.35 };
  enfeites.forEach((il, k) => depois(1 + k * 0.4, () => { il.alvoSaude = 1; }));
  depois(1.5, () => ui.dizer('Olhe o mapa por baixo.', { dur: 3.5 }));
  depois(6, () => ui.dizer('Todas as ilhas, até as que pareciam sozinhas, sempre estiveram ligadas à mesma Fonte.', { dur: 5.5 }));
  depois(12, () => ui.dizer('As ilhas mais bonitas não têm o seu nome.', { dur: 4 }));
  depois(16.5, () => ui.dizer('Nada disso foi seu. E por isso pôde ser de todos.', { dur: 5 }));
  depois(17, () => som.efeito('final'));
  depois(23, telaFinal);
}

function telaFinal() {
  E.fimMostrado = true;
  const p = ui.abrirOverlay(`
    <h2>Fim do capítulo 1</h2>
    <p>Obrigado por jogar <b>Raízes Cruzadas</b>. Se for jogar em grupo, o <a href="guia.html" target="_blank" rel="noopener">guia do educador</a> tem perguntas para esta conversa.</p>
    <h3>Para conversar</h3>
    <ul>
      <li>O que ficou no centro da sua ilha a maior parte do tempo? O que aconteceu com ela?</li>
      <li>Por que a Cisterna, o Espelho e a Lume pareciam boas escolhas no começo?</li>
      <li>Sua forma de dar mudou depois que você viu a Fonte?</li>
      <li>O que ocupa o centro da sua vida hoje?</li>
    </ul>
    <button class="btn" data-a="diario">📖 Abrir o Diário</button>
    <button class="btn primario" data-a="recomecar">Jogar de novo</button>`, { fechavel: false });
  p.querySelector('[data-a="diario"]').onclick = () => { ui.fecharOverlay(true); ui.abrirDiario(); };
  p.querySelector('[data-a="recomecar"]').onclick = () => location.reload();
}

// ====================================================================
// Lógica por quadro
// ====================================================================
function bloqueado() {
  return !E.iniciado || E.ocupado || ui.overlayAberto;
}

function atualizarCentro(dt) {
  let alvoSat = 1, alvoBrilho = 0;
  const c = E.centro;
  if (!c) {
    casa.alvoSaude = Math.max(0.5, casa.alvoSaude - dt * 0.004);
    casa.ouro = damp(casa.ouro, 0, 0.3, dt);
    E.tVazio += dt;
    if (E.tVazio > 25) umaVez('vazio', () => ui.dizer('Um centro vazio não fica vazio por muito tempo. Algo sempre acaba ocupando o lugar.', { dur: 5 }));
  } else if (c === 'fonte') {
    casa.alvoSaude = 1;
    alvoSat = 1.05;
    alvoBrilho = 0.08;
    casa.ouro = damp(casa.ouro, 1, 0.8, dt);
  } else {
    E.centroT += dt;
    const fase = E.centroT < 18 ? 'promessa' : E.centroT < 40 ? 'exigencia' : 'rachadura';
    if (fase !== E.fase) {
      E.fase = fase;
      som.efeito(fase === 'promessa' ? 'promessa' : fase === 'exigencia' ? 'exigencia' : 'rachadura');
      ui.dizer(TEXTO_FASE[c][fase], { dur: 5 });
      if (fase === 'rachadura') { E.chegouRachadura = true; ui.desbloquear('cisternas'); }
    }
    if (fase === 'promessa') {
      casa.alvoSaude = 1; alvoSat = 1.45; alvoBrilho = 0.16;
    } else if (fase === 'exigencia') {
      alvoSat = 1.15; alvoBrilho = 0.05;
      E.tExig += dt;
      if (E.tExig > 4) {
        E.tExig = 0;
        if (E.agua > 0) { E.agua--; ui.setAgua(E.agua); ui.flutuar('o centro pede mais', acima(J.pos)); }
        else casa.racha = Math.min(1, casa.racha + 0.05);
      }
    } else {
      alvoSat = 0.8;
      casa.racha = Math.min(1, casa.racha + dt * 0.03);
      casa.alvoSaude = Math.max(0.25, casa.alvoSaude - dt * 0.012);
      if (c === 'espelho') for (const id of NPC_IDS) ilhas[id].alvoSaude = Math.max(0.15, ilhas[id].alvoSaude - dt * 0.012); // as vizinhas secam de um jeito que dá para ver
    }
    if (c === 'espelho' && fase === 'promessa') {
      E.tAplauso += dt;
      if (E.tAplauso > 2.2) {
        E.tAplauso = 0;
        // Em volta do jogador: as ilhas vizinhas muitas vezes ficam fora da tela
        const lado = (Math.random() - 0.5) * 4.5;
        ui.flutuar(APLAUSOS[Math.floor(Math.random() * APLAUSOS.length)], acima(J.pos, 2.6).add(V(lado, Math.random() * 0.8, (Math.random() - 0.5) * 2)));
      }
    }
    if (c === 'lume' && fase !== 'promessa') {
      npcs.lume.cinza = Math.min(1, npcs.lume.cinza + dt * (fase === 'exigencia' ? 0.015 : 0.04));
      ilhas.lume.alvoSaude = Math.max(0.1, ilhas.lume.alvoSaude - dt * 0.01);
    }
  }
  if (c !== 'lume') npcs.lume.cinza = Math.max(0, npcs.lume.cinza - dt * 0.05);
  casa.sat = damp(casa.sat, alvoSat, 1.2, dt);
  casa.brilho = damp(casa.brilho, alvoBrilho, 1.2, dt);
}

function logica(dt) {
  // Poço: a água "vem de algum lugar" — o jogador só descobre de onde no Ato 3
  let taxa = 1 / 3.5, cap = 4;
  if (E.ato >= 2 && !E.centro) taxa = 1 / 6;
  if (E.centro === 'cisterna' && E.fase === 'promessa') { taxa = 1; cap = 10; }
  if (E.centro === 'fonte') { taxa = 1 / 1.2; cap = 6; }
  if (E.ato === 3) taxa = 0;
  E.poco = Math.min(cap, E.poco + taxa * dt);

  // Água parada apodrece
  const apodrecendo = E.centro === 'cisterna' && E.fase === 'rachadura';
  if (E.centro !== 'fonte' && (E.agua > 4 || (apodrecendo && E.agua > 0))) {
    E.tParada += dt;
    if (E.tParada > (apodrecendo ? 2 : 5)) {
      E.tParada = 0;
      E.agua--;
      ui.setAgua(E.agua);
      ui.flutuar('a água parou… e apodreceu', acima(J.pos));
      umaVez('apodrece', () => {
        ui.dizer('Água parada apodrece. Água só continua viva quando corre.', { dur: 4.5 });
        ui.desbloquear('agua');
      });
    }
  } else E.tParada = 0;

  if (E.ato >= 2) atualizarCentro(dt);

  if (E.ato === 2) {
    E.tempoAto2 += dt;
    if ((E.chegouRachadura && E.tempoAto2 > 55) || E.tempoAto2 > 130) eventoFerro();
  }

  if (E.ato === 4 && E.centro === 'fonte' && NPC_IDS.every((id) => ilhas[id].alvoSaude >= 0.8 && pontes[id].pronta)) final();

  // Raízes de luz no mar acompanham o que está no centro
  if (E.ato === 4) {
    NPC_IDS.forEach((id, i) => {
      const alvo = E.centro === 'fonte' ? (pontes[id].pronta ? 1 : 0.4) : 0.12;
      mundo.marU.uForca.value[i] = damp(mundo.marU.uForca.value[i], alvo, 1, dt);
    });
    mundo.marU.uForca.value[3] = damp(mundo.marU.uForca.value[3], E.centro === 'fonte' ? 0.5 : 0.1, 1, dt);
  }
}

// ====================================================================
// Movimento
// ====================================================================
const teclas = new Set();
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') { ui.fecharOverlay(); return; }
  teclas.add(e.code);
  if (bloqueado() || e.repeat) return;
  if (e.code === 'KeyE' || e.code === 'Digit1') ui.acionar(0);
  else if (/^Digit[2-5]$/.test(e.code)) ui.acionar(Number(e.code.slice(5)) - 1);
});
addEventListener('keyup', (e) => teclas.delete(e.code));
addEventListener('blur', () => teclas.clear());

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  if (bloqueado()) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const alvos = [...Object.values(ilhas).map((i) => i.terreno), ...NPC_IDS.filter((id) => pontes[id].pronta).map((id) => pontes[id].malha)];
  const hit = ray.intersectObjects(alvos, false)[0];
  if (hit) {
    J.alvo = hit.point.clone();
    marcaToque.position.set(hit.point.x, hit.point.y + 0.05, hit.point.z);
    marcaToque.material.opacity = 0.9;
  }
});

function chao(x, z) {
  for (const il of Object.values(ilhas)) {
    if (Math.hypot(x - il.centro.x, z - il.centro.z) < il.raio * 0.86) return 0.15;
  }
  for (const id of NPC_IDS) {
    if (!pontes[id].pronta) continue;
    const y = pontes[id].alturaEm(x, z);
    if (y !== null) return y;
  }
  return null;
}

function colisores() {
  const L = [{ x: 0, z: 0, r: 1.5 }, { x: POCO.x, z: POCO.z, r: 0.95 }];
  for (const il of Object.values(ilhas)) L.push(...il.colisores);
  for (const id of NPC_IDS) {
    const q = npcs[id].fig.raiz.position;
    if (!(id === 'lume' && E.centro === 'lume')) L.push({ x: q.x, z: q.z, r: 0.45 });
  }
  return L;
}

function tentar(x, z, cols) {
  if (chao(x, z) === null) return false;
  for (const c of cols) {
    const dNovo = Math.hypot(x - c.x, z - c.z);
    if (dNovo < c.r + 0.3 && dNovo < Math.hypot(J.pos.x - c.x, J.pos.z - c.z)) return false;
  }
  J.pos.x = x;
  J.pos.z = z;
  return true;
}

const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _d = new THREE.Vector3();
function moverJogador(dt) {
  J.andando = false;
  if (bloqueado() || J.acao) return;
  camera.getWorldDirection(_f);
  _f.y = 0; _f.normalize();
  _r.set(-_f.z, 0, _f.x);
  _d.set(0, 0, 0);
  if (teclas.has('KeyW') || teclas.has('ArrowUp')) _d.add(_f);
  if (teclas.has('KeyS') || teclas.has('ArrowDown')) _d.sub(_f);
  if (teclas.has('KeyD') || teclas.has('ArrowRight')) _d.add(_r);
  if (teclas.has('KeyA') || teclas.has('ArrowLeft')) _d.sub(_r);
  if (_d.lengthSq() > 0) J.alvo = null;
  else if (J.alvo) {
    _d.set(J.alvo.x - J.pos.x, 0, J.alvo.z - J.pos.z);
    if (_d.length() < 0.25) { J.alvo = null; _d.set(0, 0, 0); }
  }
  if (_d.lengthSq() === 0) return;
  _d.normalize();
  const passo = 4.5 * dt;
  const cols = colisores();
  // Tenta a direção desejada e, se houver obstáculo, desvia aos poucos para os lados
  let ang = Math.atan2(_d.x, _d.z), ok = false;
  for (const desvio of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
    const a = ang + desvio;
    if (tentar(J.pos.x + Math.sin(a) * passo, J.pos.z + Math.cos(a) * passo, cols)) { ang = a; ok = true; break; }
  }
  if (!ok) { J.alvo = null; return; }
  J.andando = true;
  J.dir = dampAngulo(J.dir, ang, 12, dt);
}

// ====================================================================
// Câmera
// ====================================================================
const camAlvo = new THREE.Vector3(), camOlhar = new THREE.Vector3(), olharAtual = V(0, 0, 0);
const _pf = new THREE.Vector3();
function atualizarCamera(dt) {
  let vel;
  if (E.seguirFerro) {
    // De lado e um pouco acima, olhando o Ferro (e a ponte em arco) andar
    _pf.copy(npcs.ferro.fig.raiz.position);
    camAlvo.set(_pf.x - 8, _pf.y + 4.2, _pf.z + 2.5);
    camOlhar.set(_pf.x, _pf.y + 1.0, _pf.z);
    vel = 2.2;
  } else if (E.cam) {
    camAlvo.copy(E.cam.pos);
    camOlhar.copy(E.cam.alvo);
    vel = E.cam.vel ?? 1.2;
  } else {
    camAlvo.set(J.pos.x, J.pos.y + 9.5, J.pos.z + 12);
    camOlhar.set(J.pos.x, J.pos.y + 0.8, J.pos.z);
    vel = 3.5;
  }
  camera.position.lerp(camAlvo, 1 - Math.exp(-vel * dt));
  olharAtual.lerp(camOlhar, 1 - Math.exp(-vel * 1.3 * dt));
  camera.lookAt(olharAtual);
}

function objetivo() {
  if (bloqueado()) return null;
  const pPoco = V(POCO.x, 2.4, POCO.z);
  if (E.ato === 1) return E.agua > 0 ? acima(DOCA.salvia, 1.6) : pPoco;
  if (E.ato === 2 && E.idolos.size === 0) return V(0, 2.2, 0);
  if (E.ato === 4 && E.centro !== 'fonte') return V(0, 2.2, 0);
  return null;
}

// ====================================================================
// Salvar e continuar
// ====================================================================
const IDS_ILHAS = ['casa', ...NPC_IDS];

/** O jogo só é salvo em momentos calmos: nunca no meio de uma cena (Ferro, final) ou de um gesto. */
function podeSalvar() {
  return E.iniciado && E.ato >= 1 && E.ato <= 4 && !E.ocupado && !J.acao && !E.finalFase;
}

function coletarEstado() {
  return {
    ato: E.ato, agua: E.agua, poco: E.poco, centro: E.centro, centroT: E.centroT, fase: E.fase,
    idolos: [...E.idolos], chegouRachadura: E.chegouRachadura, tempoAto2: E.tempoAto2,
    fonteLiberada: E.fonteLiberada, doacoes: E.doacoes, avisos: [...E.avisos], tVazio: E.tVazio,
    saude: Object.fromEntries(IDS_ILHAS.map((id) => [id, [ilhas[id].saude, ilhas[id].alvoSaude]])),
    pontes: Object.fromEntries(NPC_IDS.map((id) => [id, [pontes[id].prog, pontes[id].crescendo]])),
    racha: casa.racha, lumeCinza: npcs.lume.cinza,
    jogador: [J.pos.x, J.pos.z, J.dir],
    diario: ui.diarioIds(),
  };
}

function aplicarEstado(s) {
  Object.assign(E, {
    iniciado: true, ocupado: false, cam: null, ato: s.ato,
    agua: s.agua, poco: s.poco, centro: s.centro, centroT: s.centroT, fase: s.fase,
    chegouRachadura: s.chegouRachadura, fonteLiberada: s.fonteLiberada, doacoes: s.doacoes,
    // Se o jogador parou logo antes da cena do Ferro, ela volta daqui a uns segundos (não de repente)
    tempoAto2: s.chegouRachadura ? Math.min(s.tempoAto2, 45) : s.tempoAto2,
    tVazio: s.tVazio ?? 0, tExig: 0, tParada: 0,
    idolos: new Set(s.idolos), avisos: new Set(s.avisos),
  });
  for (const id of IDS_ILHAS) ilhas[id].definirSaude(...s.saude[id]);
  casa.racha = s.racha;
  casa.ouro = s.centro === 'fonte' ? 1 : 0;
  for (const id of NPC_IDS) pontes[id].restaurar(...s.pontes[id]);
  npcs.lume.cinza = s.lumeCinza ?? 0;
  J.pos.set(s.jogador[0], 0.15, s.jogador[1]);
  J.dir = s.jogador[2];
  amb.escuro = 0;
  mundo.marU.uFonte.value = s.ato >= 4 ? 0.45 : 0.05;
  mundo.raiosU.uOp.value = s.ato >= 4 ? 0.12 : 0;
  matAnel.opacity = s.ato >= 2 ? 0.85 : 0;
  for (const [k, o] of Object.entries(objCentro)) o.visible = k === s.centro;
  if (s.centro === 'lume') npcs.lume.fig.raiz.position.set(0, CENTRO.topo, 0);
  ui.restaurarDiario(s.diario);
  ui.setAgua(E.agua);
  ui.mostrarHud();
  // A câmera já começa no lugar certo, sem voar do alto até o jogador
  camera.position.set(J.pos.x, J.pos.y + 9.5, J.pos.z + 12);
  olharAtual.set(J.pos.x, J.pos.y + 0.8, J.pos.z);
}

let tSalva = 0;
function salvarSeDerPara() {
  if (podeSalvar()) salvar.gravarJogo(coletarEstado());
}
addEventListener('pagehide', salvarSeDerPara);
document.addEventListener('visibilitychange', () => { if (document.hidden) salvarSeDerPara(); });

// ====================================================================
// Tela inicial: carregamento, começar, continuar
// ====================================================================
const NOMES_ATO = { 1: 'Água que corre', 2: 'O Centro', 3: 'O que corre embaixo', 4: 'A Fonte no centro' };
const elInicio = document.getElementById('inicio');
const btnComecar = document.getElementById('btnComecar');
const btnContinuar = document.getElementById('btnContinuar');
const jogoSalvo = salvar.lerJogo();

function esconderInicio() { elInicio.classList.add('hidden'); som.iniciar(); }

function comecarNovo() {
  salvar.apagarJogo();
  esconderInicio();
  E.iniciado = true;
  intro();
}
function continuarJogo() {
  const s = salvar.lerJogo();
  if (!s) { comecarNovo(); return; }
  esconderInicio();
  aplicarEstado(s);
  ui.dizer('Bem-vindo de volta. Sua ilha estava como você deixou.', { dur: 4 });
}
btnComecar.onclick = comecarNovo;
btnContinuar.onclick = continuarJogo;

if (jogoSalvo) {
  const min = Math.max(1, Math.round((Date.now() - jogoSalvo.quando) / 60000));
  const info = document.getElementById('salvoInfo');
  info.textContent = `Jogo salvo: ${NOMES_ATO[jogoSalvo.ato] ?? 'capítulo 1'} · há ${min < 60 ? `${min} min` : `${Math.round(min / 60)} h`}`;
  info.classList.remove('hidden');
  btnContinuar.classList.remove('hidden');
  btnComecar.textContent = 'Novo jogo';
  btnComecar.classList.remove('primario');
  btnComecar.classList.add('secundario');
}

let liberado = false;
function liberarBotoes(mensagem) {
  if (liberado) return;
  liberado = true;
  btnComecar.disabled = false;
  btnContinuar.disabled = false;
  document.getElementById('cargaTexto').textContent = mensagem;
  setTimeout(() => document.getElementById('carga').classList.add('hidden'), 1400);
}
carga.aoMudar(({ total, feitos, falhas }) => {
  document.getElementById('cargaBarra').style.width = `${total ? (feitos / total) * 100 : 0}%`;
  if (feitos < total) {
    document.getElementById('cargaTexto').textContent = `Carregando o mundo… ${feitos}/${total}`;
  } else {
    liberarBotoes(falhas ? 'Pronto (alguns modelos não carregaram; usaremos figuras simples).' : 'Tudo pronto.');
  }
});
// Conexão lenta demais: deixa começar mesmo assim; o que faltar chega depois
setTimeout(() => liberarBotoes('Algumas partes ainda estão chegando. Você já pode começar.'), 30000);

// Ajustes e som
ajustes.aplicar();
document.getElementById('btnAjustes').onclick = () => ajustes.abrir({ aoReiniciar: () => { salvar.apagarJogo(); location.reload(); } });
document.getElementById('btnSom').onclick = () => ajustes.alternarSom();

// ====================================================================
// Laço principal
// ====================================================================
// Modo de teste (só com ?debug na URL): expõe o estado para inspeção no console.
if (new URLSearchParams(location.search).has('debug')) {
  window.rc = {
    E, J, ilhas, pontes, npcs, mundo, F, S, L, ui, som, salvar, carga, DOCA, POCO, D, objCentro,
    eventoFerro, revelacao, final, enviarAgua, tirarAgua, colocarNoCentro, tirarDoCentro, conversar,
    coletarEstado, aplicarEstado, salvarSeDerPara, podeSalvar, comecarNovo, continuarJogo,
    get jog() { return jog; }, get CENTRO() { return CENTRO; },
  };
  // ?debug&teste=<nome> roda um teste automático (ver src/teste-auto.js). O jogo normal nunca o baixa.
  const nomeTeste = new URLSearchParams(location.search).get('teste');
  if (nomeTeste) import('./teste-auto.js').then((m) => m.iniciarTestes(window.rc, nomeTeste));
}

const relogio = new THREE.Clock();
let t = 0, tClima = 0;
function quadro() {
  requestAnimationFrame(quadro);
  const dt = Math.min(relogio.getDelta(), 0.05);
  t += dt;

  if (!ui.overlayAberto) {
    atualizarAgenda(dt);
    if (E.iniciado) logica(dt);
  }
  E.frames = (E.frames ?? 0) + 1;
  tSalva += dt;
  if (tSalva >= 3) { tSalva = 0; salvarSeDerPara(); }
  tClima += dt;
  if (tClima >= 0.8) {
    tClima = 0;
    som.clima({
      escuro: amb.escuro,
      fonte: E.centro === 'fonte' ? 1 : E.ato >= 4 ? 0.4 : 0,
      tensao: E.fase === 'rachadura' ? 1 : E.fase === 'exigencia' ? 0.5 : 0,
    });
  }
  atualizarTweens(dt);
  // Depois do fim, fechar o Diário devolve a tela final (com "Jogar de novo")
  if (E.fimMostrado && !ui.overlayAberto) telaFinal();
  moverJogador(dt);
  ui.setAcoes(acoesDisponiveis());

  for (const il of todas) il.update(dt);
  // A árvore-mãe seca com a ilha: saúde 1 → cor plena; saúde 0 → quase sem cor
  const cinzaArvore = Math.min(1, Math.max(0, 1 - casa.saude)) * 0.85;
  for (const mt of arvoreMae.mats) mt.userData.uCinza.value = cinzaArvore;
  for (const id of NPC_IDS) pontes[id].update(dt);
  atualizarOrbes(dt);

  // Jogador
  J.pos.y = damp(J.pos.y, chao(J.pos.x, J.pos.z) ?? J.pos.y, 12, dt);
  jog.raiz.position.copy(J.pos);
  jog.raiz.rotation.y = J.dir;
  if (jog.animado) {
    atualizarGesto(dt);
    if (!J.acao) jog.tocar(J.andando ? 'andar' : 'idle', { fade: 0.2 });
    jog.update(dt);
  } else {
    animarFigura(jog, t, J.andando);
  }

  // NPCs
  for (const id of NPC_IDS) {
    const n = npcs[id];
    if (n.fig.animado) {
      if (id === 'lume') comportamentoLume(dt);
      if (id === 'salvia') comportamentoSalvia(dt);
      if (id === 'ferro') comportamentoFerro(dt);
      n.fig.update(dt);
    } else {
      animarFigura(n.fig, t + id.length, false);
    }
    n.fig.setCinza(n.cinza);
    ui.posicionarRotulo(n.rotulo, acima(n.fig.raiz.position, n.fig.alturaRotulo ?? 1.9 * n.fig.escala + 0.25));
  }

  // Objetos do Centro e do poço
  if (objCentro.espelho.userData.modelo) objCentro.espelho.userData.modelo.rotation.y = -Math.PI / 2 + Math.sin(t * 0.5) * 0.5;
  else if (objCentro.espelho.userData.gira) objCentro.espelho.userData.gira.rotation.z = t * 0.6;
  objCentro.fonte.userData.coluna.material.opacity = 0.14 + Math.sin(t * 2) * 0.04;
  objCentro.fonte.userData.nucleo.rotation.y = t;
  objCentro.fonte.userData.nucleo.position.y = 0.9 + Math.sin(t * 1.5) * 0.12;
  anelCentro.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
  const capVisual = E.centro === 'cisterna' ? 10 : E.centro === 'fonte' ? 6 : 4;
  aguaPoco.position.y = POCO_AGUA.y0 + (POCO_AGUA.y1 - POCO_AGUA.y0) * Math.min(1, E.poco / capVisual);
  matAguaPoco.emissiveIntensity = E.centro === 'fonte' ? 1.4 : 0.4;

  // Marcadores
  const obj = objetivo();
  marcador.visible = !!obj;
  if (obj) {
    marcador.position.set(obj.x, obj.y + Math.sin(t * 3) * 0.15, obj.z);
    marcador.rotation.y = t * 2;
  }
  marcaToque.material.opacity = Math.max(0, marcaToque.material.opacity - dt * 1.5);

  mundo.aplicarEscuro(amb.escuro);
  atualizarCamera(dt);
  mundo.update(dt, t);
  ui.update(dt);
  mundo.composer.render();
}
quadro();
