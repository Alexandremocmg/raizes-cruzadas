// Aberta direto do disco (file://), a página não roda: o navegador bloqueia os módulos e o
// carregamento dos modelos. Em vez de uma tela muda, explica o que fazer.
if (location.protocol === 'file:') {
  const pagina = location.pathname.split('/').pop() || 'index.html';
  const url = `http://127.0.0.1:5180/${pagina}${location.search}`;
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:999;display:grid;place-items:center;padding:16px;' +
    'background:#10141f;color:#fff9ee;font:16px/1.6 Nunito,system-ui,sans-serif;text-align:center';
  d.innerHTML = `<div style="max-width:520px">
    <h2 style="margin:0 0 8px">Abra pelo servidor, não pelo arquivo</h2>
    <p>Aberta direto do disco, a página não consegue carregar o jogo nem os modelos 3D.</p>
    <p>Com o servidor rodando (<code>python -m http.server 5180 --bind 127.0.0.1</code> na pasta do projeto), abra:</p>
    <p><a style="color:#ffd27a;font-weight:800" href="${url}">${url}</a></p></div>`;
  addEventListener('DOMContentLoaded', () => document.body.appendChild(d));
}
