"""Recolore uma faixa de cor na textura de um GLB do Tripo, sem gastar créditos.

Uso (Blender 5.2, headless):
    blender --background --python scripts/recolorir_textura.py -- <entrada.glb> <saida.glb> \
        <matiz_min> <matiz_max> <saturacao_min> <cor_alvo_hex>

Seleciona os pixels da textura de cor cuja matiz (0..1) está entre matiz_min e matiz_max e cuja
saturação passa de saturacao_min, e troca a cor deles pela cor alvo, mantendo o claro/escuro
original (o sombreamento pintado na textura continua). O arquivo de entrada não é alterado.

Criado para o Ferro (2026-10-06): o Tripo pintou as mangas de azul saturado, fora da paleta.
"""
import colorsys
import sys

import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
entrada, saida = args[0], args[1]
h_min, h_max, s_min = float(args[2]), float(args[3]), float(args[4])
alvo = args[5].lstrip("#")
alvo_rgb = np.array([int(alvo[i:i + 2], 16) / 255 for i in (0, 2, 4)])
alvo_v = max(alvo_rgb)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entrada)

cores = [img for img in bpy.data.images if img.name.startswith("Color")]
if not cores:
    raise SystemExit(f"[recolor] nenhuma textura de cor encontrada em {entrada}")

for img in cores:
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    rgb = px[:, :3]
    mx, mn = rgb.max(axis=1), rgb.min(axis=1)
    v = mx
    s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    # matiz vetorizada
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    d = np.maximum(mx - mn, 1e-6)
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    mascara = (hue >= h_min) & (hue <= h_max) & (s >= s_min)
    # mantém o claro/escuro relativo: escala a cor alvo pelo brilho do pixel
    fator = (v[mascara] / max(alvo_v, 1e-6))[:, None] * 0.75
    rgb[mascara] = np.clip(alvo_rgb[None, :] * fator, 0, 1)
    px[:, :3] = rgb
    img.pixels[:] = px.ravel()
    img.pack()
    print(f"[recolor] {img.name} ({w}x{h}): {int(mascara.sum())} pixels recoloridos "
          f"({100 * mascara.mean():.1f}% da textura)")

bpy.ops.export_scene.gltf(filepath=saida, export_format="GLB")
print(f"[recolor] salvo em {saida}")
