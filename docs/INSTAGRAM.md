# Instagram Content Publishing (GrowBiz-V3)

## O que foi implementado
- Botao **Conectar Instagram** no Kanban (OAuth Meta).
- Botao **Publicar no Instagram** nos cards de Instagram Reels / Feed.
- Rotas serverless: `/api/instagram-status`, `/api/instagram-oauth`, `/api/instagram-callback`, `/api/instagram-publish`.

## Variaveis no Vercel (Project Settings → Environment Variables)
- `META_APP_ID` — App ID do Meta for Developers
- `META_APP_SECRET` — App Secret
- `META_REDIRECT_URI` — ex.: `https://growbiz-v3.vercel.app/api/instagram-callback`
- `META_CONFIG_ID` — (opcional) Configuration ID do Facebook Login for Business; se preenchido, o OAuth usa config_id em vez de scope

Cadastre a mesma Redirect URI no painel do App Meta (Facebook Login → Valid OAuth Redirect URIs).

## Conta necessaria
- Instagram **Business** ou **Creator** vinculada a uma **Pagina do Facebook**.
- Em modo desenvolvimento do App Meta, so contas de teste / roles do app conseguem autenticar.
- Para uso amplo: App Review com a permissao `instagram_content_publish`.

## Publicar midia
A Graph API exige **URL publica HTTPS** da imagem (Feed) ou video (Reels).
No card do Kanban, preencha o campo **URL publica da midia (HTTPS)** antes de clicar em Publicar.
Blobs locais / data URLs (imagem gerada no browser) nao sao aceitos pela Meta sem hospedagem previa.

## Fluxo
1. Configure as 3 env vars e redeploy.
2. No Kanban: Conectar Instagram → autorizar.
3. Edite o card com URL HTTPS da midia + copy.
4. Publicar no Instagram → card vai para Publicadas.
