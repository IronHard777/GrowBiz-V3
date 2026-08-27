import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig(() => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'veo-download-proxy',
        configureServer(server) {
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
              const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
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

          const lerCorpoJson = (req: import('http').IncomingMessage) =>
            new Promise<string>((resolve, reject) => {
              const partes: Buffer[] = [];
              req.on('data', (c) => partes.push(Buffer.from(c)));
              req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
              req.on('error', reject);
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
              const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
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
              const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
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
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
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
