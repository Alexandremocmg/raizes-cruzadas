"""Reduz o peso de um GLB ESTÁTICO (sem esqueleto): texturas menores e em JPEG.

Uso (Blender 5.2, headless):
    blender --background --python scripts/otimizar_glb.py -- <entrada.glb> <saida.glb> [lado=1024] [qualidade=85]

Os modelos do Tripo chegam com texturas de 2048 px (e, depois de uma recoloração, regravadas em PNG),
o que dá de 2 a 5 MB por peça. Para a web, 1024 px em JPEG basta (a peça ocupa uma parte pequena da
tela) e cai para cerca de 0,3 a 0,6 MB. O arquivo de entrada não é alterado.

Para personagens animados NÃO use este script (reexportar o esqueleto de um GLB arrisca o skinning):
`montar_personagem_glb.py` já exporta em JPEG a partir dos FBX.
"""
import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1:]
entrada, saida = args[0], args[1]
lado = int(args[2]) if len(args) > 2 else 1024
qualidade = int(args[3]) if len(args) > 3 else 85

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entrada)

if any(o.type == "ARMATURE" for o in bpy.data.objects):
    raise SystemExit("[otimizar] o modelo tem esqueleto: use montar_personagem_glb.py, não este script")

for img in bpy.data.images:
    if img.name in ("Render Result", "Viewer Node"):
        continue
    w, h = img.size
    if max(w, h) > lado:
        img.scale(lado, lado)
        print(f"[otimizar] {img.name}: {w}x{h} -> {lado}x{lado}")
    img.pack()

bpy.ops.export_scene.gltf(
    filepath=saida,
    export_format="GLB",
    export_image_format="JPEG",
    export_jpeg_quality=qualidade,
)
antes = os.path.getsize(entrada) / 1024
depois = os.path.getsize(saida) / 1024
print(f"[otimizar] {os.path.basename(entrada)}: {antes:.0f} KB -> {depois:.0f} KB ({100 * depois / antes:.0f}%)")
