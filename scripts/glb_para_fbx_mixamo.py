"""Converte uma malha estática do Tripo (GLB) em FBX para subir no Mixamo.

Uso (Blender 5.2, headless):
    blender --background --python scripts/glb_para_fbx_mixamo.py -- <entrada.glb> <saida.fbx> [lado_textura] [giro_z_graus]

- Gira o modelo em Z para ficar de frente (-Y no Blender), como o Mixamo espera. O Tripo pode
  entregar o personagem virado para X: confira com uma renderização de frente, não pela caixa.
- Reduz as texturas (padrão 1024 px): o Tripo entrega 2048 px, o que pesa no celular.
- Embute as texturas no FBX, para o Mixamo mostrar o personagem colorido na pré-visualização.
- Não cria esqueleto: o auto-rig é feito no Mixamo.
"""
import sys
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
entrada, saida = args[0], args[1]
lado = int(args[2]) if len(args) > 2 else 1024
giro = float(args[3]) if len(args) > 3 else 0.0

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entrada)

malhas = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print(f"[fbx] objetos de malha: {[o.name for o in malhas]}")
for o in malhas:
    print(f"[fbx] {o.name}: {len(o.data.polygons)} faces, dimensões {tuple(round(d, 3) for d in o.dimensions)}")

if giro:
    import math
    from mathutils import Matrix
    # O importador de glTF usa rotação em quaternion: girar via rotation_euler não faz nada.
    for o in malhas:
        o.matrix_world = Matrix.Rotation(math.radians(giro), 4, "Z") @ o.matrix_world
        o.select_set(True)
    bpy.context.view_layer.objects.active = malhas[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    print(f"[fbx] girado {giro} graus em Z; nova dimensão {tuple(round(d, 3) for d in malhas[0].dimensions)}")

for img in bpy.data.images:
    if img.size[0] > lado:
        antes = tuple(img.size)
        img.scale(lado, lado)
        print(f"[fbx] textura {img.name}: {antes} -> {tuple(img.size)}")
    img.pack()

bpy.ops.export_scene.fbx(
    filepath=saida,
    use_selection=False,
    object_types={"MESH"},
    path_mode="COPY",
    embed_textures=True,
    add_leaf_bones=False,
    bake_anim=False,
)
print(f"[fbx] FBX salvo em {saida}")
