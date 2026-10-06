# Raízes Cruzadas

Jogo web educacional, single-player, em Three.js (low-poly luminoso), sobre **por que amar a Deus
sobre todas as coisas**, mostrado por mecânicas e não por sermão.

Você recebe uma ilha restaurada sem ter feito nada para isso, leva água a quem não pode retribuir
e escolhe o que vai ocupar o **centro** da sua ilha. Coisas boas no lugar errado (segurança,
reconhecimento, alguém que você ama) prometem, depois exigem e por fim racham tudo. Até que você
descobre o que sempre correu por baixo de todas as ilhas.

**Projeto aberto e feito em comunidade.** Para ajudar, veja o [guia de contribuição](CONTRIBUTING.md).

Visão completa, mecânicas, Bíblia Visual e plano de assets: [`docs/GDD.md`](docs/GDD.md).

## Como rodar

Sem build e sem npm. O Three.js vem por CDN (importmap).

```bash
python -m http.server 5180 --bind 127.0.0.1
```

Depois abra <http://127.0.0.1:5180>. Abrir o `index.html` direto do disco não funciona: o navegador
bloqueia os módulos e os modelos 3D.

Modo de teste: `http://127.0.0.1:5180/?debug` expõe o estado do jogo em `window.rc`, para
inspecionar pelo console.

## Controles

- **PC:** WASD ou setas para andar · **E** para a ação principal · **2–4** para as outras · **Esc** fecha painéis
- **Celular:** toque no chão para andar e use os botões na parte de baixo

## Mapa de arquivos

| Arquivo | O que faz |
|---|---|
| `src/main.js` | Roteiro do capítulo, estado do jogo, mecânicas (poço, Centro, ídolos, Caverna, Fonte), comportamento dos personagens, movimento e câmera |
| `src/mundo.js` | Renderer, céu, mar com a Fonte (shader), colunas de luz, partículas e bloom |
| `src/ilha.js` | Ilhas procedurais (saúde, saturação, rachaduras, ouro) e pontes de raiz |
| `src/personagem.js` | Carrega personagens animados (GLB): tamanho pelos ossos, clipes, "perder a cor" |
| `src/figura.js` | Personagens provisórios low-poly. Só aparecem se um modelo animado não carregar |
| `src/ui.js` | Narração, botões de ação, rótulos, overlay e Diário |
| `src/diario.js` | Páginas do Diário da Fonte, a camada explícita e opcional |
| `inspecao.html` | Página de inspeção de modelos e clipes (`?modelo=lume`) para aprovar antes de integrar |
| `scripts/` | `glb_para_fbx_mixamo.py` (Tripo → Mixamo), `montar_personagem_glb.py` (Mixamo → GLB), `validate_glb.mjs`, `recolorir_textura.py`, `conferir_fbx.py` |
| `docs/` | GDD, fichas visuais e andamento de cada personagem e objeto |

## Licença

Código sob **MIT** ([`LICENSE`](LICENSE)). História, textos, documentos e modelos 3D sob
**CC BY-SA 4.0**, com exceção das animações do Mixamo ([`LICENSE-CONTEUDO.md`](LICENSE-CONTEUDO.md)).
