import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import type { IncomingMessage, ServerResponse } from 'http';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function lerCorpoJson(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const partes: Buffer[] = [];
    req.on('data', (c) => partes.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', reject);
  });
}

function chaveGeminiServidor(): string {
  return process.env.GEMINI_API_KEY || '';
}

/** Adapta Connect req/res para o shape simples dos handlers Vercel. */
function criarResAdapter(res: ServerResponse) {
  let code = 200;
  const headers: Record<string, string> = {};
  const api: any = {
    status(c: number) { code = c; return api; },
    setHeader(k: string, v: string) { headers[k] = v; res.setHeader(k, v); return api; },
    json(obj: unknown) {
      res.statusCode = code;
      if (!headers['Content-Type']) res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(obj));
    },
    send(body: unknown) {
      res.statusCode = code;
      if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        res.end(body);
      } else if (typeof body === 'object' && body !== null) {
        if (!headers['Content-Type']) res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      } else {
        res.end(body == null ? '' : String(body));
      }
    }
  };
  return api;
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'growbiz-api-proxy',
        configureServer(server) {
          // /api/ia — importa o mesmo handler do Vercel
          server.middlewares.use('/api/ia', async (req, res) => {
            try {
              let body: unknown = undefined;
              if (req.method === 'POST') {
                const raw = await lerCorpoJson(req);
                try { body = JSON.parse(raw || '{}'); } catch { body = {}; }
              }
              const vercelReq: any = {
                method: req.method,
                body,
                query: Object.fromEntries(new URL(req.url || '', 'http://localhost').searchParams)
              };
              const handler = (await server.ssrLoadModule('/api/ia.js')).default;
              await handler(vercelReq, criarResAdapter(res));
            } catch (erro) {
              console.warn('Proxy /api/ia falhou:', erro);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ erro: 'falha ao processar pedido de IA' }));
            }
          });

          server.middlewares.use('/api/veo-download', async (req, res) => {
            try {
              if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }
              const pedido = new URL(req.url || '', 'http://localhost');
              const uri = pedido.searchParams.get('uri');
              if (!uri) {
                res.statusCode = 400;
                res.end('uri ausente');
                return;
              }
              const destino = new URL(uri);
              if (!destino.hostname.endsWith('googleapis.com')) {
                res.statusCode = 400;
                res.end('host nao permitido');
                return;
              }
              const chave = chaveGeminiServidor();
              const alvo = uri.includes('key=')
                ? uri
                : `${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(chave)}`;
              const remoto = await fetch(alvo);
              res.statusCode = remoto.status;
              res.setHeader('Content-Type', remoto.headers.get('content-type') || 'video/mp4');
              res.setHeader('Cache-Control', 'no-store');
              const buffer = Buffer.from(await remoto.arrayBuffer());
              res.end(buffer);
            } catch (erro) {
              console.warn('Proxy Veo falhou:', erro);
              res.statusCode = 502;
              res.end('falha ao baixar video');
            }
          });

          server.middlewares.use('/api/veo-generate', async (req, res) => {
            try {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }
              const corpo = JSON.parse((await lerCorpoJson(req)) || '{}');
              const vercelReq: any = { method: 'POST', body: corpo, query: {} };
              const handler = (await server.ssrLoadModule('/api/veo-generate.js')).default;
              await handler(vercelReq, criarResAdapter(res));
            } catch (erro) {
              console.warn('Proxy Veo generate falhou:', erro);
              res.statusCode = 502;
              res.end(JSON.stringify({ error: { message: 'falha ao iniciar geracao de video' } }));
            }
          });

          server.middlewares.use('/api/veo-extend', async (req, res) => {
            try {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }
              const corpo = JSON.parse((await lerCorpoJson(req)) || '{}');
              const prompt = String(corpo.prompt || '');
              const videoUri = String(corpo.videoUri || '');
              const modelo = String(corpo.modelo || 'veo-3.1-generate-preview');
              if (!prompt || !videoUri) {
                res.statusCode = 400;
                res.end('prompt e videoUri obrigatorios');
                return;
              }
              if (!videoUri.includes('googleapis.com')) {
                res.statusCode = 400;
                res.end('uri nao permitida');
                return;
              }
              const chave = chaveGeminiServidor();
              const alvo = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:predictLongRunning?key=${encodeURIComponent(chave)}`;
              const remoto = await fetch(alvo, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instances: [{ prompt, video: { uri: videoUri } }],
                  parameters: {
                    sampleCount: 1,
                    resolution: '720p',
                    aspectRatio: '9:16'
                  }
                })
              });
              const texto = await remoto.text();
              res.statusCode = remoto.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(texto);
            } catch (erro) {
              console.warn('Proxy Veo extend falhou:', erro);
              res.statusCode = 502;
              res.end(JSON.stringify({ error: { message: 'falha ao estender video' } }));
            }
          });

          server.middlewares.use('/api/veo-operation', async (req, res) => {
            try {
              if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }
              const pedido = new URL(req.url || '', 'http://localhost');
              const nome = pedido.searchParams.get('name');
              if (!nome || nome.includes('://') || nome.includes('..')) {
                res.statusCode = 400;
                res.end('name ausente');
                return;
              }
              const chave = chaveGeminiServidor();
              const alvo = `https://generativelanguage.googleapis.com/v1beta/${nome}?key=${encodeURIComponent(chave)}`;
              const remoto = await fetch(alvo);
              const texto = await remoto.text();
              res.statusCode = remoto.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(texto);
            } catch (erro) {
              console.warn('Proxy Veo operation falhou:', erro);
              res.statusCode = 502;
              res.end(JSON.stringify({ error: { message: 'falha ao consultar operacao' } }));
            }
          });
        }
      }
    ],
    // Chaves de IA NÃO entram no bundle do cliente.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
