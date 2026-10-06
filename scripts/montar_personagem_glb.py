"""Junta os FBX do Mixamo de um personagem num único GLB com vários clipes.

Uso (Blender 5.2, headless), a partir da raiz do projeto:
    blender --background --python scripts/montar_personagem_glb.py -- lume

Adaptado de `merge_mixamo_glb.py` (skill tripo-mixamo-workflow do esconde-ou-morre).
Diferenças: configuração por personagem, sem Draco, escala do esqueleto normalizada para 1.0
e materiais mantidos (o jogo usa a textura do Tripo).
"""

import json
import os
import sys

import bpy

PERSONAGENS = {
    "lume": {
        # (arquivo, nome do clipe). O primeiro fornece a malha e o esqueleto.
        "fontes": [
            ("assets/mixamo/lume/Happy Idle.fbx", "idle"),
            ("assets/mixamo/lume/Walking.fbx", "andar"),
            ("assets/mixamo/lume/Sad Idle.fbx", "triste"),
            ("assets/mixamo/lume/Talking.fbx", "falar"),
        ],
        "saida": "assets/modelos/lume.glb",
    },
    "jogador": {
        "fontes": [
            ("assets/mixamo/jogador/Idle.fbx", "idle"),
            ("assets/mixamo/jogador/Walking.fbx", "andar"),
            ("assets/mixamo/jogador/Picking Up.fbx", "tirar"),
            ("assets/mixamo/jogador/Throw.fbx", "enviar"),
        ],
        "saida": "assets/modelos/jogador.glb",
    },
    "salvia": {
        "fontes": [
            ("assets/mixamo/salvia/Old Man Idle.fbx", "idle"),
            ("assets/mixamo/salvia/Old Man Walk.fbx", "andar"),
            ("assets/mixamo/salvia/Talking.fbx", "falar"),
            ("assets/mixamo/salvia/Thankful.fbx", "agradecer"),
        ],
        "saida": "assets/modelos/salvia.glb",
    },
    "ferro": {
        "fontes": [
            ("assets/mixamo/ferro/Neutral Idle.fbx", "idle"),
            ("assets/mixamo/ferro/Walking.fbx", "andar"),
            ("assets/mixamo/ferro/Talking.fbx", "falar"),
            ("assets/mixamo/ferro/Defeated.fbx", "abatido"),
        ],
        "saida": "assets/modelos/ferro.glb",
    },
}

RESOLUCAO_TEXTURA = 512
OSSO_RAIZ = "Hips"
# Nenhum destes clipes deve deslocar o personagem: quem posiciona no mundo é o jogo.
# A altura (Y) fica: no idle e no "triste" o corpo sobe e desce como parte da ação.
POLITICA_ROOT_MOTION = {"x": True, "y": False, "z": True}

nome = sys.argv[sys.argv.index("--") + 1]
cfg = PERSONAGENS[nome]
raiz = os.getcwd()
PULADOS = []


def fcurvas(act):
    """Compatível com o layout antigo e com as slotted actions do Blender 4.4+."""
    if len(getattr(act, "fcurves", [])):
        return list(act.fcurves)
    out = []
    for layer in getattr(act, "layers", []):
        for strip in getattr(layer, "strips", []):
            for cb in getattr(strip, "channelbags", []):
                out.extend(cb.fcurves)
    return out


def limpar_cena():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    # O importador FBX marca use_fake_user: sem zerar, a próxima leitura relê a ação errada.
    for a in list(bpy.data.actions):
        a.use_fake_user = False
        bpy.data.actions.remove(a)


def importar_e_juntar():
    base_arm = base_mesh = None
    for i, (caminho, clipe) in enumerate(cfg["fontes"]):
        antes_acoes = {a.name for a in bpy.data.actions}
        antes_objs = {o.name for o in bpy.data.objects}
        try:
            bpy.ops.import_scene.fbx(filepath=os.path.join(raiz, caminho))
        except Exception as erro:
            # O primeiro arquivo doa malha e esqueleto: sem ele não há personagem.
            if i == 0:
                raise
            print(f"[montar] AVISO: {caminho} não abriu e foi PULADO ({erro})")
            PULADOS.append(clipe)
            continue
        novas = [a for a in bpy.data.actions if a.name not in antes_acoes]
        if not novas:
            raise RuntimeError(f"nenhuma ação importada de {caminho}")
        acao = novas[0]
        acao.name = clipe
        acao.use_fake_user = True
        novos = [o for o in bpy.data.objects if o.name not in antes_objs]
        if base_arm is None:
            for o in novos:
                if o.type == "ARMATURE":
                    base_arm = o
                elif o.type == "MESH":
                    base_mesh = o
            base_arm.name = "Armature"
            base_mesh.name = nome
        else:
            for o in novos:
                bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.armatures):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)
    return base_arm, base_mesh


def remover_root_motion():
    relatorio = {}
    for act in bpy.data.actions:
        removido = {}
        for fc in fcurvas(act):
            if OSSO_RAIZ not in fc.data_path or not fc.data_path.endswith(".location"):
                continue
            eixo = "xyz"[fc.array_index]
            if not POLITICA_ROOT_MOTION.get(eixo):
                continue
            pts = fc.keyframe_points
            if not len(pts):
                continue
            base = pts[0].co[1]
            amplitude = max(p.co[1] for p in pts) - min(p.co[1] for p in pts)
            for p in pts:
                p.co[1] = base
                p.handle_left[1] = base
                p.handle_right[1] = base
            fc.update()
            removido[eixo] = round(amplitude, 3)
        relatorio[act.name] = removido
    return relatorio


def reduzir_texturas(mesh):
    usadas = set()
    for mat in mesh.data.materials:
        if mat and mat.use_nodes:
            for node in mat.node_tree.nodes:
                if node.type == "TEX_IMAGE" and node.image:
                    usadas.add(node.image.name)
    for n in usadas:
        img = bpy.data.images[n]
        if img.size[0] > RESOLUCAO_TEXTURA:
            img.scale(RESOLUCAO_TEXTURA, RESOLUCAO_TEXTURA)
    removidas = 0
    for img in list(bpy.data.images):
        if img.name in usadas or img.name in ("Render Result", "Viewer Node"):
            continue
        bpy.data.images.remove(img)
        removidas += 1
    return sorted(usadas), removidas


def escala_armature(arm):
    """Só informa a escala. NÃO aplique (transform_apply) a escala 0.01 do Mixamo: as posições de
    repouso dos ossos mudam, mas as f-curves de location do Hips continuam em centímetros e o
    corpo é lançado a ~100 m. Testado aqui em 2026-10-06. O jogo normaliza o tamanho na carga."""
    return tuple(round(s, 4) for s in arm.scale)


def exportar(arm, mesh):
    saida = os.path.join(raiz, cfg["saida"])
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=saida,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=False,
        export_image_format="JPEG",  # texturas em JPEG: bem menores que PNG, sem perda visível aqui
        export_jpeg_quality=85,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_bake_animation=True,
        export_optimize_animation_size=True,
        export_apply=False,
    )
    return saida


limpar_cena()
arm, mesh = importar_e_juntar()
escala = escala_armature(arm)
rm = remover_root_motion()
texturas, duplicatas = reduzir_texturas(mesh)
dims = tuple(round(d, 3) for d in mesh.dimensions)
saida = exportar(arm, mesh)

print("[montar] " + json.dumps({
    "saida": saida,
    "mb": round(os.path.getsize(saida) / 1024 / 1024, 2),
    "clipes": sorted(a.name for a in bpy.data.actions),
    "clipes_pulados": PULADOS,
    "ossos": len(arm.data.bones),
    "faces": len(mesh.data.polygons),
    "dimensoes_malha": dims,
    "escala_armature": escala,
    "root_motion_removido": rm,
    "texturas": texturas,
    "duplicatas_removidas": duplicatas,
}, ensure_ascii=False))
