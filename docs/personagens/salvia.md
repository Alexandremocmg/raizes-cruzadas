# Dona Sálvia — ficha visual

## Quem é
Uma senhora idosa que mora na ilha a leste e **não tem como retribuir nada**. É a primeira a
receber água do jogador. Depois que a ilha dela floresce, ela diz a frase-chave do Ato 3:
"quem segura a água, perde; quem deixa passar, nunca seca". Representa a sabedoria de quem já
viveu e o valor de quem a sociedade costuma esquecer.

## Decisões de design
- **Dignidade, não fragilidade.** Ela é velha e simples, mas não é digna de pena: postura
  tranquila, olhar bondoso e roupa cuidada, embora gasta.
- **O cajado não vai no modelo.** Objeto na mão costuma deformar no auto-rig do Mixamo. O cajado
  vira uma peça separada, presa ao osso da mão no código (técnica da skill de animação:
  `multiplyScalar(1/modelScale)`). Assim ele também pode mudar de mão ou sumir.
- **A postura curvada vem da animação,** não do modelo. O modelo precisa estar ereto para o
  auto-rig funcionar.

## Silhueta
- **Vestido longo lilás** até os tornozelos, largo, também em forma de sino.
- **Xale creme** sobre os ombros, cruzado na frente. É a assinatura dela: o "lenço" que todos os
  personagens têm.
- **Cabelo grisalho preso num coque** baixo.
- Um pouco mais baixa que o jogador e com ombros estreitos.
- Sapatos simples e escuros.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Vestido | lilás `#a58bc4` |
| Xale | creme `#f1e4c8` |
| Pele | pêssego `#e8c09c`, com bochechas rosadas |
| Cabelo | grisalho `#d8d4cf` |
| Sapatos | marrom-escuro `#5a3d2b` |

## Estilo
O mesmo da Lume. Rosto redondo com pequenas linhas de sorriso nos olhos, sem rugas realistas.
Expressão de quem está contente com pouco.

## Requisitos técnicos (para o Mixamo)
- Corpo inteiro em **T-pose**, **ereta**, de frente, simétrica e **sem cajado**.
- Os braços precisam sair do xale, sem ficar presos a ele.
- Modelo `tripo-p1`, cerca de 6.000 faces.
- **Altura no jogo:** 1,3.

## Animações sugeridas no Mixamo
| Busca no Mixamo | Nome no jogo | Para quê |
|---|---|---|
| Old Man Idle (ou outro idle de pessoa idosa) | `idle` | parada, levemente curvada |
| Talking | `falar` | ao conversar |
| Thankful | `agradecer` | quando a água chega |
| Old Man Walk (ou outra caminhada de pessoa idosa) | `andar` | uso futuro |

Os nomes exatos variam no catálogo do Mixamo; procure por "old" e escolha pela pré-visualização.

## Prompt para o Tripo
> Low-poly stylized game character, a kind elderly grandmother, faceted flat-shaded style with
> simple rounded shapes. Long loose lilac dress reaching the ankles, slightly bell-shaped, and a
> cream shawl draped over her shoulders and crossed in front. Grey hair tied in a low bun,
> round friendly face with warm peach skin, rosy cheeks, simple dark dot eyes and a gentle
> smile. Simple dark brown shoes. Standing upright in T-pose with arms straight out to the sides
> and free from the shawl, facing forward, symmetrical, empty hands. Soft warm pastel colors,
> smooth flat textures, no background, no props, no walking stick.

Negativo: `realistic, photorealistic, wrinkles detail, high detail, walking stick, cane, hunched, text, base, pedestal, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=6000` (task `5a19c59d`) | 40 créditos. 5.791 faces, T-pose, ereta, sem cajado. Saldo: 155 → 115. Fiel à ficha. |
| 2026-10-06 | FBX para o Mixamo (`assets/mixamo/salvia_para_mixamo.fbx`) | Girado −90° em Z, texturas de 2048 para 1024, conferido de frente por renderização. |
| 2026-10-06 | Mixamo (feito pelo Alexandre) | Old Man Idle, Old Man Walk, Talking, Thankful: os 4 íntegros, 41 ossos |
| 2026-10-06 | GLB (`assets/modelos/salvia.glb`) | 1,07 MB, 4 clipes (`idle`, `andar`, `falar`, `agradecer`), `validate_glb.mjs` ok. Altura 1,25 medida na pose do idle (curvada). Medição pelos ossos ok nos 4. |
| 2026-10-06 | Aprovação clipe a clipe (Alexandre) | Os 4 aprovados, inclusive com o xale amontoado no `idle` |
| 2026-10-06 | Integrada no jogo (`trocarPorAnimado` + `comportamentoSalvia` em `main.js`) | `idle` apoiada no cajado; vira para o jogador e fala (`falar`); faz a reverência `agradecer` (3 s) quando a água chega; depois volta devagar a olhar para a ilha do jogador. **Cajado:** cilindro separado que acompanha a mão direita (`RightHand`), sempre na vertical, com o topo 0,08 acima da mão. Ficou natural no idle, na fala e no agradecimento. |

**Atenção no auto-rig:** o vestido vai até os tornozelos, então os joelhos ficam escondidos (como
na Lume, que funcionou). Posicione os marcadores dos joelhos na altura em que estariam, um pouco
acima da metade entre o quadril e os pés.
