# Lume — ficha visual

## Quem é
Uma criança curiosa que mora numa ilha pequena a noroeste. Ela repara nos detalhes ("a água faz
barulho quando corre"). No Ato 2 pode ser colocada no Centro da ilha do jogador, e então perde
a cor aos poucos: ninguém aguenta ser o centro de outra pessoa.

## Silhueta (precisa ser lida de longe, na câmera do jogo)
- **Pequena:** cerca de 70% da altura do jogador.
- **Túnica amarela em forma de sino** que se abre até perto do chão, o mesmo "cone" do personagem provisório.
- **Lenço laranja** no pescoço, com **uma ponta longa solta nas costas**. É a assinatura dela e balança quando ela anda.
- Cabeça redonda e um pouco grande para o corpo (proporção infantil), cabelo curto e bagunçado.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Túnica | amarelo quente `#ffd56e` |
| Lenço | laranja `#ff8b5e` |
| Pele | pêssego `#f3cfa8` |
| Cabelo | castanho-escuro `#5a3d2b` |
| Botinhas | marrom `#8b6248` |
| Olhos | pontos escuros `#2a211d` |

## Estilo
Low-poly com facetas visíveis, formas arredondadas e nada pontiagudo. Cores pastel quentes e
texturas lisas, sem detalhe realista. Expressão: um sorriso pequeno, nunca exagerado.

## Requisitos técnicos (para o Mixamo)
- Corpo inteiro em **A-pose**: braços um pouco afastados do corpo, de frente, simétrica.
- Pernas visíveis sob a túnica (curtas) para o auto-rig encontrar joelhos e pés.
- Sem base, pedestal, objetos nas mãos ou cenário.
- Modelo `tripo-p1` (low-poly), limite de cerca de 6.000 faces.

## Prompt usado no Tripo
> Low-poly stylized game character, a small cheerful child, faceted flat-shaded look with simple
> rounded shapes. She wears a long bell-shaped warm yellow tunic that flares out near the ground,
> and an orange scarf wrapped around her neck with one long loose tail hanging down her back.
> Round slightly oversized head, warm peach skin, short messy dark-brown hair, two simple dark
> dot eyes and a small gentle smile. Short arms, short legs with small brown boots visible under
> the tunic. Full body, standing in A-pose with arms slightly away from the body, facing forward,
> symmetrical. Soft warm pastel colors, smooth flat textures, no background, no props.

Negativo: `realistic, photorealistic, high detail, sharp spikes, weapon, text, base, pedestal, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-05 | Tripo `text_to_model`, modelo P1, `face_limit=6000` (task `91fe7e2e`) | **40 créditos** (a estimativa era ~30; o P1 custa mais que a tabela antiga). 5.784 triângulos, T-pose, sem esqueleto. Saldo: 235 → 195. |
| 2026-10-05 | Inspeção na cena (`inspecao.html`) | Estilo combina com as ilhas quando as facetas estão ligadas. Aprovação final: Alexandre. |
| 2026-10-05 | FBX para o Mixamo (`assets/mixamo/lume_para_mixamo.fbx`) | Girado −90° em Z (o Tripo entregou virada para X), texturas de 2048 para 1024, conferido por renderização de frente. |
| 2026-10-05/06 | Mixamo (feito pelo Alexandre) | Happy Idle, Walking, Sad Idle, Talking |
| 2026-10-06 | GLB montado (`scripts/montar_personagem_glb.py -- lume`) → `assets/modelos/lume.glb` | 0,92 MB, 4 clipes (`idle`, `andar`, `triste`, `falar`), 33 ossos, 5.784 faces, sem Draco. `validate_glb.mjs` ok. |
| 2026-10-06 | Medição pelos ossos (`inspecao.html?modelo=lume`) | Nos 4 clipes: pé no chão (−0,013 a 0,002), topo variando, deriva do quadril ≤ 0,001. |
| 2026-10-06 | Aprovação clipe a clipe (Alexandre) | Os 4 clipes aprovados |
| 2026-10-06 | Integrada no jogo (`src/personagem.js` + `comportamentoLume` em `main.js`) | Passeia pela ilha (`andar`/`idle`), vira para o jogador e fala (`falar`), no Centro fica feliz na promessa e `triste` + sem cor na exigência e na rachadura; ao sair do Centro volta para casa e recupera a cor aos poucos. Se o GLB falhar, a figura provisória fica e o erro aparece no console. |

**Lição:** não aplicar a escala 0,01 do Armature do Mixamo. As f-curves do Hips continuam em
centímetros e o corpo é lançado a cerca de 100 m. Deixe o 0,01 no GLB e normalize a altura no
jogo **medindo pelos ossos**: `Box3` numa SkinnedMesh do Mixamo devolveu 2,4× o tamanho real.

**Diferenças em relação à ficha:** a ponta do lenço caiu na **frente**, não nas costas, e o
acabamento é liso (as facetas vêm do `flatShading` no jogo).

