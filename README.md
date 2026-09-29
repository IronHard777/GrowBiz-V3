# GrowBiz V3

App de consultoria de marketing com IA (Gemini) e publicação Instagram.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copie `.env.example` para `.env.local` e defina **apenas** chaves de servidor:
   - `GEMINI_API_KEY` — usada pelas rotas `/api/ia` e `/api/veo-*` (nunca no browser)
   - `XAI_API_KEY` — se aplicável
   - `BLOB_READ_WRITE_TOKEN`, `META_*` conforme Instagram/Blob
3. Run the app:
   `npm run dev`

> As rotas `/api/*` são servidas em produção pelo Vercel. No `vite` local, o `vite.config.ts` faz proxy das rotas de IA/Veo usando `GEMINI_API_KEY` do ambiente.

## Segurança das chaves

- **Não** defina `VITE_GEMINI_API_KEY` nem `VITE_XAI_API_KEY` — qualquer `VITE_*` entra no bundle público.
- No Vercel: configure `GEMINI_API_KEY` (e `XAI_API_KEY` se usar) como Secret de Runtime.
- Após deploy deste código, remova variáveis `VITE_*` de IA do projeto Vercel e rotacione chaves se já foram expostas.

https://ai.studio/apps/499cf078-8316-441e-9161-502bc33d550d
