#!/usr/bin/env node
// Valida um .glb pela ESTRUTURA do arquivo, sem three.js nem Blender.
//
//   node validate_glb.mjs public/models/personagem.glb [--clips idle,run,jump] [--bones 41]
//
// Por que existe: um localizar-e-substituir global de "BIN" por "BLE" corrompeu o
// cabeçalho do chunk binário de 9 GLBs (a palavra aparece UMA vez por arquivo, ali). O
// jogo não travou — caiu num fallback e foi pra produção assim, sem ninguém notar.
// Rode isto no build/CI: transforma corrupção silenciosa em erro de build.
//
// Sai com código 1 se algo estiver errado (assinatura, versão, tamanho, chunks, JSON,
// skin sem JOINTS_0/WEIGHTS_0, clipe esperado ausente, contagem de ossos diferente).

import fs from 'node:fs';

const [, , arquivo, ...flags] = process.argv;
if (!arquivo) {
  console.error('uso: node validate_glb.mjs arquivo.glb [--clips a,b,c] [--bones N]');
  process.exit(2);
}
const opt = (nome) => {
  const i = flags.indexOf(nome);
  return i >= 0 ? flags[i + 1] : null;
};
const clipesEsperados = (opt('--clips') || '').split(',').filter(Boolean);
const ossosEsperados = opt('--bones') ? Number(opt('--bones')) : null;

const erros = [];
const falha = (m) => erros.push(m);

const buf = fs.readFileSync(arquivo);
if (buf.length < 20) {
  console.error('arquivo pequeno demais para ser um GLB');
  process.exit(1);
}

const magic = buf.toString('ascii', 0, 4);
const versao = buf.readUInt32LE(4);
const tamanho = buf.readUInt32LE(8);
if (magic !== 'glTF') falha(`assinatura "${magic}" (esperado "glTF")`);
if (versao !== 2) falha(`versão ${versao} (esperado 2)`);
if (tamanho !== buf.length) falha(`tamanho no cabeçalho ${tamanho} != tamanho real ${buf.length}`);

// Chunks: [u32 tamanho][4 bytes tipo][dados], tipos "JSON" e depois "BIN\0".
let off = 12;
const chunks = [];
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off);
  const tipo = buf.toString('latin1', off + 4, off + 8);
  if (off + 8 + len > buf.length) {
    falha(`chunk "${tipo}" declara ${len} bytes mas o arquivo acaba antes`);
    break;
  }
  chunks.push({ tipo, ini: off + 8, len });
  off += 8 + len;
}
if (!chunks.length || chunks[0].tipo !== 'JSON') falha(`primeiro chunk deveria ser "JSON", veio "${chunks[0]?.tipo}"`);
const temBin = chunks.find((c, i) => i > 0);
if (temBin && temBin.tipo !== 'BIN\0') {
  falha(`chunk binário com tipo ${JSON.stringify(temBin.tipo)} (esperado "BIN\\0") — o GLTFLoader não resolve o buffer`);
}

let gltf = null;
if (chunks[0]?.tipo === 'JSON') {
  try {
    gltf = JSON.parse(buf.toString('utf8', chunks[0].ini, chunks[0].ini + chunks[0].len));
  } catch (e) {
    falha(`JSON do GLB não parseia: ${e.message}`);
  }
}

const resumo = {};
if (gltf) {
  const malhas = gltf.meshes || [];
  const skins = gltf.skins || [];
  const anims = gltf.animations || [];
  resumo.malhas = malhas.length;
  resumo.skins = skins.length;
  resumo.ossos = skins.map((s) => s.joints.length);
  resumo.clipes = anims.map((a) => a.name);
  resumo.materiais = (gltf.materials || []).length;
  resumo.texturas = (gltf.textures || []).length;
  resumo.imagens = (gltf.images || []).length;
  resumo.triangulos = 0;

  const acc = gltf.accessors || [];
  for (const m of malhas) {
    for (const p of m.primitives || []) {
      if (p.indices != null && acc[p.indices]) resumo.triangulos += Math.floor(acc[p.indices].count / 3);
      if (skins.length) {
        for (const a of ['JOINTS_0', 'WEIGHTS_0']) {
          if (p.attributes?.[a] == null) falha(`primitiva sem ${a} numa malha com skin (skinning destruído)`);
        }
      }
    }
  }

  if (ossosEsperados != null && !resumo.ossos.includes(ossosEsperados)) {
    falha(`esperava skin com ${ossosEsperados} ossos, achei [${resumo.ossos.join(', ')}]`);
  }
  for (const c of clipesEsperados) {
    if (!resumo.clipes.includes(c)) falha(`clipe "${c}" ausente (tem: ${resumo.clipes.join(', ') || 'nenhum'})`);
  }
  // Clipe vazio ou todos idênticos = sintoma de ação importada errada (use_fake_user).
  for (const a of anims) {
    if (!a.channels?.length) falha(`clipe "${a.name}" sem canais`);
  }
}

console.log(JSON.stringify({ arquivo, kb: Math.round(buf.length / 1024), chunks: chunks.map((c) => c.tipo), ...resumo }, null, 2));
if (erros.length) {
  console.error('\nFALHOU:\n - ' + erros.join('\n - '));
  process.exit(1);
}
console.log('\nok');
