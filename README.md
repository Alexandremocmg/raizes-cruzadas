# Raízes Cruzadas

Jogo web educacional, single-player, em Three.js (low-poly luminoso), sobre **por que amar a Deus
sobre todas as coisas**, mostrado por mecânicas e não por sermão.

Visão completa, mecânicas, Bíblia Visual e plano de assets: [`docs/GDD.md`](docs/GDD.md).

## Como rodar

Sem build e sem npm. O Three.js vem por CDN (importmap), igual ao *esconde-ou-morre*.

```bash
python -m http.server 5180 --bind 127.0.0.1
```

Depois abra <http://127.0.0.1:5180>. Use `127.0.0.1` e não `localhost`: nesta máquina há outro
servidor na porta 5180 que responde por `localhost`.

Modo de teste: `http://127.0.0.1:5180/?debug` expõe o estado do jogo em `window.rc`, para
inspecionar pelo console.

## Controles

- **PC:** WASD ou setas para andar · **E** para a ação principal · **2–4** para as outras · **Esc** fecha painéis
- **Celular:** toque no chão para andar e use os botões na parte de baixo

## Mapa de arquivos

| Arquivo | O que faz |
|---|---|
| `src/main.js` | Roteiro do capítulo, estado do jogo, mecânicas (poço, Centro, ídolos, Caverna, Fonte), movimento e câmera |
| `src/mundo.js` | Renderer, céu, mar com a Fonte (shader), colunas de luz, partículas e bloom |
| `src/ilha.js` | Ilhas procedurais (saúde, saturação, rachaduras, ouro) e pontes de raiz |
| `src/figura.js` | Personagens provisórios low-poly. Hoje só aparecem se um modelo animado não carregar |
| `src/personagem.js` | Carrega personagens animados (GLB do Mixamo): tamanho pelos ossos, clipes, "perder a cor" |
| `inspecao.html` | Página de inspeção de modelos e clipes (`?modelo=lume`) para aprovar antes de integrar |
| `scripts/` | `glb_para_fbx_mixamo.py` (Tripo → Mixamo), `montar_personagem_glb.py` (Mixamo → GLB), `validate_glb.mjs` |
| `src/ui.js` | Narração, botões de ação, rótulos, overlay e Diário |
| `src/diario.js` | Páginas do Diário da Fonte, a camada explícita e opcional |
