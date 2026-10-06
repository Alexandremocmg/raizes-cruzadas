# Raízes Cruzadas — Documento de Design (GDD)

> Versão 0.1 · 2026-10-05 · Equipe: Alexandre, Claude e Deus.

## 1. Visão

Um jogo contemplativo em que o jogador descobre, **jogando**, por que amar a Deus sobre todas as
coisas é o que torna possível amar bem as pessoas.

O jogo não prega. Ele deixa o jogador colocar coisas boas no centro da própria ilha e **sentir**
o que acontece quando elas ocupam um lugar que não aguentam ocupar.

**Público:** educacional (escolas, grupos de jovens, educadores). **Plataforma:** web (PC e celular).
**Formato:** single-player, capítulos de 15 a 20 minutos.

## 2. Pilares

1. **A graça vem primeiro.** A ilha é restaurada antes de o jogador fazer qualquer coisa (1Jo 4:19).
2. **Ídolos são coisas boas no lugar errado.** Eles prometem, depois exigem e por fim racham (Jr 2:13).
3. **Amar a Deus não compete com amar as pessoas: é a condição para amá-las bem.**
4. **Sem pontuação moral visível.** O aprendizado acontece na experiência e na conversa depois.
5. **A falha tem volta.** Tirar o ídolo do centro é sempre possível; as rachaduras viram veios de ouro.

## 3. Camadas de explicitação

| Camada | O quê | Para quem |
|---|---|---|
| 1. Jogo | Totalmente alegórico. A Fonte nunca é chamada de "Deus". | Todos, inclusive escola laica |
| 2. Diário da Fonte | Páginas opcionais com o versículo e a reflexão por trás de cada mecânica | Quem quiser ir além |
| 3. Guia do educador | Perguntas para discussão após cada capítulo *(a fazer)* | Professores e líderes |

## 4. Mecânicas

### 4.1 O poço e a água
- O poço gera água sozinho. O jogador não sabe de onde ela vem (só descobre no Ato 3).
- **Água parada apodrece:** acima de 4 unidades guardadas, a água começa a se perder.
- Enviar água para outra ilha a recupera. Com saúde ≥ 55%, **cresce uma ponte de raiz** e é
  possível ir até lá conversar.

### 4.2 O Centro da Ilha (mecânica principal)
O jogador escolhe o que ocupa o centro. Cada ídolo passa por três fases:

| Fase | Tempo | Sensação | Efeito |
|---|---|---|---|
| Promessa | 0–18 s | "Isso funciona!" | Ilha supersaturada e brilhante, bônus forte |
| Exigência | 18–40 s | "Preciso manter isso…" | O ídolo consome água; a mecânica de dar é prejudicada |
| Rachadura | 40 s+ | "Por que tudo está quebrando?" | Rachaduras crescem, a ilha seca, pedaços caem |

| Ídolo | Promessa | Exigência | Rachadura |
|---|---|---|---|
| **Cisterna** (segurança) | Poço rende 3× | Não consegue mais dar | Água apodrece rápido |
| **Espelho** (reconhecimento) | Aplausos por toda parte | Dar "sem plateia" rende pouco | As outras ilhas secam |
| **Lume** (pessoa amada) | Calor e companhia | Lume não pode sair; a ilha dela seca | Lume perde a cor: ninguém aguenta ser o centro de alguém |
| **A Fonte** *(após o Ato 3)* | — | — | Sustenta por baixo; rachaduras viram ouro; dar não esvazia |

Um centro **vazio** também drena devagar: "Algo sempre acaba ocupando o lugar."

### 4.3 Caverna do Outro Olho
Quando Ferro desvia a água do poço, o jogador não revida. Ele escolhe, entre cinco fragmentos, os
três que são **a história de Ferro** (memórias e medos) e descarta os **julgamentos**. Depois
escolhe como responder:
- **Escutar**
- **Oferecer**
- **Pôr um limite** — perdoar não é deixar alguém te ferir de novo.

## 5. Capítulo 1 (protótipo jogável)

| Ato | Nome | O que acontece |
|---|---|---|
| 0 | A Ilha Dada | A ilha se desfaz no escuro; uma luz de baixo a restaura de graça |
| 1 | Água que Corre | Tirar água do poço e enviar a quem não pode retribuir |
| 2 | O Centro | Os ídolos: promessa → exigência → rachadura |
| 3 | O que Corre Embaixo | Ferro desvia a água · Caverna do Outro Olho · revelação da Fonte |
| 4 | A Fonte no Centro | Escolha livre; com a Fonte, dar já não esvazia e as raízes de luz aparecem |
| 5 | Final | Vista de cima: todas as ilhas sempre estiveram ligadas pela mesma Fonte |

**Personagens:** Lume (criança curiosa), Ferro (vizinho amargo), Dona Sálvia (idosa que não tem
como retribuir).

## 6. Bíblia Visual — low-poly luminoso

**Regras**
- Facetas visíveis (flat shading) em tudo: terreno, mar, personagens e objetos.
- Formas simples e arredondadas; nada pontiagudo ou agressivo, exceto o que é ídolo em ruína.
- A luz conta a história: o sol é quente; **a Fonte é a única luz fria (ciano-branca)** e sempre vem de baixo.
- Bloom suave apenas no que é sagrado ou vivo (Fonte, botões das raízes, água).

**Paleta por estado**

| Estado | Cores |
|---|---|
| Ilha viva | grama `#8fd36c` · terra `#e3ad6e` · rocha `#bb8b6c` · flores `#ff9ec4` `#ffd166` |
| Ilha seca | `#bfae88` · `#a08e74` · `#76695f` |
| Ídolo (promessa) | as mesmas cores com saturação 1,45×: bonito demais, quase artificial |
| Rachadura | `#3a2a22`; com a Fonte, vira ouro `#ffc861` emissivo |
| A Fonte | `#c9fbff` / `#bff6ff`, sempre de baixo para cima |
| Céu e névoa | topo `#68aee0` · horizonte `#ffd9ac` · névoa `#f3d3ae` |

**Personagens:** corpo em cone, cabeça facetada, lenço com ponta solta (a "assinatura" visual de
cada um), olhos simples. Quando forem gerados no Tripo, devem manter **essa silhueta e essas cores**.

## 7. Plano de assets (Tripo → Mixamo → Blender → Three.js)

Pipeline já validada no *esconde-ou-morre*: malha estática do Tripo → rig e clipes no Mixamo →
`merge_mixamo_glb.py` → `validate_glb.mjs` → página de inspeção → aprovação clipe a clipe.

| Fase | O quê | Créditos (estimativa) |
|---|---|---|
| Agora (saldo 235) | Lume como teste de estilo + 3 peças-chave (Centro, árvore-mãe, cisterna) | ~150–210 |
| Depois (Opção B, recarga) | Jogador, Ferro, Dona Sálvia, kit modular de ilhas | ~1.500 |

**Regra:** nenhuma geração sem custo informado e autorização do Alexandre.

## 8. Fora do protótipo (ideias para depois)
- Raízes invisíveis: dar **sem ser visto** gera raízes mais profundas.
- Mapa de ecos: o impacto das ações aparece muito tempo depois, em lugares inesperados.
- Capítulo do "aprendiz": jogar como alguém que precisa **receber** (sem tratar deficiência como punição).
- Guia do educador em PDF.
- Música e som ambiente.
