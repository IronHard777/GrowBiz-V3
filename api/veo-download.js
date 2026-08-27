export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const uri = typeof req.query.uri === 'string' ? req.query.uri : '';
  if (!uri) {
    res.status(400).send('uri ausente');
    return;
  }

  let destino;
  try {
    destino = new URL(uri);
  } catch {
    res.status(400).send('uri invalida');
    return;
  }
  if (!destino.hostname.endsWith('googleapis.com')) {
    res.status(400).send('host nao permitido');
    return;
  }

  const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const alvo = uri.includes('key=')
    ? uri
    : `${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(chave)}`;

  try {
    const remoto = await fetch(alvo);
    const buffer = Buffer.from(await remoto.arrayBuffer());
    res.status(remoto.status);
    res.setHeader('Content-Type', remoto.headers.get('content-type') || 'video/mp4');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (erro) {
    console.warn('Proxy Veo download falhou:', erro);
    res.status(502).send('falha ao baixar video');
  }
}
