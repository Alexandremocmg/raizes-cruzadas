// Personagens provisórios em low-poly, feitos por código.
// Serão substituídos pelos modelos do Tripo (→ Mixamo) sem mudar a lógica do jogo.
import * as THREE from 'three';

export function criarFigura({ corpo, lenco, pele = '#f0c8a0', escala = 1, curvado = 0, cajado = false }) {
  const mats = [];
  const M = (c) => {
    const m = new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.75 });
    m.userData.cor = new THREE.Color(c);
    mats.push(m);
    return m;
  };
  const raiz = new THREE.Group();
  const corpoG = new THREE.Group();
  raiz.add(corpoG);

  const tronco = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.0, 7), M(corpo));
  tronco.position.y = 0.5;
  const cabeca = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 0), M(pele));
  cabeca.position.y = 1.2;
  const matLenco = M(lenco);
  const gola = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.14, 7), matLenco);
  gola.position.y = 0.96;
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.45, 4), matLenco);
  ponta.position.set(0, 0.9, -0.2);
  ponta.rotation.x = -2.5;
  const matOlho = new THREE.MeshBasicMaterial({ color: '#2a211d' });
  for (const s of [-1, 1]) {
    const olho = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.03), matOlho);
    olho.position.set(0.085 * s, 1.23, 0.22);
    corpoG.add(olho);
  }
  corpoG.add(tronco, cabeca, gola, ponta);

  if (cajado) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.4, 5), M('#8b6248'));
    c.position.set(0.38, 0.65, 0.18);
    c.rotation.z = -0.08;
    raiz.add(c);
  }

  corpoG.rotation.x = curvado;
  raiz.scale.setScalar(escala);
  raiz.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const fig = {
    raiz, corpoG, ponta, escala, curvado,
    /** 0 = cores normais · 1 = totalmente sem cor (usado na Lume quando vira ídolo) */
    setCinza(k) {
      for (const m of mats) {
        const c = m.userData.cor;
        const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
        m.color.setRGB(
          (c.r + (l - c.r) * k) * (1 - 0.35 * k),
          (c.g + (l - c.g) * k) * (1 - 0.35 * k),
          (c.b + (l - c.b) * k) * (1 - 0.35 * k),
        );
      }
    },
  };
  return fig;
}

export function animarFigura(fig, t, andando) {
  const f = 11;
  fig.corpoG.position.y = andando ? Math.abs(Math.sin(t * f)) * 0.07 : Math.sin(t * 2) * 0.015;
  fig.corpoG.rotation.z = andando ? Math.sin(t * f) * 0.05 : 0;
  fig.corpoG.rotation.x = fig.curvado + (andando ? 0.08 : 0);
  fig.ponta.rotation.x = -2.5 + (andando ? Math.sin(t * f) * 0.25 : Math.sin(t * 1.7) * 0.08);
}
