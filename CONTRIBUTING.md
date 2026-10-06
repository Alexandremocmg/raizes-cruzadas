# Como contribuir com o Raízes Cruzadas

Que bom que você quer ajudar! Este é um jogo feito em comunidade para ajudar pessoas a entenderem,
pela experiência, por que amar a Deus sobre todas as coisas.

## Antes de começar
- Leia o [GDD](docs/GDD.md), principalmente os **pilares** e a **Bíblia Visual**. Toda contribuição
  precisa respeitar os pilares (a graça vem primeiro; ídolos são coisas boas no lugar errado; sem
  pontuação moral visível; a falha tem volta).
- O jogo é **educacional e alegórico**: a Fonte nunca é chamada de "Deus" dentro do jogo. A camada
  explícita fica no Diário da Fonte.

## Rodar localmente
```bash
python -m http.server 5180 --bind 127.0.0.1
```
Abra <http://127.0.0.1:5180>. Com `?debug` no endereço, o estado do jogo fica em `window.rc`.

## Onde conversar
- **[Discussions](https://github.com/Alexandremocmg/raizes-cruzadas/discussions):** relatos de quem
  jogou, ideias, perguntas e propostas de capítulos ou mecânicas. Comece por aqui.
- **Issues:** para algo concreto a corrigir ou fazer (um erro, uma tarefa já combinada).

## Formas de ajudar
- **Testar com grupos** (escolas, igrejas, jovens) e contar o que funcionou e o que confundiu, em
  *Discussions › Show and tell*.
- **Código:** correções, desempenho em celular, acessibilidade.
- **Conteúdo:** diálogos, páginas do Diário, o guia do educador, novos capítulos (proponha primeiro
  em *Discussions › Ideas*).
- **Arte e som:** sempre seguindo a Bíblia Visual (low-poly luminoso, a Fonte é a única luz fria e
  vem de baixo).

## Personagens e modelos
O processo está documentado em `docs/personagens/` e nos scripts de `scripts/`:
Tripo (malha) → Mixamo (rig e animações) → `montar_personagem_glb.py` → `validate_glb.mjs` →
página de inspeção (`inspecao.html?modelo=...`) → aprovação → integração.

Os arquivos brutos do Mixamo **não** ficam no repositório (termos da Adobe). Para remontar um
personagem, suba o `assets/mixamo/<nome>_para_mixamo.fbx` no Mixamo, baixe os clipes listados na
ficha dele e coloque em `assets/mixamo/<nome>/`.

## Regras
- **Nunca** envie arquivos `.env`, chaves de API ou dados pessoais.
- Mensagens de commit e documentação em português.
- Toda contribuição de conteúdo entra sob CC BY-SA 4.0; de código, sob MIT
  (ver [LICENSE-CONTEUDO.md](LICENSE-CONTEUDO.md)).
