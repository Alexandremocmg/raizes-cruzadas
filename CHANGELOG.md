# Histórico de versões

Formato livre, do mais novo para o mais antigo. Datas no formato ano-mês-dia.

## 1.0 — Capítulo 1 pronto para grupos (2026-10-06)

**Para quem joga**
- **Salvar e continuar:** o progresso é salvo sozinho, só no navegador. Na tela inicial aparecem *Continuar* e *Novo jogo*.
- **Ajustes (⚙):** tamanho do texto, velocidade da narração, som e recomeçar do início.
- **Som suave** sintetizado por código, com botão 🔊 para silenciar.
- **Poço, Cisterna e Espelho** novos (modelos 3D gerados no Tripo).
- **Tela de carregamento:** o jogo só começa com tudo pronto.
- **Mais leve:** de 21,6 MB para cerca de 5 MB no primeiro acesso.

**Correções**
- O Ferro andava e olhava de costas para o jogador (giro de 180° nos eixos X e Z).
- A fala de um personagem agora aparece na hora, na frente da narração (que volta logo depois).
- No final, a câmera acompanha o Ferro atravessando a ponte de raiz antes de subir para o mapa.
- Na Caverna do Outro Olho, o painel fica de lado (embaixo, no celular) e o Ferro continua visível.
- Os aplausos do Espelho aparecem em volta do jogador; as ilhas vizinhas secam de um jeito visível.

**Para quem ensina**
- **Guia do educador** (`guia.html`): roteiro de aula de 50 minutos, perguntas por momento do jogo, versão para ambientes laicos, cuidados e perguntas frequentes.

**Para quem constrói**
- **Testes automáticos de ponta a ponta** (`?debug&teste=todos`): 98 verificações, com um jogador robô em tempo real.
- Novos scripts: `otimizar_glb.py`, `tingir_textura.py`.
- Fichas visuais e andamento de cada peça em `docs/personagens/` e `docs/objetos/`.

## 0.2 — Comunidade e personagens (2026-10-06)
- Repositório aberto (código em MIT, conteúdo em CC BY-SA 4.0), guia de contribuição e Discussions.
- Jogador, Lume, Dona Sálvia e Ferro com modelos animados (Tripo + Mixamo); Centro e árvore-mãe.
- Jogo publicado no GitHub Pages.

## 0.1 — Protótipo (2026-10-05)
- Capítulo 1 jogável com personagens e cenários feitos por código: a ilha dada, a água que corre, o Centro e os ídolos, a Caverna do Outro Olho, a revelação da Fonte e o final.
- Diário da Fonte (camada explícita e opcional, versículos na ARC).

## Ainda não existe
- Música composta.
- Mais capítulos além do primeiro.
- Versão em outros idiomas.
