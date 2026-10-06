# O Espelho — ficha visual

## O que é
O segundo objeto que o jogador pode colocar no Centro: **o reconhecimento, ser visto, ser
lembrado**. No jogo, ele promete (todos aplaudem), depois exige (dar "sem plateia" já não vale
nada) e por fim racha (as pessoas viram público e as outras ilhas secam).

Texto bíblico por trás: *"Quando, pois, deres esmola, não toques trombeta diante de ti"* (Mt 6:2) — o dar
que precisa de plateia.

## Decisões de design
- **Bonito e cativante.** O Espelho tem que ter vontade de ser olhado: moldura dourada com raios
  de sol e vidro claro e brilhante.
- **O vidro reflete o céu, nunca um rosto.** Sem rosto no espelho: o jogador se imagina nele.
- **Em pé, num suporte curto,** para não parecer um item de rua. Fica sobre o Centro e gira
  devagar (o jogo faz isso), como quem procura o melhor ângulo.
- Sem símbolos religiosos ou esotéricos.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Moldura e suporte | dourado `#c7a76a` |
| Vidro | azul-claro `#eaf2ff`, brilhante |

## Requisitos técnicos
- Objeto estático, sem esqueleto e sem Mixamo.
- Modelo `tripo-p1`, cerca de 4.000 faces.
- **Tamanho no jogo:** cerca de 2,0 de altura e 1,5 de largura (fica sobre o Centro).

## Prompt para o Tripo
> Low-poly stylized game prop, an elegant round standing mirror with a thick golden frame
> decorated with small sun rays pointing outward, a short ornate golden stand, and a polished
> pale sky-blue glass surface that reflects only soft light (no face, no reflection of a person).
> Faceted flat-shaded style with simple rounded shapes, soft warm pastel colors, smooth flat
> textures, single isolated object, no background, no ground.

Negativo: `face, person, eye, occult, pentagram, skull, realistic, high detail, text, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=4000` (task `8db86a7a`) | 40 créditos. 3.870 triângulos. Moldura dourada com raios de sol, vidro azul-claro sem rosto, suporte curto. Fiel à ficha. Os raios são pontudos, mas lidos como sol, não como ameaça. |
| 2026-10-06 | Integrado no jogo | Altura 2,0, sobre o Centro; balança devagar ±0,5 rad, "procurando o melhor ângulo" (o vidro fica escuro de certos ângulos por causa da luz). Testado nas três fases (`?debug&teste=espelho`: 9 de 9). |
| 2026-10-06 | Ajuste de jogo | As ilhas vizinhas passaram a secar 3× mais rápido na rachadura do Espelho (0,012/s): antes a queda era imperceptível. Os aplausos passaram a aparecer em volta do jogador (as ilhas vizinhas muitas vezes ficam fora da tela). |
| — | Aprovação do visual (Alexandre) | Pendente |
