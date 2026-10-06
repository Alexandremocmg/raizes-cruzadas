# O poço — ficha visual

## O que é
O poço da ilha do jogador, de onde ele tira a água que leva aos outros. É o primeiro objeto com
que o jogador interage. No Ato 3 ele descobre que a água do poço nunca foi dele: sempre veio da
Fonte, por baixo.

## Decisões de design
- **Acolhedor e simples:** pedra clara, telhadinho laranja e um balde de madeira. Parece um lugar
  de encontro, não um monumento.
- **Abertura escura e vazia por cima.** A água é desenhada pelo jogo (um disco que sobe e desce
  com o nível e brilha mais quando a Fonte está no centro), por isso o modelo **não pode ter
  água dentro**.
- **Lado para a câmera:** o telhado cobre só o trecho de trás, para a boca do poço continuar
  visível de cima (a câmera olha de cima e de longe).
- Sem cruz, símbolos ou inscrições.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Pedra | creme `#efe3d2` |
| Telhado | laranja-telha `#d9775a` |
| Madeira (postes, balde) | marrom `#9a6a4f` |
| Interior da boca | marrom-escuro (vazio) |

## Requisitos técnicos
- Objeto estático, sem esqueleto e sem Mixamo.
- Modelo `tripo-p1`, cerca de 4.000 faces.
- **Tamanho no jogo:** cerca de 2,3 de altura e 1,8 de largura.

## Prompt para o Tripo
> Low-poly stylized game prop, a charming small stone water well: a round low cream-white stone
> wall with an empty dark opening on top (no water inside, clearly visible from above), two
> wooden posts on the sides holding a small orange terracotta pointed roof, a thin rope and a
> small wooden bucket hanging. Faceted flat-shaded style with simple rounded shapes, soft warm
> pastel colors, smooth flat textures, single isolated object, no background, no ground.

Negativo: `water, liquid, cross, symbols, inscriptions, skull, realistic, high detail, person, text, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=4000` (task `1675d699`) | 40 créditos. 3.798 triângulos. Pedra clara, telhado laranja de telhas, dois postes, **dois baldes** com corda. Boca escura e vazia, como pedido. |
| 2026-10-06 | Integrado no jogo (`main.js`, `prepararObjeto`) | Altura 2,4, girado −90° em Y (a "frente" do Tripo é +X; a câmera olha de +Z). A água continua sendo o disco do jogo, ajustado para a boca (raio 0,40; sobe de 30% a 42% da altura conforme o nível). |
| 2026-10-06 | Aprovação do visual (Alexandre) | Aprovado |
