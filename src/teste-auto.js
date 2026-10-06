// Testes automáticos de ponta a ponta. Rodam no navegador, em tempo real, com um "jogador robô"
// que usa os mesmos caminhos do jogador de verdade: anda até um ponto (como o toque no chão),
// aperta os botões de ação e clica nas opções dos painéis.
//
// Só carregam com ?debug&teste=<nome> na URL (o jogo normal nunca os baixa). Exemplos:
//   /?debug&teste=jornada     o capítulo inteiro, do começo à tela final (~5 min)
//   /?debug&teste=cisterna    a Cisterna como ídolo: promessa, exigência, rachadura, água apodrecendo
//   /?debug&teste=espelho     o Espelho como ídolo
//   /?debug&teste=agua        guardar água demais faz apodrecer
//   /?debug&teste=salvar      salvar e continuar no meio de um ídolo
//   /?debug&teste=ajustes     texto grande, narração lenta, som, recomeçar
//   /?debug&teste=todos       roda todos, um depois do outro (~8 min); o resumo fica em window.__teste.todos
//
// O resultado fica em window.__teste ({ resultados: [{ok, desc, extra}], fim, falhas, log }).

const dorme = (s) => new Promise((r) => setTimeout(r, s * 1000));

const ORDEM_TODOS = ['ajustes', 'agua', 'salvar', 'cisterna', 'espelho', 'jornada'];

export function iniciarTestes(rc, nome) {
  const params = new URLSearchParams(location.search);
  // "todos": a fila vem na URL (?todos=a,b,c); o resumo parcial fica no sessionStorage
  // (na última etapa a fila vem vazia — "todos=" — e isso ainda é o modo "todos", por isso has() e não get())
  const fila = params.has('todos') ? params.get('todos').split(',').filter(Boolean) : null;
  if (nome === 'todos') {
    sessionStorage.removeItem('rc-teste-todos');
    params.set('teste', ORDEM_TODOS[0]);
    params.set('todos', ORDEM_TODOS.slice(1).join(','));
    location.search = params.toString();
    return null;
  }
  const T = { nome, resultados: [], log: [], fim: false, falhas: 0, inicio: performance.now() };
  window.__teste = T;
  const V3 = rc.J.pos.constructor;

  const registro = (msg) => { T.log.push(`${((performance.now() - T.inicio) / 1000).toFixed(0)}s  ${msg}`); };
  function ok(cond, desc, extra) {
    T.resultados.push({ ok: !!cond, desc, extra });
    if (!cond) { T.falhas++; console.error('[teste] FALHOU:', desc, extra ?? ''); }
    registro(`${cond ? '✔' : '✘'} ${desc}${extra !== undefined ? ' → ' + JSON.stringify(extra) : ''}`);
  }
  /** Espera uma condição (em tempo real). Devolve se aconteceu dentro do prazo. */
  async function ate(cond, { tempo = 30, passo = 0.25 } = {}) {
    const limite = performance.now() + tempo * 1000;
    while (performance.now() < limite) {
      if (cond()) return true;
      await dorme(passo);
    }
    return !!cond();
  }
  const botoesAcao = () => [...document.querySelectorAll('#acoes .acao')];
  const textoBotao = (b) => b.textContent.replace(/^[E0-9]\s*/, '').trim();
  async function clicarAcao(parte, { tempo = 6 } = {}) {
    let achado = null;
    await ate(() => (achado = botoesAcao().find((b) => textoBotao(b).includes(parte))), { tempo });
    if (achado) achado.click();
    return !!achado;
  }
  async function clicarSeg(chave, parte) {
    return clicarNoPainel(`.seg[data-chave="${chave}"] button`, parte);
  }
  async function clicarNoPainel(seletor, parte, { tempo = 6 } = {}) {
    let achado = null;
    await ate(() => (achado = [...document.querySelectorAll(`#overlay ${seletor}`)].find((b) => b.textContent.includes(parte))), { tempo });
    if (achado) achado.click();
    return !!achado;
  }
  async function irPara(x, z, { tempo = 20 } = {}) {
    rc.J.alvo = new V3(x, 0.15, z);
    await ate(() => !rc.J.alvo, { tempo });
    const d = Math.hypot(rc.J.pos.x - x, rc.J.pos.z - z);
    return d < 1.2;
  }
  const falaNaTela = () => (document.getElementById('fala').classList.contains('hidden') ? '' : document.getElementById('fala').textContent);
  async function esperarLivre() { await ate(() => !rc.E.ocupado && !rc.ui.overlayAberto && !rc.J.acao, { tempo: 30 }); }

  // ---------- trechos reutilizáveis ----------
  async function comecar() {
    const botao = document.getElementById('btnComecar');
    await ate(() => !botao.disabled, { tempo: 40 }); // espera a tela de carregamento liberar
    botao.click();
    await ate(() => rc.E.ato === 1 && !rc.E.ocupado, { tempo: 40 });
  }
  async function tirarAguaDoPoco() {
    await esperarLivre();
    await irPara(-2.2, 3.6);
    const antes = rc.E.agua;
    if (!(await clicarAcao('Tirar água do poço'))) return false;
    return ate(() => rc.E.agua > antes, { tempo: 8 });
  }
  async function enviarPara(id, nomeNaTela) {
    await esperarLivre();
    await irPara(rc.DOCA[id].x, rc.DOCA[id].z);
    const antes = rc.E.doacoes;
    if (!(await clicarAcao(`Enviar água → ${nomeNaTela}`))) return false;
    return ate(() => rc.E.doacoes > antes, { tempo: 10 });
  }
  async function irAoCentro() { await esperarLivre(); return irPara(0, 2.6); }
  async function escolherNoCentro(parte) {
    await irAoCentro();
    if (!(await clicarAcao('Escolher o que vai no Centro'))) return false;
    return clicarNoPainel('.opcao', parte);
  }
  /** Pula as cenas até o Ato 2, sem apertar nada (o que vale testar é o que vem depois). */
  async function prepararAto2() {
    await comecar();
    rc.E.ato = 2; rc.E.tempoAto2 = 0;
    rc.E.avisos.add('dica-doca');
    await dorme(0.5);
  }

  // ===================================================================
  const CENARIOS = {
    // ---------------------------------------------------------------
    async jornada() {
      await comecar();
      ok(rc.E.ato === 1, 'a abertura termina e o jogo libera o controle (Ato 1)', rc.E.ato);
      ok(!document.getElementById('hud').classList.contains('hidden'), 'o HUD aparece');

      ok(await tirarAguaDoPoco(), 'tirar água do poço (gesto + botão)', rc.E.agua);
      ok(await enviarPara('salvia', 'Dona Sálvia'), 'enviar água para Dona Sálvia', rc.E.doacoes);
      ok(await ate(() => rc.E.ato === 2, { tempo: 12 }), 'depois da primeira doação o Centro aparece (Ato 2)', rc.E.ato);
      ok(rc.ui.diarioIds().includes('agua'), 'a página "Água que corre" do Diário foi desbloqueada');

      // segunda doação: a ponte de raiz cresce (saúde ≥ 55%)
      await tirarAguaDoPoco();
      await enviarPara('salvia', 'Dona Sálvia');
      ok(await ate(() => rc.pontes.salvia.crescendo, { tempo: 6 }), 'a ponte de raiz até a Sálvia começa a crescer', +rc.ilhas.salvia.alvoSaude.toFixed(2));
      ok(await ate(() => rc.pontes.salvia.pronta, { tempo: 12 }), 'a ponte fica pronta');

      // atravessa a ponte e conversa
      await esperarLivre();
      const sp = rc.npcs.salvia.fig.raiz.position;
      ok(await irPara(sp.x - 1.4, sp.z), 'o jogador atravessa a ponte e chega à ilha da Sálvia', [+rc.J.pos.x.toFixed(1), +rc.J.pos.z.toFixed(1)]);
      // narração que estiver na tela antes de conversar (sem cabeçalho de personagem)
      const cabecalho = () => document.querySelector('#fala b')?.textContent ?? '';
      const narracaoAntes = cabecalho() ? '' : falaNaTela();
      ok(await clicarAcao('Conversar com Dona Sálvia'), 'botão de conversar aparece perto dela');
      ok(await ate(() => cabecalho() === 'Dona Sálvia', { tempo: 2 }), 'a fala dela aparece NA HORA, na frente da narração', [cabecalho(), falaNaTela().slice(0, 50)]);
      if (narracaoAntes) {
        ok(await ate(() => falaNaTela().includes(narracaoAntes.slice(0, 25)), { tempo: 14 }), 'a narração cortada volta logo depois (nada se perde)', narracaoAntes.slice(0, 40));
      }

      // Centro: a Lume, e as três fases
      ok(await escolherNoCentro('Lume'), 'escolher a Lume para o Centro');
      ok(rc.E.centro === 'lume', 'a Lume está no Centro', rc.E.centro);
      const topo = rc.npcs.lume.fig.raiz.position.y;
      ok(Math.abs(topo - rc.CENTRO.topo) < 0.05, 'a Lume fica em cima do Centro', +topo.toFixed(2));
      ok(await ate(() => rc.E.fase === 'exigencia', { tempo: 60 }), 'fase 2: exigência', +rc.E.centroT.toFixed(1));
      ok(rc.E.centroT >= 17.5 && rc.E.centroT < 22, 'a exigência começa por volta de 18 s de jogo', +rc.E.centroT.toFixed(1));
      ok(await ate(() => rc.E.fase === 'rachadura', { tempo: 80 }), 'fase 3: rachadura', +rc.E.centroT.toFixed(1));
      ok(await ate(() => rc.npcs.lume.cinza > 0.3, { tempo: 30 }), 'a Lume perde a cor', +rc.npcs.lume.cinza.toFixed(2));
      ok(rc.ilhas.casa.racha > 0.05, 'a ilha racha', +rc.ilhas.casa.racha.toFixed(2));

      // Ferro rouba a água → Caverna
      ok(await ate(() => rc.E.ato === 3, { tempo: 90 }), 'Ferro desvia a água (Ato 3)', +rc.E.tempoAto2.toFixed(0));
      ok(await ate(() => document.querySelector('#overlay .cartas'), { tempo: 30 }), 'abre a Caverna do Outro Olho');
      ok(document.getElementById('overlay').classList.contains('lateral'), 'o painel da Caverna fica de lado (a cena continua visível)');
      ok(rc.F.abatido, 'Ferro está abatido durante a Caverna');
      await clicarNoPainel('.carta', 'Um julgamento');
      ok(document.querySelector('#overlay .cav-msg').textContent.includes('julgamento'), 'um julgamento é recusado com explicação');
      await clicarNoPainel('.carta', 'a ilha de Ferro foi a primeira');
      await clicarNoPainel('.carta', 'ele pediu água');
      await clicarNoPainel('.carta', 'vou secar de novo');
      ok(await clicarNoPainel('.btn', 'Pôr um limite'), 'as três respostas aparecem; escolhe "Pôr um limite"');
      ok(document.querySelector('#overlay .resultado')?.textContent.includes('ferir de novo'), 'a resposta explica que perdoar não é se expor de novo');
      ok(await clicarNoPainel('.btn', 'Olhar para baixo'), 'segue para a revelação');
      ok(await ate(() => rc.E.ato === 4 && !rc.E.ocupado, { tempo: 40 }), 'a Fonte é revelada e o controle volta (Ato 4)');
      ok(rc.E.fonteLiberada && rc.ui.diarioIds().includes('fonte'), 'a Fonte vira uma opção e a página final do Diário aparece');
      ok(!rc.F.abatido, 'Ferro se levanta');

      // Fonte no Centro
      await irAoCentro();
      if (rc.E.centro) { await clicarAcao('Tirar'); await ate(() => !rc.E.centro, { tempo: 5 }); }
      ok(await escolherNoCentro('A Fonte'), 'colocar a Fonte no Centro');
      ok(rc.E.centro === 'fonte', 'a Fonte está no Centro');
      const pl = rc.npcs.lume.fig.raiz.position, cl = rc.npcs.lume.casa;
      ok(Math.hypot(pl.x - cl.x, pl.z - cl.z) < 2.5, 'a Lume voltou para a ilha dela', [+pl.x.toFixed(1), +pl.z.toFixed(1)]);
      const cinza0 = rc.npcs.lume.cinza;
      await dorme(6);
      ok(cinza0 < 0.05 || rc.npcs.lume.cinza < cinza0, 'a Lume recupera a cor aos poucos', [+cinza0.toFixed(2), +rc.npcs.lume.cinza.toFixed(2)]);

      // Leva água às três ilhas até todas ficarem bem
      const ordem = [['salvia', 'Dona Sálvia'], ['lume', 'Lume'], ['ferro', 'Ferro']];
      for (let volta = 0; volta < 14 && rc.E.ato === 4; volta++) {
        const faltando = ordem.filter(([id]) => rc.ilhas[id].alvoSaude < 0.8 || !rc.pontes[id].pronta);
        if (!faltando.length) break;
        const [id, nome] = faltando[0];
        if (rc.E.agua < 1) await tirarAguaDoPoco();
        await enviarPara(id, nome);
        await dorme(0.4);
      }
      ok(ordem.every(([id]) => rc.ilhas[id].alvoSaude >= 0.8), 'as três ilhas ficam saudáveis', ordem.map(([id]) => +rc.ilhas[id].alvoSaude.toFixed(2)));
      ok(await ate(() => rc.E.ato === 5, { tempo: 15 }), 'o final começa');
      ok(rc.E.seguirFerro, 'a câmera acompanha o Ferro');
      ok(await ate(() => rc.F.rota, { tempo: 6 }), 'o Ferro sai da ilha dele pela ponte');
      ok(await ate(() => rc.E.finalFase === 2, { tempo: 60 }), 'o Ferro chega e a câmera sobe para o mapa');
      const pf = rc.npcs.ferro.fig.raiz.position;
      ok(Math.hypot(pf.x, pf.z) < 8, 'o Ferro terminou dentro da ilha do jogador', [+pf.x.toFixed(1), +pf.z.toFixed(1)]);
      ok(await ate(() => document.querySelector('#overlay h2')?.textContent.includes('Fim'), { tempo: 60 }), 'a tela final aparece com as perguntas para conversar');
      ok(rc.salvar.lerJogo() === null, 'o jogo salvo foi apagado ao terminar (reabrir começa do início)');
    },

    // ---------------------------------------------------------------
    async cisterna() {
      await prepararAto2();
      // junta o máximo de água possível durante a promessa
      ok(await escolherNoCentro('Cisterna'), 'escolher a Cisterna');
      ok(rc.objCentro.cisterna.visible, 'a Cisterna aparece sobre o Centro');
      const t0 = rc.E.centroT;
      await esperarLivre();
      await irPara(-2.2, 3.6);
      await ate(() => rc.E.poco >= 7 || rc.E.fase !== 'promessa', { tempo: 20 });
      ok(rc.E.fase === 'promessa' && rc.E.poco >= 7, 'promessa: o poço rende muito mais (cisterna enchendo)', +rc.E.poco.toFixed(1));
      await clicarAcao('Tirar água do poço');
      ok(await ate(() => rc.E.agua >= 6, { tempo: 8 }), 'dá para guardar muita água na promessa', rc.E.agua);
      const aguaAntes = rc.E.agua;

      ok(await ate(() => rc.E.fase === 'exigencia', { tempo: 30 }), 'fase 2: exigência');
      ok(rc.E.poco <= 4.01, 'na exigência o poço volta ao normal (o estoque some)', +rc.E.poco.toFixed(1));
      // tenta enviar água: "você hesita"
      await esperarLivre();
      await irPara(rc.DOCA.salvia.x, rc.DOCA.salvia.z);
      const doacoes = rc.E.doacoes;
      await clicarAcao('Enviar água → Dona Sálvia');
      ok(await ate(() => falaNaTela().includes('hesita'), { tempo: 5 }), 'enviar água na exigência: "Você hesita…"', falaNaTela().slice(0, 50));
      ok(rc.E.doacoes === doacoes, 'a água não sai da Cisterna na exigência');
      ok(await ate(() => rc.E.agua < aguaAntes, { tempo: 20 }), 'a água guardada vai sumindo (apodrece e o centro "pede mais")', [aguaAntes, rc.E.agua]);

      ok(await ate(() => rc.E.fase === 'rachadura', { tempo: 40 }), 'fase 3: rachadura', +rc.E.centroT.toFixed(0));
      ok(rc.E.centroT - t0 >= 35, 'a rachadura vem depois de ~40 s de jogo no Centro');
      ok(await ate(() => rc.ilhas.casa.racha > 0.05, { tempo: 15 }), 'a ilha racha');
      ok(rc.ui.diarioIds().includes('cisternas'), 'a página "Cisternas rotas" é desbloqueada');
      ok(await ate(() => rc.E.agua === 0, { tempo: 30 }), 'na rachadura toda a água guardada apodrece', rc.E.agua);

      // tirar a cisterna: o peso sai
      await irAoCentro();
      ok(await clicarAcao('Tirar a Cisterna do Centro'), 'tirar a Cisterna do Centro');
      ok(!rc.E.centro && !rc.objCentro.cisterna.visible, 'o Centro fica vazio');
      const r0 = rc.ilhas.casa.racha;
      await dorme(4);
      ok(rc.ilhas.casa.racha <= r0 + 0.001, 'as rachaduras param de crescer', [+r0.toFixed(2), +rc.ilhas.casa.racha.toFixed(2)]);
    },

    // ---------------------------------------------------------------
    async espelho() {
      await prepararAto2();
      ok(await escolherNoCentro('Espelho'), 'escolher o Espelho');
      ok(rc.objCentro.espelho.visible, 'o Espelho aparece sobre o Centro');
      const textos = () => [...document.querySelectorAll('#rotulos .flutua')].map((e) => e.textContent);
      ok(await ate(() => textos().length > 0, { tempo: 10 }), 'promessa: aparecem aplausos sobre as outras ilhas', textos());
      // dá água durante a promessa
      await tirarAguaDoPoco();
      await enviarPara('salvia', 'Dona Sálvia');
      ok(await ate(() => textos().some((t) => t.includes('generosidade')), { tempo: 6 }), 'na promessa: "Que generosidade! Todos vão saber!"', textos());
      const saudePromessa = rc.ilhas.salvia.alvoSaude;

      ok(await ate(() => rc.E.fase === 'exigencia', { tempo: 40 }), 'fase 2: exigência');
      await tirarAguaDoPoco();
      const antes = rc.ilhas.salvia.alvoSaude;
      await enviarPara('salvia', 'Dona Sálvia');
      await dorme(1.5);
      const ganho = rc.ilhas.salvia.alvoSaude - antes;
      ok(ganho > 0 && ganho < 0.08, 'na exigência dar "sem plateia" rende pouco (0,05)', +ganho.toFixed(2));
      ok(textos().some((t) => t.includes('ninguém viu')), 'aparece "ninguém viu… isso conta?"', textos());

      ok(await ate(() => rc.E.fase === 'rachadura', { tempo: 50 }), 'fase 3: rachadura');
      const s0 = ['salvia', 'lume', 'ferro'].map((id) => rc.ilhas[id].alvoSaude);
      await dorme(8);
      const s1 = ['salvia', 'lume', 'ferro'].map((id) => rc.ilhas[id].alvoSaude);
      // (as que já estão no piso de 0,15 não têm como secar mais)
      const acima = s0.map((v, i) => [v, s1[i]]).filter(([v]) => v > 0.2);
      ok(acima.length >= 2 && acima.every(([v, w]) => v - w > 0.05), 'as ilhas vizinhas secam de um jeito visível com o Espelho na rachadura', [s0.map((v) => +v.toFixed(2)), s1.map((v) => +v.toFixed(2))]);
    },

    // ---------------------------------------------------------------
    async agua() {
      await comecar();
      rc.E.avisos.add('dica-doca');
      // guarda mais de 4 de água
      for (let i = 0; i < 4 && rc.E.agua <= 4; i++) {
        await tirarAguaDoPoco();
        await dorme(3.8);
      }
      ok(rc.E.agua > 4, 'o jogador consegue guardar mais de 4 de água', rc.E.agua);
      const antes = rc.E.agua;
      ok(await ate(() => rc.E.agua < antes, { tempo: 12 }), 'água parada apodrece', [antes, rc.E.agua]);
      ok(await ate(() => falaNaTela().includes('apodrece') || rc.E.avisos.has('apodrece'), { tempo: 4 }), 'a frase "Água parada apodrece" é mostrada');
      ok(rc.ui.diarioIds().includes('agua'), 'a página do Diário sobre a água é desbloqueada');
    },

    // ---------------------------------------------------------------
    async salvar() {
      await prepararAto2();
      ok(await escolherNoCentro('Lume'), 'Lume no Centro');
      await ate(() => rc.E.fase === 'exigencia', { tempo: 40 });
      await tirarAguaDoPoco();
      await dorme(3.5); // espera o salvamento automático (a cada 3 s)
      const salvo = rc.salvar.lerJogo();
      ok(salvo && salvo.centro === 'lume' && salvo.fase === 'exigencia', 'o jogo foi salvo sozinho, com o Centro e a fase', salvo && [salvo.centro, salvo.fase]);
      const antes = salvo; // o que foi realmente gravado (o jogo seguiu mudando nos segundos depois)
      // "fecha e abre": zera o estado e restaura do que foi salvo
      rc.E.centro = null; rc.E.fase = null; rc.E.agua = 0; rc.E.ato = 1;
      rc.aplicarEstado(rc.salvar.lerJogo());
      const depois = rc.coletarEstado();
      for (const chave of ['ato', 'agua', 'centro', 'fase', 'chegouRachadura', 'doacoes', 'fonteLiberada']) {
        ok(JSON.stringify(antes[chave]) === JSON.stringify(depois[chave]), `restaurar mantém "${chave}"`, [antes[chave], depois[chave]]);
      }
      ok(Math.abs(antes.centroT - depois.centroT) < 0.05, 'restaurar mantém o tempo do ídolo no Centro', [+antes.centroT.toFixed(1), +depois.centroT.toFixed(1)]);
      for (const id of ['casa', 'salvia', 'lume', 'ferro']) {
        ok(Math.abs(antes.saude[id][0] - depois.saude[id][0]) < 0.001, `restaurar mantém a saúde da ilha "${id}"`, [+antes.saude[id][0].toFixed(2), +depois.saude[id][0].toFixed(2)]);
      }
      ok(Math.abs(rc.npcs.lume.fig.raiz.position.y - rc.CENTRO.topo) < 0.05, 'a Lume continua em cima do Centro depois de restaurar');
      await dorme(1);
      ok(rc.E.centro === 'lume', 'o ídolo continua depois de restaurar e rodar o jogo');
    },

    // ---------------------------------------------------------------
    async ajustes() {
      await comecar();
      document.getElementById('btnAjustes').click();
      ok(await ate(() => document.querySelector('#overlay .seg'), { tempo: 3 }), 'o painel de Ajustes abre');
      await clicarSeg('texto', 'Maior');
      ok(getComputedStyle(document.documentElement).getPropertyValue('--tx').trim() === '1.5', 'texto "Maior" aplica a escala 1,5');
      const tam = parseFloat(getComputedStyle(document.getElementById('fala')).fontSize);
      ok(tam > 24, 'a narração fica maior na tela', tam);
      await clicarSeg('narracao', 'Lenta');
      ok(rc.ui.velNarracao > 1.4, 'a narração fica mais lenta', rc.ui.velNarracao);
      await clicarSeg('som', 'Desligado');
      ok(rc.som.ligado === false, 'o som é desligado');
      ok(document.getElementById('btnSom').textContent.includes('🔇'), 'o botão do som mostra desligado');
      const guardado = JSON.parse(localStorage.getItem('raizes-cruzadas:ajustes:v1'));
      ok(guardado && guardado.texto === 1.5 && guardado.som === false, 'os ajustes ficam guardados no navegador', guardado);
      // o botão 🔊 do HUD liga o som de novo; depois devolve tudo ao normal
      rc.ui.fecharOverlay();
      document.getElementById('btnSom').click();
      ok(rc.som.ligado === true, 'o botão 🔊 liga o som de novo');
      document.getElementById('btnAjustes').click();
      await ate(() => document.querySelector('#overlay .seg'), { tempo: 3 });
      await clicarSeg('texto', 'Normal');
      await clicarSeg('narracao', 'Normal');
      rc.ui.fecharOverlay();
      ok(rc.ui.velNarracao === 1 && getComputedStyle(document.documentElement).getPropertyValue('--tx').trim() === '1', 'os ajustes voltam ao normal');
    },
  };

  if (fila !== null && !fila.length) T.todos = JSON.parse(sessionStorage.getItem('rc-teste-todos') || '[]');
  (async () => {
    try {
      registro(`início do teste "${nome}"`);
      if (!CENARIOS[nome]) throw new Error(`cenário desconhecido: ${nome}`);
      // medição de desempenho junto
      const f0 = rc.E.frames ?? 0, w0 = performance.now();
      await CENARIOS[nome]();
      const f1 = rc.E.frames ?? 0, w1 = performance.now();
      T.fps = +(((f1 - f0) / ((w1 - w0) / 1000))).toFixed(1);
      registro(`desempenho médio: ${T.fps} quadros/s`);
    } catch (e) {
      ok(false, `o teste parou com erro: ${e.message}`, String(e.stack).split('\n').slice(0, 3));
    }
    T.fim = true;
    registro(`FIM: ${T.resultados.filter((r) => r.ok).length} ok, ${T.falhas} falhas`);

    // Encadeado: guarda o resultado e segue para o próximo cenário
    if (fila) {
      const acumulado = JSON.parse(sessionStorage.getItem('rc-teste-todos') || '[]');
      acumulado.push({ cenario: nome, ok: T.resultados.filter((r) => r.ok).length, falhas: T.falhas, fps: T.fps, falharam: T.resultados.filter((r) => !r.ok).map((r) => r.desc) });
      sessionStorage.setItem('rc-teste-todos', JSON.stringify(acumulado));
      if (fila.length) {
        params.set('teste', fila[0]);
        params.set('todos', fila.slice(1).join(','));
        setTimeout(() => { location.search = params.toString(); }, 800);
      } else {
        T.todos = acumulado;
        T.todosFim = true;
        registro(`TODOS: ${acumulado.map((a) => `${a.cenario} ${a.falhas ? '✘' : '✔'}`).join(' · ')}`);
      }
    }
  })();
  return T;
}
