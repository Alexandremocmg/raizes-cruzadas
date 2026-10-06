// Acompanha o carregamento dos modelos 3D para a tela inicial. O jogo só libera o "Começar" quando
// tudo terminou (ou falhou, ou passou do tempo): assim o jogador nunca vê as figuras provisórias
// "trocando" pelos modelos finais. Falha continua visível no console (fallback silencioso esconde defeito).
const estado = new Map(); // nome -> 'carregando' | 'ok' | 'erro'
let ouvinte = () => {};

export function resumo() {
  const v = [...estado.values()];
  return {
    total: v.length,
    feitos: v.filter((x) => x !== 'carregando').length,
    falhas: v.filter((x) => x === 'erro').length,
  };
}

export const carga = {
  /** Registra uma promessa de carregamento. Devolve a própria promessa, sem engolir o erro. */
  registrar(nome, promessa) {
    estado.set(nome, 'carregando');
    promessa
      .then(() => estado.set(nome, 'ok'), (erro) => {
        console.error(`[carga] "${nome}" não carregou:`, erro);
        estado.set(nome, 'erro');
      })
      .finally(() => ouvinte(resumo()));
    ouvinte(resumo());
    return promessa;
  },
  aoMudar(fn) { ouvinte = fn; fn(resumo()); },
  resumo,
};
