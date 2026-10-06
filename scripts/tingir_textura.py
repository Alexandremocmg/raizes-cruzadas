"""Tinge os tons NEUTROS (cinza e branco) da textura de um GLB do Tripo, sem gastar créditos.

Uso (Blender 5.2, headless):
    blender --background --python scripts/tingir_textura.py -- <entrada.glb> <saida.glb> \
        <brilho_min> <brilho_max> <saturacao_max> <cor_alvo_hex> [brilho_de_referencia]

Os brilhos são em escala linear (a do Blender): um cinza claro de verdade fica perto de 0,35.

Seleciona os pixels com brilho entre brilho_min e brilho_max (0..1) e saturação até saturacao_max
(ou seja, os cinzas e brancos) e troca por `cor_alvo`, mantendo o claro/escuro relativo: um pixel
com o brilho de referência vira exatamente a cor alvo; os mais claros/escuros ficam proporcionais.
O arquivo de entrada não é alterado. Complementa `recolorir_textura.py`, que troca faixas de MATIZ
e por isso não alcança cinzas (que não têm matiz).

Criado para a Cisterna (2026-10-06): o Tripo entregou o corpo quase branco, que se perde sobre o
Centro cor de creme; queremos o azul-acinzentado #8fa6ba da Bíblia Visual.
"""
import sys

import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
entrada, saida = args[0], args[1]
v_min, v_max, s_max = float(args[2]), float(args[3]), float(args[4])
alvo = args[5].lstrip("#")
alvo_srgb = np.array([int(alvo[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)
# O Blender entrega os pixels em escala LINEAR (cinza claro ≈ 0,35); a cor do #hex está em sRGB.
alvo_rgb = np.where(alvo_srgb <= 0.04045, alvo_srgb / 12.92, ((alvo_srgb + 0.055) / 1.055) ** 2.4).astype(np.float32)
v_ref = float(args[6]) if len(args) > 6 else 0.36

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entrada)

cores = [img for img in bpy.data.images if img.name.startswith("Color")]
if not cores:
    raise SystemExit(f"[tingir] nenhuma textura de cor encontrada em {entrada}")

for img in cores:
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    rgb = px[:, :3]
    mx, mn = rgb.max(axis=1), rgb.min(axis=1)
    s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0)
    mascara = (mx >= v_min) & (mx <= v_max) & (s <= s_max)
    fator = (mx[mascara] / v_ref)[:, None]
    rgb[mascara] = np.clip(alvo_rgb[None, :] * fator, 0, 1)
    px[:, :3] = rgb
    img.pixels[:] = px.ravel()
    img.pack()
    print(f"[tingir] {img.name} ({w}x{h}): {int(mascara.sum())} pixels tingidos ({100 * mascara.mean():.1f}% da textura)")

bpy.ops.export_scene.gltf(filepath=saida, export_format="GLB")
print(f"[tingir] salvo em {saida}")
