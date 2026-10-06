// Progresso e ajustes salvos no próprio navegador (localStorage). Sem login, sem servidor, sem
// coleta de dados: importante para o público escolar. Tudo envolvido em try/catch porque o
// armazenamento pode estar bloqueado (janela anônima, política da escola, cota cheia).
//
// Em modo de teste (?debug) usa outra chave, para nunca sobrescrever o jogo de verdade.
const DEBUG = new URLSearchParams(location.search).has('debug');
const SUFIXO = DEBUG ? ':debug' : '';
const CHAVE_JOGO = `raizes-cruzadas:jogo:v1${SUFIXO}`;
const CHAVE_AJUSTES = 'raizes-cruzadas:ajustes:v1';

function ler(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch { return null; }
}
function escrever(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch { return false; }
}

export const salvar = {
  lerJogo() {
    const s = ler(CHAVE_JOGO);
    return s && s.versao === 1 && typeof s.ato === 'number' ? s : null;
  },
  gravarJogo(estado) { return escrever(CHAVE_JOGO, { versao: 1, quando: Date.now(), ...estado }); },
  apagarJogo() { try { localStorage.removeItem(CHAVE_JOGO); } catch { /* sem armazenamento */ } },

  lerAjustes() {
    return { texto: 1, narracao: 1, som: true, ...(ler(CHAVE_AJUSTES) ?? {}) };
  },
  gravarAjustes(a) { return escrever(CHAVE_AJUSTES, a); },
};
