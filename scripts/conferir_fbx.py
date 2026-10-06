"""Reimporta um FBX e renderiza uma vista de FRENTE (câmera olhando para +Y), para confirmar
que o personagem está de frente antes de subir no Mixamo. O rosto tem que aparecer na imagem.

Uso: blender --background --python scripts/conferir_fbx.py -- <entrada.fbx> <saida.png>
"""
import math
import sys

import bpy
from mathutils import Vector

entrada, saida = sys.argv[sys.argv.index("--") + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=entrada)
o = [x for x in bpy.context.scene.objects if x.type == "MESH"][0]
cantos = [o.matrix_world @ Vector(c) for c in o.bound_box]
mn = Vector((min(c.x for c in cantos), min(c.y for c in cantos), min(c.z for c in cantos)))
mx = Vector((max(c.x for c in cantos), max(c.y for c in cantos), max(c.z for c in cantos)))
print("[conf] faces", len(o.data.polygons), "min", tuple(round(v, 3) for v in mn), "max", tuple(round(v, 3) for v in mx))
cen = (mn + mx) / 2
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
bpy.context.scene.collection.objects.link(cam)
cam.location = cen + Vector((0, -3.2, 0.3))
cam.rotation_euler = (math.radians(85), 0, 0)
bpy.context.scene.camera = cam
s = bpy.context.scene
s.render.engine = "BLENDER_WORKBENCH"
s.display.shading.color_type = "TEXTURE"
s.render.resolution_x = s.render.resolution_y = 400
s.render.filepath = saida
bpy.ops.render.render(write_still=True)
print("[conf] render", saida)
