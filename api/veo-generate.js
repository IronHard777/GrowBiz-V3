import { obterChaveGemini } from './_lib/chaveGemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const prompt = String(corpo.prompt || '');
  const modelo = String(corpo.modelo || 'veo-3.1-generate-preview');

  if (!prompt) {
    res.status(400).send('prompt obrigatorio');
    return;
  }

  const chave = obterChaveGemini();
  if (!chave) {
    res.status(503).json({ error: { message: 'GEMINI_API_KEY ausente no servidor' } });
    return;
  }

  const alvo = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:predictLongRunning?key=${encodeURIComponent(chave)}`;

  try {
    const remoto = await fetch(alvo, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          resolution: '720p',
          aspectRatio: '9:16',
          durationSeconds: 8
        }
      })
    });
    const texto = await remoto.text();
    res.status(remoto.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(texto);
  } catch (erro) {
    console.warn('Proxy Veo generate falhou:', erro);
    res.status(502).json({ error: { message: 'falha ao iniciar geracao de video' } });
  }
}
