# O Centro — ficha visual

## O que é
A pedra no meio da ilha do jogador, onde ele escolhe o que vai "ocupar o centro": a Cisterna, o
Espelho, a Lume ou a Fonte. É a peça mais importante do jogo, porque a mecânica principal
acontece em cima dela.

## Decisões de design
- **Vazia por cima.** O topo precisa ser plano e livre: os objetos (e a Lume) ficam em cima dela.
- **Não pode parecer um altar pagão nem um troféu.** Sem velas, crânios, símbolos ou runas. É uma
  pedra antiga e simples, como se a ilha tivesse crescido em volta dela.
- **Raízes entalhadas nas laterais.** Ligam o Centro ao tema (raízes) e antecipam a revelação: o
  Centro sempre esteve ligado ao que corre por baixo.
- **Sete lados**, como o pedestal provisório (sete é o número bíblico da completude). Fica como
  detalhe para quem perceber; o jogo não explica.
- **Larga e baixa:** cerca de cinco vezes mais larga que alta, para não esconder o que está em cima.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Pedra | creme `#efe3d2` |
| Entalhes de raiz | marrom suave `#a2734f` |
| Musgo na base | verde `#8fd36c` |
| Florzinhas | rosa e creme `#ff9ec4` `#fff3c4` |

## Requisitos técnicos
- Objeto estático, sem esqueleto e sem Mixamo.
- Modelo `tripo-p1`, cerca de 4.000 faces.
- **Tamanho no jogo:** cerca de 2,8 de largura e 0,5 de altura (o mesmo do pedestal provisório).

## Prompt para o Tripo
> Low-poly stylized game prop, an ancient wide low heptagonal stone pedestal with seven sides,
> about five times wider than it is tall, with a flat smooth empty top surface. Cream-white
> weathered stone, the sides gently carved with intertwining root patterns, small patches of
> soft green moss around the base and a few tiny pale pink and cream flowers growing at its
> foot. Faceted flat-shaded style with simple rounded shapes, soft warm pastel colors, smooth
> flat textures, single isolated object, no background.

Negativo: `statue, figure, person, idol, skull, candles, fire, text, runes, symbols, cross, realistic, high detail, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=4000` (task `b8bc24bd`) | 40 créditos. 3.989 triângulos. Saldo: 75 → 35. Pedra creme, musgo e florzinhas na base, como pedido. **Diferenças:** saiu 1,45× mais largo que alto (não 5×), com uma borda no topo, como uma bacia; as raízes entalhadas viraram facetas de pedra. |
| 2026-10-06 | Integrado no jogo (`main.js`, bloco `CENTRO`) | Escala (2,6; 1,3; 2,6), resultando em ~0,9 de altura; base em 0,08. `CENTRO.topo` = altura − 0,06 (dentro da borda). Os objetos do Centro e a Lume sobem para o topo. Conferido: a Lume fica apoiada no topo. Se o modelo falhar, o pedestal provisório fica e o erro aparece no console. |
| — | Aprovação do visual (Alexandre) | Pendente |
