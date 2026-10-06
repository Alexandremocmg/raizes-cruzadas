# A Cisterna — ficha visual

## O que é
Um dos objetos que o jogador pode colocar no Centro da ilha: a **água guardada, a segurança, o
"nunca mais faltar"**. É o primeiro ídolo e o mais sutil: parece prudência. No jogo, ela promete
(o poço rende três vezes mais), depois exige (a água fica presa) e por fim racha (a água apodrece).

Texto bíblico por trás: *"cavaram cisternas, cisternas rotas, que não retêm as águas"* (Jr 2:13).

## Decisões de design
- **Tem que parecer uma boa ideia.** Se for feia ou ameaçadora, o jogador não cai na tentação e a
  lição perde a força. Ela é bonita, sólida e tranquilizadora.
- **Mas fechada.** Tampa pesada com cadeado e cintas de ferro: a água entra e não sai. É a única
  pista visual do problema, e discreta.
- **Barril-jarro largo e baixo,** em cerâmica azul-acinzentada: lê-se como "reserva de água"
  mesmo de longe.
- Sem rachaduras no modelo. A rachadura é da ilha (já desenhada pelo jogo), porque o peso é da
  ilha inteira.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Corpo (cerâmica vidrada) | azul-acinzentado `#8fa6ba` |
| Tampa | azul-petróleo `#3d6b7a` |
| Cintas e cadeado | ferro `#5b6b78` |

## Requisitos técnicos
- Objeto estático, sem esqueleto e sem Mixamo.
- Modelo `tripo-p1`, cerca de 4.000 faces.
- **Tamanho no jogo:** cerca de 1,6 de altura e 1,9 de largura (fica sobre o Centro).

## Prompt para o Tripo
> Low-poly stylized game prop, a big round water storage cistern shaped like a wide squat
> barrel-jar, glazed blue-grey ceramic body, two dark iron bands around it, a heavy dark teal lid
> with a small iron padlock, sealed and sturdy but pleasant and reassuring looking, not scary.
> Faceted flat-shaded style with simple rounded shapes, soft pastel colors, smooth flat textures,
> single isolated object, no background, no ground.

Negativo: `cracks, broken, skull, spikes, evil, realistic, high detail, water spill, text, person, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=4000` (task `fffdbbcf`) | 40 créditos. 3.766 triângulos. Jarro largo com duas cintas de ferro, tampa verde-petróleo e argola. Agradável e tranquilizador, como pedido. O corpo veio cinza-claro quase branco. |
| 2026-10-06 | Tingida de graça (`scripts/tingir_textura.py`, cinzas de brilho ≥ 0,30 → `#8fa6ba`) | 51% da textura. O corpo vira azul-acinzentado e se destaca do Centro cor de creme; as cintas (mais escuras) ficam como estão. Original preservado em `model.glb`; o jogo usa `model_azul.glb`. |
| 2026-10-06 | Integrada no jogo | Altura 1,5, sobre o Centro. Testada nas três fases (`?debug&teste=cisterna`: 17 de 17). |
| — | Aprovação do visual (Alexandre) | Pendente |
