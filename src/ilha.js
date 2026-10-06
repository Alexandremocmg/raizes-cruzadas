// Ilhas procedurais low-poly e as pontes de raiz entre elas.
// Cada ilha tem um estado visual contínuo: saúde (viva ↔ seca), saturação (o "brilho falso"
// do ídolo), rachaduras e ouro (rachaduras que viram veios de luz quando a Fonte está no centro).
// Os estados NÃO são modelos diferentes: é a mesma malha recolorida — mais barato e coerente.
import * as THREE from 'three';
import { rng, lerp, clamp, damp, smooth } from './util.js';

const hex = (h) => new THREE.Color(h);
const GRAMA = ['#8fd36c', '#9fdc74', '#7fc865', '#a9e07c'].map(hex);
const TERRA = hex('#e3ad6e');
const ROCHA = ['#d2a07a', '#bb8b6c', '#a07462', '#8a6558'].map(hex);
const SECA_GRAMA = hex('#bfae88');
const SECA_TERRA = hex('#a08e74');
const SECA_ROCHA = hex('#76695f');
const FOLHAS = ['#6cc35a', '#86d164', '#4fae5c'].map(hex);
const FOLHA_SECA = hex('#a8875a');
const FLORES = ['#ff9ec4', '#fff3c4', '#ffd166', '#c9a7ff'].map(hex);
const RACHA = hex('#3a2a22');
const OURO = hex('#ffc861');

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3();
const _m = new THREE.Object3D();

const matTronco = new THREE.MeshStandardMaterial({ color: '#9a6a4f', flatShading: true, roughness: 0.9 });
const matPedra = new THREE.MeshStandardMaterial({ color: '#c9b7a3', flatShading: true, roughness: 0.9 });
const geoDetrito = new THREE.DodecahedronGeometry(0.22, 0);
const matDetrito = new THREE.MeshStandardMaterial({ color: '#8a6558', flatShading: true });

function criarArvore(r, matFolha) {
  const g = new THREE.Group();
  const h = 0.9 + r() * 0.5;
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, h, 5), matTronco);
  tronco.position.y = h / 2;
  g.add(tronco);
  if (r() < 0.5) {
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.85 - k * 0.2, 1.0, 6), matFolha);
      c.position.y = h + 0.25 + k * 0.55;
      c.rotation.y = r() * 3;
      g.add(c);
    }
  } else {
    const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), matFolha);
    a.position.y = h + 0.55;
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), matFolha);
    b.position.set(0.45, h + 0.25, 0.2);
    g.add(a, b);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export class Ilha {
  constructor({ nome = '', x, z, raio, seed, saude = 1, livre = [] }) {
    this.nome = nome;
    this.raio = raio;
    this.centro = new THREE.Vector3(x, 0, z);
    this.saude = saude;
    this.alvoSaude = saude;
    this.sat = 1;
    this.brilho = 0;
    this.racha = 0;
    this.ouro = 0;
    this.livre = livre;
    this.colisores = [];
    this.detritos = [];
    this.group = new THREE.Group();
    this.group.position.copy(this.centro);
    const r = rng(seed);
    this._terreno(r);
    this._decoracao(r);
    this._rachaduras(r);
    this._estado = '';
    this._aplicar(true);
  }

  /** Ponto na borda desta ilha voltado para outra (em coordenadas do mundo). */
  docaPara(outra) {
    const d = _a.subVectors(outra.centro, this.centro).setY(0).normalize();
    return new THREE.Vector3(this.centro.x + d.x * this.raio * 0.8, 0.15, this.centro.z + d.z * this.raio * 0.8);
  }

  _terreno(r) {
    const R = this.raio, aneis = 4, seg = Math.max(12, Math.round(R * 2.6));
    const pos = [], base = [], seca = [];
    const tri = (a, b, c, cor, corSeca, ref) => {
      _a.subVectors(b, a); _b.subVectors(c, a); _n.crossVectors(_a, _b);
      if (_n.dot(ref) < 0) { const t = b; b = c; c = t; }
      for (const p of [a, b, c]) {
        pos.push(p.x, p.y, p.z);
        base.push(cor.r, cor.g, cor.b);
        seca.push(corSeca.r, corSeca.g, corSeca.b);
      }
    };
    const cima = new THREE.Vector3(0, 1, 0);
    const fora = (p, q) => new THREE.Vector3(p.x + q.x, 0, p.z + q.z).normalize();
    const corGrama = () => GRAMA[Math.floor(r() * GRAMA.length)];

    // Topo: anéis concêntricos com leve irregularidade
    const centro = new THREE.Vector3(0, 0.16, 0);
    const aneisPts = [];
    for (let i = 1; i <= aneis; i++) {
      const ring = [];
      const borda = i === aneis;
      for (let j = 0; j < seg; j++) {
        const ang = (j / seg) * Math.PI * 2 + (i % 2) * (Math.PI / seg);
        const rad = R * (i / aneis) * (borda ? 0.9 + r() * 0.16 : 0.92 + r() * 0.14);
        const y = borda ? -0.02 - r() * 0.1 : 0.1 + r() * 0.08;
        ring.push(new THREE.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad));
      }
      aneisPts.push(ring);
    }
    for (let j = 0; j < seg; j++) {
      const r0 = aneisPts[0];
      tri(centro, r0[j], r0[(j + 1) % seg], corGrama(), SECA_GRAMA, cima);
    }
    for (let i = 0; i < aneis - 1; i++) {
      const A = aneisPts[i], B = aneisPts[i + 1];
      for (let j = 0; j < seg; j++) {
        const j1 = (j + 1) % seg;
        tri(A[j], B[j], B[j1], corGrama(), SECA_GRAMA, cima);
        tri(A[j], B[j1], A[j1], corGrama(), SECA_GRAMA, cima);
      }
    }

    // Penhasco e base que afunila para baixo
    const borda = aneisPts[aneis - 1];
    const niveis = [
      { y: -0.7, f: 0.98, cor: () => TERRA, seca: SECA_TERRA },
      { y: -2.0, f: 0.82, cor: () => ROCHA[Math.floor(r() * 2)], seca: SECA_ROCHA },
      { y: -3.6, f: 0.56, cor: () => ROCHA[1 + Math.floor(r() * 2)], seca: SECA_ROCHA },
      { y: -5.0 - R * 0.25, f: 0.26, cor: () => ROCHA[2 + Math.floor(r() * 2)], seca: SECA_ROCHA },
    ];
    let anterior = borda;
    for (const nv of niveis) {
      const ring = borda.map((p) => {
        const ang = Math.atan2(p.z, p.x) + (r() - 0.5) * 0.15;
        const rad = Math.hypot(p.x, p.z) * nv.f * (0.92 + r() * 0.16);
        return new THREE.Vector3(Math.cos(ang) * rad, nv.y + (r() - 0.5) * 0.4, Math.sin(ang) * rad);
      });
      for (let j = 0; j < seg; j++) {
        const j1 = (j + 1) % seg;
        const ref = fora(anterior[j], anterior[j1]);
        tri(anterior[j], ring[j], ring[j1], nv.cor(), nv.seca, ref);
        tri(anterior[j], ring[j1], anterior[j1], nv.cor(), nv.seca, ref);
      }
      anterior = ring;
    }
    const ponta = new THREE.Vector3((r() - 0.5) * 0.5, -6.5 - R * 0.45, (r() - 0.5) * 0.5);
    for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg;
      tri(anterior[j], ponta, anterior[j1], ROCHA[3], SECA_ROCHA, fora(anterior[j], anterior[j1]));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(base.slice(), 3));
    geo.computeVertexNormals();
    this.geo = geo;
    this.base = Float32Array.from(base);
    this.seca = Float32Array.from(seca);
    this.terreno = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 }));
    this.terreno.receiveShadow = true;
    this.group.add(this.terreno);
  }

  _livre(x, z, folga) {
    return this.livre.every((l) => Math.hypot(x - l.x, z - l.z) > l.r + folga);
  }

  _decoracao(r) {
    const R = this.raio;
    this.matsFolha = FOLHAS.map((c) => new THREE.MeshStandardMaterial({ color: c.clone(), flatShading: true, roughness: 0.85 }));
    this.arvores = [];
    const nArv = Math.round(R * 0.9);
    for (let tent = 0; this.arvores.length < nArv && tent < 300; tent++) {
      const ang = r() * Math.PI * 2, rad = R * (0.3 + r() * 0.48);
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (!this._livre(x, z, 1.0)) continue;
      if (this.arvores.some((a) => Math.hypot(a.position.x - x, a.position.z - z) < 1.9)) continue;
      const arv = criarArvore(r, this.matsFolha[Math.floor(r() * 3)]);
      const s = 0.8 + r() * 0.6;
      arv.position.set(x, 0.1, z);
      arv.rotation.y = r() * Math.PI * 2;
      arv.userData.s = s;
      arv.scale.setScalar(s);
      this.group.add(arv);
      this.arvores.push(arv);
      this.colisores.push({ x: this.centro.x + x, z: this.centro.z + z, r: 0.35 * s });
    }

    // Pedras na borda
    for (let k = 0; k < Math.round(R * 0.7); k++) {
      const ang = r() * Math.PI * 2, rad = R * (0.72 + r() * 0.12);
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      if (!this._livre(x, z, 0.6)) continue;
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + r() * 0.35, 0), matPedra);
      p.position.set(x, 0.05, z);
      p.rotation.set(r() * 3, r() * 3, r() * 3);
      p.scale.y = 0.6;
      p.castShadow = true;
      this.group.add(p);
    }

    // Flores (instanciadas): somem quando a ilha seca
    const nFl = Math.round(R * 6);
    this.flores = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.1, 0),
      new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.12 }),
      nFl,
    );
    this.posFlores = [];
    for (let k = 0; k < nFl; k++) {
      let x = 0, z = 0;
      for (let t = 0; t < 20; t++) {
        const ang = r() * Math.PI * 2, rad = R * Math.sqrt(r()) * 0.8;
        x = Math.cos(ang) * rad; z = Math.sin(ang) * rad;
        if (this._livre(x, z, 0.3)) break;
      }
      this.posFlores.push([x, z, 0.7 + r() * 0.6]);
      this.flores.setColorAt(k, FLORES[Math.floor(r() * FLORES.length)]);
    }
    this.group.add(this.flores);
  }

  _rachaduras(r) {
    this.matRacha = new THREE.MeshStandardMaterial({ color: RACHA.clone(), roughness: 1, emissive: '#000000' });
    this.segRacha = [];
    const n = 4, partes = 6, R = this.raio;
    const geo = new THREE.BoxGeometry(1, 0.1, 0.16);
    for (let i = 0; i < n; i++) {
      let ang = (i / n) * Math.PI * 2 + r() * 0.8;
      let x = Math.cos(ang) * 1.7, z = Math.sin(ang) * 1.7;
      const passo = (R * 0.78 - 1.7) / partes;
      for (let k = 0; k < partes; k++) {
        ang += (r() - 0.5) * 0.8;
        const nx = x + Math.cos(ang) * passo, nz = z + Math.sin(ang) * passo;
        const m = new THREE.Mesh(geo, this.matRacha);
        m.position.set((x + nx) / 2, 0.19, (z + nz) / 2);
        m.rotation.y = -Math.atan2(nz - z, nx - x);
        m.userData.len = Math.hypot(nx - x, nz - z) + 0.08;
        m.userData.ordem = k / partes;
        m.visible = false;
        this.group.add(m);
        this.segRacha.push(m);
        x = nx; z = nz;
      }
    }
  }

  _aplicar(forcar) {
    const chave = `${this.saude.toFixed(3)}|${this.sat.toFixed(3)}|${this.brilho.toFixed(3)}`;
    if (!forcar && chave === this._estado) return;
    this._estado = chave;
    const h = clamp(this.saude, 0, 1), s = this.sat, g = this.brilho;
    const col = this.geo.attributes.color.array, b = this.base, d = this.seca;
    for (let i = 0; i < col.length; i += 3) {
      let cr = lerp(d[i], b[i], h), cg = lerp(d[i + 1], b[i + 1], h), cb = lerp(d[i + 2], b[i + 2], h);
      const l = cr * 0.3 + cg * 0.59 + cb * 0.11;
      cr = l + (cr - l) * s; cg = l + (cg - l) * s; cb = l + (cb - l) * s;
      col[i] = Math.max(0, cr + g * 0.2);
      col[i + 1] = Math.max(0, cg + g * 0.17);
      col[i + 2] = Math.max(0, cb + g * 0.1);
    }
    this.geo.attributes.color.needsUpdate = true;

    this.matsFolha.forEach((m, k) => {
      m.color.copy(FOLHA_SECA).lerp(FOLHAS[k], h);
      m.emissive.setRGB(g * 0.12, g * 0.1, g * 0.04);
    });
    for (const a of this.arvores) a.scale.setScalar(a.userData.s * (0.72 + 0.28 * h));

    const fl = smooth(clamp((h - 0.45) / 0.45, 0, 1));
    this.posFlores.forEach(([x, z, s], k) => {
      _m.position.set(x, 0.22, z);
      _m.rotation.set(0, k, 0);
      _m.scale.setScalar(Math.max(0.0001, s * fl));
      _m.updateMatrix();
      this.flores.setMatrixAt(k, _m.matrix);
    });
    this.flores.instanceMatrix.needsUpdate = true;
  }

  /** Define a saúde de uma vez, sem a transição suave (usado ao restaurar um jogo salvo). */
  definirSaude(saude, alvo = saude) {
    this.saude = saude;
    this.alvoSaude = alvo;
    this._aplicar(true);
  }

  update(dt) {
    this.saude = damp(this.saude, this.alvoSaude, 1.2, dt);
    this._aplicar(false);

    for (const m of this.segRacha) {
      const k = clamp((this.racha - m.userData.ordem * 0.85) / 0.15, 0, 1);
      m.visible = k > 0.001;
      m.scale.x = Math.max(0.0001, m.userData.len * k);
    }
    this.matRacha.color.copy(RACHA).lerp(OURO, this.ouro);
    this.matRacha.emissive.copy(OURO).multiplyScalar(this.ouro * 1.8);

    // Pedaços que se desprendem quando a ilha racha
    if (this.racha > 0.35 && this.ouro < 0.5 && this.detritos.length < 12 && Math.random() < dt * this.racha * 2.5) {
      const d = new THREE.Mesh(geoDetrito, matDetrito);
      const ang = Math.random() * Math.PI * 2;
      d.position.set(Math.cos(ang) * this.raio * 0.92, -0.3, Math.sin(ang) * this.raio * 0.92);
      d.userData.vy = 0;
      this.group.add(d);
      this.detritos.push(d);
    }
    for (let i = this.detritos.length - 1; i >= 0; i--) {
      const d = this.detritos[i];
      d.userData.vy -= 9.8 * dt;
      d.position.y += d.userData.vy * dt;
      d.rotation.x += dt * 3;
      if (d.position.y < -9) { this.group.remove(d); this.detritos.splice(i, 1); }
    }
  }
}

/** Raiz viva que cresce entre duas ilhas e vira caminho. */
export class Ponte {
  constructor(a, b) {
    this.a = a.clone();
    this.b = b.clone();
    this.prog = 0;
    this.crescendo = false;
    this.pronta = false;
    this.group = new THREE.Group();

    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const p = new THREE.Vector3().lerpVectors(this.a, this.b, t);
      p.y = -0.2 + Math.sin(Math.PI * t) * 0.7;
      pts.push(p);
    }
    this.curva = new THREE.CatmullRomCurve3(pts);
    this.geo = new THREE.TubeGeometry(this.curva, 60, 0.42, 6, false);
    this.malha = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ color: '#a2734f', flatShading: true, roughness: 0.9 }));
    this.malha.castShadow = true;
    this.malha.receiveShadow = true;

    // Vinha em espiral em volta da raiz
    const dir = new THREE.Vector3().subVectors(this.b, this.a).setY(0).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const vpts = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90, ang = t * Math.PI * 12;
      const p = this.curva.getPoint(t);
      p.addScaledVector(perp, Math.cos(ang) * 0.45);
      p.y += Math.sin(ang) * 0.45;
      vpts.push(p);
    }
    this.geoV = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vpts), 180, 0.08, 4, false);
    this.vinha = new THREE.Mesh(this.geoV, new THREE.MeshStandardMaterial({ color: '#79c95f', flatShading: true, emissive: '#79c95f', emissiveIntensity: 0.25 }));

    // Botões de luz ao longo da raiz
    this.botoes = [];
    const matBotao = new THREE.MeshStandardMaterial({ color: '#fff1c2', emissive: '#ffd27a', emissiveIntensity: 2.2 });
    for (let k = 1; k < 10; k++) {
      const t = k / 10;
      const p = this.curva.getPoint(t);
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), matBotao);
      m.position.copy(p).addScaledVector(perp, (k % 2 ? 1 : -1) * 0.5);
      m.position.y += 0.35;
      m.userData.t = t;
      m.visible = false;
      this.botoes.push(m);
    }

    this.group.add(this.malha, this.vinha, ...this.botoes);
    this._desenhar();
  }

  crescer() { this.crescendo = true; }

  /** Põe a ponte no ponto em que estava (usado ao restaurar um jogo salvo). */
  restaurar(prog, crescendo = prog > 0) {
    this.prog = prog;
    this.crescendo = crescendo;
    this.pronta = prog >= 1;
    this._desenhar();
  }

  _desenhar() {
    const c1 = this.geo.index.count, c2 = this.geoV.index.count;
    this.geo.setDrawRange(0, Math.floor((this.prog * c1) / 6) * 6);
    this.geoV.setDrawRange(0, Math.floor((clamp(this.prog * 1.1 - 0.1, 0, 1) * c2) / 6) * 6);
    for (const b of this.botoes) b.visible = this.prog > b.userData.t + 0.05;
    this.group.visible = this.prog > 0;
  }

  update(dt) {
    if (this.crescendo && this.prog < 1) {
      this.prog = Math.min(1, this.prog + dt * 0.3);
      this._desenhar();
      if (this.prog >= 1) this.pronta = true;
    }
  }

  /** Altura do caminho em (x, z), ou null se o ponto não está sobre a ponte. */
  alturaEm(x, z) {
    const abx = this.b.x - this.a.x, abz = this.b.z - this.a.z;
    const t = ((x - this.a.x) * abx + (z - this.a.z) * abz) / (abx * abx + abz * abz);
    if (t < 0 || t > 1) return null;
    const px = this.a.x + abx * t, pz = this.a.z + abz * t;
    if (Math.hypot(x - px, z - pz) > 0.75) return null;
    return -0.2 + Math.sin(Math.PI * t) * 0.7 + 0.4;
  }
}
