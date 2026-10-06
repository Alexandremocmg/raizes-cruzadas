# Ferro — ficha visual

## Quem é
O vizinho amargo da ilha ao sul. No Ato 3 ele desvia a água do poço do jogador, e na Caverna do
Outro Olho o jogador descobre por quê: a ilha dele foi a primeira a secar, ele pediu ajuda e
ninguém mandou água, e hoje ele tem medo de secar de novo.

## Decisões de design
- **Ferido, não vilão.** É a regra mais importante desta ficha. Se o Ferro parecer mau, o jogo
  ensina o oposto do que quer, porque a Caverna existe para mostrar a dor por trás do gesto. Ele
  deve parecer **cansado, desconfiado e na defensiva**, nunca ameaçador: nada de olhos vermelhos,
  cicatrizes de luta, roupa preta ou pose agressiva.
- **A roupa conta a história da seca.** O casaco é bom, mas gasto, com remendos e a barra
  manchada de terra seca. Parece de alguém que já teve uma ilha verde.
- **Um detalhe de esperança:** um **remendo amarelo-desbotado** no casaco, a cor que ele
  "esqueceu" ("Minha ilha está verde. Eu tinha esquecido dessa cor."). Quem prestar atenção vai
  ligar uma coisa à outra no final.

## Silhueta
- **O mais alto dos quatro,** de ombros largos mas caídos para a frente: cansaço, não força.
- **Casaco longo cinza-azulado** até os joelhos, fechado, de gola alta.
- **Lenço cinza-escuro, gasto e com as pontas puídas,** enrolado no pescoço. É a assinatura dele:
  o mesmo lenço dos outros personagens, mas desbotado.
- Barba curta por fazer, cabelo escuro curto e desarrumado.
- Botas pesadas com terra seca na ponta.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Casaco | cinza-azulado `#5f6873` |
| Lenço | cinza-escuro `#2c3036` |
| Remendo | amarelo desbotado `#d9c27a` |
| Pele | pêssego bronzeado `#d4ab88` |
| Cabelo e barba | castanho-escuro `#3b2a22` |
| Botas | marrom `#6b4a33`, com terra `#a08e74` na ponta |

## Estilo
O mesmo da Lume e dos outros. Expressão: sobrancelhas um pouco baixas e boca reta, um olhar
cansado e desconfiado, **sem raiva**. Ao lado do jogador, deve parecer alguém que precisa de
ajuda e não sabe pedir.

## Requisitos técnicos (para o Mixamo)
- Corpo inteiro em **T-pose**, ereto, de frente, simétrico, mãos vazias.
- O casaco longo precisa deixar as pernas separadas (abertura na frente ou nas laterais), senão
  o auto-rig confunde as duas pernas.
- Modelo `tripo-p1`, cerca de 6.000 faces.
- **Altura no jogo:** 1,6.

## Animações sugeridas no Mixamo
| Busca no Mixamo | Nome no jogo | Para quê |
|---|---|---|
| Idle (algum com braços cruzados, se houver) | `idle` | parado, na defensiva |
| Talking | `falar` | ao conversar |
| Defeated | `abatido` | durante a Caverna do Outro Olho |
| Walking | `andar` | uso futuro (atravessar a ponte) |

## Prompt para o Tripo
> Low-poly stylized game character, a tall tired man with a guarded weary expression, not
> villainous, faceted flat-shaded style with simple rounded shapes. Long knee-length blue-grey
> coat with a high collar, worn and patched, with one faded pale-yellow patch on the chest and
> dusty dry-earth stains near the hem, the coat open at the front so both legs are clearly
> separate. A worn dark grey scarf with frayed ends around the neck. Short messy dark brown hair
> and short stubble beard, tanned peach skin, simple dark dot eyes under slightly lowered brows,
> neutral straight mouth. Heavy brown boots with dried dirt on the toes. Standing in T-pose with
> arms straight out to the sides, slightly slumped shoulders, facing forward, symmetrical, empty
> hands. Muted soft colors, smooth flat textures, no background, no props.

Negativo: `realistic, photorealistic, high detail, evil, villain, angry, scars, red eyes, black clothes, weapon, armor, text, base, pedestal, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=6000` (task `867cb05e`) | 40 créditos. 5.704 faces, T-pose. Saldo: 115 → 75. Olhar cansado e não vilão, casaco gasto com terra seca, abertura na frente. **Problema:** mangas azul saturado, já na imagem de referência do Tripo. O remendo amarelo saiu como várias manchas pequenas. |
| 2026-10-06 | Correção grátis (`scripts/recolorir_textura.py`, matiz 0,58–0,74, saturação ≥ 0,55 → `#7d8fa8`) | Só as mangas mudaram (10,2% da textura), conferido lado a lado. Original preservado em `model.glb`; corrigido em `model_mangas_corrigidas.glb`. |
| 2026-10-06 | FBX para o Mixamo (`assets/mixamo/ferro_para_mixamo.fbx`), a partir do corrigido | Girado −90° em Z, texturas de 2048 para 1024, conferido de frente. |
| 2026-10-06 | Aprovação do visual (Alexandre) | Aprovado, com as mangas corrigidas |
| 2026-10-06 | Mixamo: Male Standing Pose, Walking, Talking, Defeated | Os 4 íntegros, **65 ossos** (rig com dedos). |
| 2026-10-06 | GLB (`assets/modelos/ferro.glb`) | 1,4 MB, 4 clipes (`idle`, `andar`, `falar`, `abatido`), `validate_glb.mjs` ok. Medição: pé no chão e deriva 0 nos 4; `abatido` desce de 1,72 até 1,36. **`idle` está parado:** "Male Standing Pose" é uma pose de 2 quadros, sem movimento (topo fixo em 1,72). |
| 2026-10-06 | Idle trocado por **Neutral Idle** (264 quadros) | GLB remontado: 1,57 MB, `validate_glb.mjs` ok. Idle medido: pé no chão, topo 1,71 a 1,72 (movimento sutil), deriva 0. Postura com o peso numa perna e ombros caídos. |
| 2026-10-06 | Aprovação clipe a clipe (Alexandre) | Os 4 aprovados |
| 2026-10-06 | Integrado no jogo (`comportamentoFerro` em `main.js`) | `idle` acompanhando o jogador com o olhar; vira e fala (`falar`); `abatido` (janela inteira em 3,5 s, segura a pose final) da Caverna até o fim da revelação; **no final** (`ferroAtravessa`) anda pela ponte de raiz (altura seguindo o arco, 0,34 → 0,83) até dentro da ilha do jogador, em ~18 s. |
