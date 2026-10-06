// Personagens animados (Tripo → Mixamo → GLB). Devolve um objeto com a mesma "cara" da figura
// provisória (raiz, setCinza), mais tocar(clipe) e update(dt).
// Lições aplicadas (ver docs/personagens/lume.md e a skill de animação):
//  - tamanho e apoio no chão medidos pelos OSSOS, nunca por Box3 (erra em SkinnedMesh);
//  - frustumCulled = false (a esfera da bind pose não acompanha a animação);
//  - a escala 0,01 do Armature do Mixamo fica no arquivo; quem normaliza é este código.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const _p = new THREE.Vector3();

/** Injeta no material um controle 0..1 que tira a cor da textura (usado na Lume como ídolo). */
function prepararCinza(mat) {
  mat.userData.uCinza = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCinza = mat.userData.uCinza;
    sh.fragmentShader = 'uniform float uCinza;\n' + sh.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       float lumC = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
       diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lumC) * 0.7, uCinza);`,
    );
  };
  mat.needsUpdate = true;
}

export function carregarPersonagem(url, { altura = 1 } = {}) {
  return new Promise((resolver, rejeitar) => {
    new GLTFLoader().load(url, (gltf) => {
      const modelo = gltf.scene;
      const raiz = new THREE.Group();
      raiz.add(modelo);
      const ossos = [], pes = [], mats = [];
      modelo.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.frustumCulled = false;
          o.material.flatShading = true; // facetas low-poly, aprovadas na inspeção
          prepararCinza(o.material);
          mats.push(o.material);
        }
        if (o.isBone) {
          ossos.push(o);
          if (/Foot|Toe/i.test(o.name)) pes.push(o);
        }
      });
      if (!pes.length) {
        rejeitar(new Error(`${url}: nenhum osso de pé encontrado para medir`));
        return;
      }

      const mixer = new THREE.AnimationMixer(modelo);
      const clipes = Object.fromEntries(gltf.animations.map((c) => [c.name, c]));
      const inicial = clipes.idle ?? gltf.animations[0];
      let atual = inicial ? mixer.clipAction(inicial) : null;
      atual?.play();
      mixer.update(0);

      // Mede na pose inicial, com a raiz na origem (mundo = local)
      const medir = () => {
        raiz.updateMatrixWorld(true);
        let topo = -Infinity, pe = Infinity;
        for (const b of ossos) { b.getWorldPosition(_p); topo = Math.max(topo, _p.y); }
        for (const b of pes) { b.getWorldPosition(_p); pe = Math.min(pe, _p.y); }
        return { topo, pe };
      };
      let m = medir();
      modelo.scale.multiplyScalar(altura / (m.topo - m.pe));
      m = medir();
      modelo.position.y -= m.pe;

      resolver({
        raiz,
        animado: true,
        alturaRotulo: altura + 0.35,
        /**
         * Toca um clipe. Em laço por padrão. Com `janela` ([ini, fim] em frações do clipe) e
         * `duracao` (segundos no jogo), toca só esse trecho, uma vez, esticado para a duração —
         * clipes de mocap são mais longos e teatrais que as ações do jogo.
         */
        tocar(nome, { fade = 0.3, janela = null, duracao = null } = {}) {
          const clip = clipes[nome];
          if (!clip) return;
          const acao = mixer.clipAction(clip);
          if (acao === atual && !janela) return;
          acao.reset();
          if (janela) {
            const [ini, fim] = janela;
            acao.setLoop(THREE.LoopOnce, 1);
            acao.clampWhenFinished = true;
            acao.timeScale = ((fim - ini) * clip.duration) / duracao;
            acao.time = clip.duration * ini; // reset() zera o tempo: reposicionar DEPOIS
          } else {
            acao.setLoop(THREE.LoopRepeat, Infinity);
            acao.timeScale = 1;
          }
          acao.play();
          if (atual && atual !== acao) atual.crossFadeTo(acao, fade, false);
          atual = acao;
        },
        /** Posição de um osso no mundo (ex.: a mão que solta a água). */
        posicaoOsso(regex, alvo) {
          const osso = ossos.find((b) => regex.test(b.name));
          return osso ? osso.getWorldPosition(alvo) : null;
        },
        update(dt) { mixer.update(dt); },
        setCinza(k) { for (const mt of mats) mt.userData.uCinza.value = k; },
      });
    }, undefined, rejeitar);
  });
}
