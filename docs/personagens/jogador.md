# Jogador — ficha visual

## Quem é
O "tecelão de solos": quem recebe a ilha restaurada sem ter feito nada, leva a água do poço até
os outros e escolhe o que fica no Centro. É o personagem que o aluno controla, então **qualquer
pessoa precisa conseguir se ver nele**.

## Decisões de design
- **Aparência neutra:** sem traços marcados de gênero, idade indefinida entre adolescente e
  jovem adulto. Num jogo educacional, isso ajuda meninos e meninas a se identificarem.
- **Visual de quem carrega e serve,** não de herói: roupa simples de viagem, uma cabaça de água
  na cintura e nenhuma arma, armadura ou capa de "escolhido".
- **Altura de referência do jogo:** os outros personagens são medidos em relação a ele.

## Silhueta
- **Túnica creme até os joelhos,** um pouco em forma de sino (o "cone" da figura provisória), com
  cinto simples.
- **Lenço turquesa** no pescoço, com uma ponta longa solta. É a assinatura visual dele.
- **Cabaça de água pequena** presa ao cinto, do lado direito. É o único acessório, e liga o
  visual à mecânica principal.
- Cabelo curto e solto, calça simples e botas baixas de couro.

## Cores (Bíblia Visual)
| Parte | Cor |
|---|---|
| Túnica | creme `#fbf2e2` |
| Lenço | turquesa `#2fc4b2` |
| Pele | pêssego médio `#e8b994` |
| Cabelo | castanho `#6b4a33` |
| Cinto e botas | marrom `#8b6248` |
| Calça | areia `#d9c4a3` |
| Cabaça | ocre `#d9a066` |

## Estilo
O mesmo da Lume: low-poly arredondado, cores pastel quentes, texturas lisas, nada pontiagudo.
Expressão serena, com um leve sorriso.

## Requisitos técnicos (para o Mixamo)
- Corpo inteiro em **T-pose** (a Lume em T-pose funcionou bem no auto-rig), de frente, simétrico.
- Nada nas mãos. A cabaça fica presa ao cinto, longe das mãos e dos braços.
- Modelo `tripo-p1`, cerca de 6.000 faces.
- **Altura no jogo:** 1,45. A Lume tem 1,0.

## Animações sugeridas no Mixamo
| Busca no Mixamo | Nome no jogo | Para quê |
|---|---|---|
| Idle | `idle` | parado |
| Walking | `andar` | andar pela ilha |
| Picking Up | `tirar` | tirar água do poço |
| Throw (ou Toss) | `enviar` | lançar a água para outra ilha |

## Prompt para o Tripo
> Low-poly stylized game character, a gentle young traveler with a gender-neutral look,
> faceted flat-shaded style with simple rounded shapes. Knee-length cream tunic slightly
> bell-shaped with a simple brown belt, a small ochre water gourd hanging from the right side
> of the belt, and a turquoise scarf around the neck with one long loose tail. Short soft brown
> hair, warm medium peach skin, simple dark dot eyes and a calm small smile. Sand-colored
> trousers and low brown leather boots. Full body, standing in T-pose with arms straight out to
> the sides, facing forward, symmetrical, empty hands. Soft warm pastel colors, smooth flat
> textures, no background, no props in hands.

Negativo: `realistic, photorealistic, high detail, armor, weapon, sword, cape, crown, text, base, pedestal, scenery`.

## Andamento

| Data | Etapa | Resultado |
|---|---|---|
| 2026-10-06 | Tripo `text_to_model`, P1, `face_limit=6000` (task `af4ef3e2`) | 40 créditos. 5.942 faces, T-pose, sem esqueleto. Saldo: 195 → 155. Fiel à ficha: neutro, lenço turquesa, cabaça no cinto, pernas separadas. |
| 2026-10-06 | Inspeção na cena (`inspecao.html?modelo=jogador-estatico`) | Altura 1,45, igual à da figura provisória. Aprovação: Alexandre. |
| 2026-10-06 | FBX para o Mixamo (`assets/mixamo/jogador_para_mixamo.fbx`) | Girado −90° em Z (mesma orientação da Lume), texturas de 2048 para 1024, conferido de frente por renderização. |
| 2026-10-06 | Mixamo (feito pelo Alexandre) | Idle, Picking Up e Throw ok (41 ossos). **Walking.fbx veio corrompido** (download interrompido: 16 KB, "failed to read complete nested block"); precisa baixar de novo. |
| 2026-10-06 | GLB parcial (`assets/modelos/jogador.glb`) | 1,47 MB, 3 clipes (`idle`, `tirar`, `enviar`), `andar` pulado com aviso. `validate_glb.mjs` ok. Medição pelos ossos ok nos 3 (pé no chão, topo variando, deriva 0). |
| 2026-10-06 | Aprovação de `idle`, `tirar` e `enviar` (Alexandre) | Aprovados |
| 2026-10-06 | Walking baixado de novo (2,5 MB); GLB completo | 1,51 MB, 4 clipes, nenhum pulado, `validate_glb.mjs` ok. `andar` medido: pé no chão (−0,001 a 0,004), topo 1,55 a 1,59, deriva 0 (a caminhada avançava 68 unidades; zerado). |
| 2026-10-06 | Aprovação do `andar` (Alexandre) | Aprovado: os 4 clipes aprovados |
| 2026-10-06 | Integrado no jogo (`gesto()` / `GESTOS` em `main.js`) | Anda/para sozinho. **tirar:** janela 0–56% em 1,8 s; a água entra aos 42%, com as mãos lá embaixo. **enviar:** janela 0–60% em 1,1 s; a água sai da mão direita aos 65%. Vira para o poço ou para a ilha antes do gesto. Durante o gesto: sem movimento e sem botões. A água enviada é descontada no início do gesto (evita gastar duas vezes). |

**Para a integração:** o `tirar` dura 9,6 s, longo demais para "tirar água". Na integração,
recortar a janela útil (a parte em que ele abaixa e levanta) e acelerar, como na seção "Janelas
de clipe" da skill de animação.
