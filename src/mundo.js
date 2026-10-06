// O "palco": renderer, céu, mar (com a Fonte escondida por baixo), luz, partículas e bloom.
// Toda a beleza daqui é código — não gasta crédito nenhum do Tripo.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const NIVEL_MAR = -1.0;
const DIR_SOL = new THREE.Vector3(0.69, 0.5, -0.52).normalize();
const NEVOA = new THREE.Color('#f3d3ae');
const NEVOA_ESCURA = new THREE.Color('#151c2b');

export function criarMundo(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NEVOA.clone(), 45, 160);

  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 1200);
  camera.position.set(0, 30, 44);

  // ---------- Céu (gradiente + sol) ----------
  const ceuU = {
    uTopo: { value: new THREE.Color('#68aee0') },
    uHorizonte: { value: new THREE.Color('#ffd9ac') },
    uSol: { value: DIR_SOL },
    uEscuro: { value: 0 },
  };
  const ceu = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: ceuU,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTopo, uHorizonte, uSol; uniform float uEscuro; varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y * 1.6, 0.0, 1.0);
          vec3 c = mix(uHorizonte, uTopo, pow(h, 0.7));
          float s = max(dot(normalize(vDir), uSol), 0.0);
          c += vec3(1.0, 0.85, 0.6) * pow(s, 60.0) * 1.4 + vec3(1.0, 0.8, 0.5) * pow(s, 5.0) * 0.25;
          c = mix(c, c * 0.18 + vec3(0.02, 0.03, 0.06), uEscuro);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(ceu);

  // ---------- Luz ----------
  const hemi = new THREE.HemisphereLight('#d2ecff', '#e6b98e', 1.1);
  scene.add(hemi);
  const sol = new THREE.DirectionalLight('#fff0d6', 2.4);
  sol.position.copy(DIR_SOL).multiplyScalar(60);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  scene.add(sol);

  // ---------- Mar com a Fonte por baixo ----------
  const marU = {
    uTempo: { value: 0 },
    uFonte: { value: 0 },      // 0 = Fonte escondida · 1 = Fonte revelada
    uEscuro: { value: 0 },
    uSegA: { value: [0, 1, 2, 3].map(() => new THREE.Vector2()) },
    uSegB: { value: [0, 1, 2, 3].map(() => new THREE.Vector2()) },
    uForca: { value: [0, 0, 0, 0] }, // raízes de luz entre as ilhas
    uCorRaso: { value: new THREE.Color('#3aa9c9') },
    uCorFundo: { value: new THREE.Color('#145583') },
    uCorFonte: { value: new THREE.Color('#c9fbff') },
    uNevoa: { value: scene.fog.color },
    uCam: { value: camera.position },
    uSol: { value: DIR_SOL },
  };
  const geoMar = new THREE.PlaneGeometry(700, 700, 180, 180);
  geoMar.rotateX(-Math.PI / 2);
  const mar = new THREE.Mesh(geoMar, new THREE.ShaderMaterial({
    uniforms: marU,
    vertexShader: /* glsl */`
      uniform float uTempo; varying vec3 vMundo;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += sin(w.x * 0.18 + uTempo * 0.9) * 0.32 + cos(w.z * 0.22 + uTempo * 0.7) * 0.28
             + sin((w.x + w.z) * 0.4 + uTempo * 1.6) * 0.1;
        vMundo = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTempo, uFonte, uEscuro;
      uniform vec2 uSegA[4]; uniform vec2 uSegB[4]; uniform float uForca[4];
      uniform vec3 uCorRaso, uCorFundo, uCorFonte, uNevoa, uCam, uSol;
      varying vec3 vMundo;
      float dseg(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
        return length(pa - ba * h);
      }
      void main() {
        // normal por facetas = visual low-poly
        vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo)));
        if (n.y < 0.0) n = -n;
        vec3 V = normalize(uCam - vMundo);
        float dif = max(dot(n, uSol), 0.0);
        vec3 c = mix(uCorFundo, uCorRaso, 0.35 + 0.65 * dif);
        float fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
        c = mix(c, uNevoa, fres * 0.55);
        c += vec3(1.0, 0.92, 0.78) * pow(max(dot(reflect(-uSol, n), V), 0.0), 60.0) * 1.4;

        // A Fonte: luz que sobe de baixo, e raízes de luz ligando as ilhas
        vec2 p = vMundo.xz;
        float caust = pow(abs(sin(p.x * 0.35 + uTempo * 0.6 + sin(p.y * 0.25)) * sin(p.y * 0.32 - uTempo * 0.5 + sin(p.x * 0.2))), 3.0);
        float raiz = 0.0;
        for (int i = 0; i < 4; i++) {
          float d = dseg(p, uSegA[i], uSegB[i]);
          float pulso = 0.6 + 0.4 * sin(uTempo * 2.2 - length(p - uSegA[i]) * 0.35);
          raiz += uForca[i] * exp(-d * d * 0.18) * pulso;
        }
        c += uCorFonte * (uFonte * (0.16 + caust * 0.55) + raiz * (0.45 + uFonte * 0.8));

        c = mix(c, c * 0.2, uEscuro);
        float dist = length(vMundo - uCam);
        c = mix(c, uNevoa, smoothstep(45.0, 160.0, dist));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  mar.position.y = NIVEL_MAR;
  scene.add(mar);

  // ---------- Colunas de luz da Fonte ----------
  const raiosU = { uOp: { value: 0 }, uTempo: marU.uTempo, uCor: { value: new THREE.Color('#d8fdff') } };
  const matRaio = new THREE.ShaderMaterial({
    uniforms: raiosU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uOp, uTempo; uniform vec3 uCor; varying vec2 vUv;
      void main() {
        float a = pow(1.0 - vUv.y, 3.2) * (0.55 + 0.45 * sin(vUv.x * 50.0 + uTempo * 1.5));
        gl_FragColor = vec4(uCor * a * uOp * 0.28, 1.0);
      }`,
  });
  function adicionarRaio(x, z, r) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.25, 24, 20, 1, true), matRaio);
    m.position.set(x, NIVEL_MAR + 12, z);
    m.renderOrder = 2;
    scene.add(m);
  }

  // ---------- Partículas de luz (pólen / vaga-lumes) ----------
  const tex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.5)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const N = 320, pts = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pts[i * 3] = (Math.random() - 0.5) * 130;
    pts[i * 3 + 1] = Math.random() * 12 + 0.5;
    pts[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  const geoP = new THREE.BufferGeometry();
  geoP.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const motes = new THREE.Points(geoP, new THREE.PointsMaterial({
    size: 0.32, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    color: new THREE.Color('#ffe2a8').multiplyScalar(1.6),
  }));
  scene.add(motes);

  // ---------- Pós-processamento ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.65, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  /** escuro: 0 = dia luminoso · 1 = ilha se desfazendo no escuro */
  function aplicarEscuro(k) {
    ceuU.uEscuro.value = k;
    marU.uEscuro.value = k;
    scene.fog.color.copy(NEVOA).lerp(NEVOA_ESCURA, k);
    sol.intensity = 2.4 * (1 - 0.8 * k);
    hemi.intensity = 1.1 * (1 - 0.65 * k);
  }

  function update(dt, t) {
    marU.uTempo.value = t;
    ceu.position.copy(camera.position);
    motes.rotation.y = t * 0.012;
    motes.position.y = Math.sin(t * 0.35) * 0.4;
  }

  return { renderer, scene, camera, composer, marU, raiosU, adicionarRaio, aplicarEscuro, update };
}
