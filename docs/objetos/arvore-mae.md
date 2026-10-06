# Árvore-mãe — ficha visual

## O que é
A árvore mais antiga da ilha do jogador, maior que todas as outras. As raízes dela são as
primeiras do jogo: aparecem acima do chão e descem pela borda da ilha, sugerindo, antes da
revelação, que existe algo **por baixo** sustentando tudo.

## Decisões de design
- **Raízes à mostra, grossas e espalhadas pelo chão,** descendo em direção à borda. É a ligação
  visual com as pontes de raiz e com a Fonte.
- **Copa larga e acolhedora,** de sombra e não de imponência. Formas redondas, como as árvores
  procedurais, só que maiores.
- **Florzinhas douradas e luminosas na copa.** São o único brilho próprio da árvore e ecoam a luz
  da Fonte. No jogo, ganham um pouco de bloom.
- **Sem rosto no tronco, nada assustador.** Não é uma "árvore mágica que fala"; é só muito velha
  e muito viva.
- **Seca junto com a ilha:** no jogo, a cor da árvore acompanha a saúde da ilha (o mesmo controle
  de "perder a cor" da Lume), porque ela também sofre quando o Centro está errado.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Copa | verdes quentes `#6cc35a` `#86d164` |
| Tronco e raízes | marrom `#9a6a4f` |
| Florzinhas | dourado claro `#ffd27a` |

## Requisitos técnicos
- Objeto estático, sem esqueleto e sem Mixamo.
- Modelo `tripo-p1`, cerca de 6.000 faces.
- **Tamanho no jogo:** cerca de 5,5 de altura e 5 de largura de copa.
- **Lugar:** fundo noroeste da ilha do jogador, atrás do Centro em relação à câmera, para não
  tapar a visão. As árvores procedurais deixam esse espaço livre.

## Prompt para o Tripo
> Low-poly stylized game prop, a large ancient mother tree with a thick slightly twisted trunk
> that splits at the bottom into strong curving roots spreading wide over the ground, and a
> broad rounded canopy made of a few big soft faceted leaf clusters in warm greens, with a few
> small glowing pale golden blossoms scattered in the canopy. Faceted flat-shaded style with
> simple rounded shapes, soft warm pastel colors, smooth flat textures, single isolated tree,
> no ground plane, no background.

Negativo: `realistic, photorealistic, high detail, pine tree, dead tree, spooky, face on trunk, text, pot, base, pedestal, grass ground, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=6000` (task `4321daba`) | 40 créditos. Saldo: 2.035 → 1.995. Raízes espalhadas, copa redonda, florzinhas claras, nada assustador. Cores pálidas: copa verde-oliva e tronco salmão. |
| 2026-10-06 | Copa recolorida (`recolorir_textura.py`, matiz 0,10–0,32, saturação ≥ 0,10 → `#7fcf5f`) | 63,6% da textura (a copa inteira, inclusive o lado de baixo). O tronco ficou marrom. A primeira tentativa (saturação ≥ 0,20) deixou uma faixa oliva sob as folhas. Original preservado em `model.glb`; o jogo usa `model_copa_verde.glb`. |
| 2026-10-06 | Integrada no jogo (`main.js`, bloco `arvoreMae`) | Altura 5,5, em (−4,6; −4,0), espaço livre das árvores procedurais, colisão no tronco (r 0,8). **Seca com a ilha:** `uCinza = (1 − saúde) × 0,85`, conferido com a ilha a 15%. |
| 2026-10-06 | Aprovação do visual (Alexandre) | Aprovada |
