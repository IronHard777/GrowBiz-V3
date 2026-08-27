export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const prompt = String(corpo.prompt || '');
  const videoUri = String(corpo.videoUri || '');
  const modelo = String(corpo.modelo || 'veo-3.1-generate-preview');

  if (!prompt || !videoUri) {
    res.status(400).send('prompt e videoUri obrigatorios');
    return;
  }
  if (!videoUri.includes('googleapis.com')) {
    res.status(400).send('uri nao permitida');
    return;
  }

  const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const alvo = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:predictLongRunning?key=${encodeURIComponent(chave)}`;

  try {
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
    res.status(remoto.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(texto);
  } catch (erro) {
    console.warn('Proxy Veo extend falhou:', erro);
    res.status(502).json({ error: { message: 'falha ao estender video' } });
  }
}
