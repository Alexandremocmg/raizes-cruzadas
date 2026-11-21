# Hospedagem na VPS

**Verificado em 2026-11-21.** Além de rodar localmente (veja o [README](../README.md#como-rodar)), o jogo está publicado numa VPS da Hostinger, em **https://raizes.kabemmanager.online**. Este documento descreve só o que é específico do Raízes Cruzadas. A infraestrutura compartilhada (usuário `jogos`, nginx, rotas do Traefik, firewall) e os passos para desfazer tudo estão no [runbook da VPS](https://github.com/Alexandremocmg/kabemjunto/blob/main/docs/OPERACAO-VPS.md#6-outros-jogos-hospedados-nesta-vps).

> Não registre neste repositório o IP da VPS, o link do terminal web da Hostinger, tokens ou senhas.

## Onde roda

| Item        | Valor                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Endereço    | `https://raizes.kabemmanager.online` (HTTPS pelo Traefik, certificado Let's Encrypt renovado sozinho)                              |
| Código      | `/srv/jogos/raizes`, clone da branch `main` deste repositório, de propriedade do usuário `jogos`                                   |
| Servido por | nginx dos jogos (`jogos-static.service`), escutando só em `172.18.0.1:8081`, atrás do Traefik                                      |
| Build       | **nenhum**: a raiz do repositório é servida como está                                                                              |
| Rota        | `/etc/easypanel/traefik/config/jogos-raizes.yaml`                                                                                  |
| DNS         | registro `A` `raizes` em `kabemmanager.online`, no hPanel da Hostinger                                                             |

## O que o servidor faz

- Serve arquivos estáticos. Só aceita `GET` e `HEAD`; os outros métodos recebem `403`.
- Como os módulos ES não têm hash no nome, `html`, `js`, `mjs`, `css`, `json` e `webmanifest` saem com `Cache-Control: no-cache`: o navegador revalida por ETag e pega a versão nova no próximo carregamento, sem limpar cache. Os demais tipos ficam sem `Cache-Control`.
- Caminhos com `/.` (como `.git`) devolvem `404`.
- **Serve a raiz inteira do repositório**, inclusive `docs/`, `scripts/` e os `.md`. O repositório é público, então não há nada novo exposto, mas **não coloque segredos nesta pasta**.
- Não há backend: o progresso fica só no navegador de cada jogador.

## Dependências externas

O navegador carrega, no momento de abrir o jogo, recursos de terceiros (observados em 2026-11-21): `unpkg.com` (o Three.js, pelo `importmap`) e `fonts.googleapis.com` e `fonts.gstatic.com` (fontes). Se o `unpkg.com` ficar fora do ar, o jogo não abre. Isso vale também para quem joga localmente.

## Publicar uma nova versão

Nada atualiza sozinho: um `git push` ou o merge de um PR **não** muda o que está no ar. Como `root` no terminal da VPS:

```bash
runuser -u jogos -- env HOME=/srv/jogos git -C /srv/jogos/raizes pull --ff-only
```

Não há build nem reinício: o nginx serve os arquivos novos de imediato. Se o `pull` falhar com `--ff-only`, há divergência local na VPS; pare e investigue, não force.

## Conferir

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://raizes.kabemmanager.online/        # 200 text/html
curl -s -o /dev/null -w "%{http_code}\n" https://raizes.kabemmanager.online/.git/config               # 404
```

Em um navegador, abra o endereço e confira que a ilha 3D aparece e que o botão **Começar** responde. O modo de teste (`/?debug`) também funciona em produção: expõe o estado do jogo em `window.rc` e salva o progresso numa chave separada.

## Voltar atrás

```bash
J="runuser -u jogos -- env HOME=/srv/jogos"
$J git -C /srv/jogos/raizes log --oneline -5
$J git -C /srv/jogos/raizes checkout --detach <sha>     # volta a uma versão
$J git -C /srv/jogos/raizes switch main                 # e, depois, volta à main
```

Para tirar o jogo do ar: `rm /etc/easypanel/traefik/config/jogos-raizes.yaml` (o Traefik descarrega o arquivo sozinho). Para o desfazer completo, veja o [runbook](https://github.com/Alexandremocmg/kabemjunto/blob/main/docs/OPERACAO-VPS.md#6-outros-jogos-hospedados-nesta-vps).

## O que foi verificado

Em 2026-11-21, de fora da VPS, em Chromium: a página carregou com WebGL ativo, **0** erros de console, **0** requisições falhas e **0** respostas 4xx/5xx; o certificado é válido até 2027-02-19; `/.git/config` devolve 404; a porta 8081 pelo IP público não responde. **Não** foram testados celular físico, Safari, Firefox nem a jornada completa do capítulo.
