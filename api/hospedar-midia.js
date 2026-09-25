export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const dataUrl = body.dataUrl || '';
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    res.status(400).json({
      erro: 'Envie a midia gerada nos Mocks (data URL base64) para hospedar publicamente antes de publicar no Instagram.'
    });
    return;
  }

  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
    res.status(400).json({ erro: 'Arquivo de midia invalido ou maior que 8MB.' });
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  if (!token) {
    res.status(503).json({
      erro:
        'A imagem dos Mocks ainda e local (base64). Para a Meta publicar, precisamos hospedar em HTTPS. ' +
        'Configure BLOB_READ_WRITE_TOKEN no Vercel (Storage → Blob) ou edite o card e cole uma URL HTTPS publica da imagem.'
    });
    return;
  }

  try {
    const { put } = await import('@vercel/blob');
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('mp4') ? 'mp4' : 'jpg';
    const blob = await put('growbiz/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext, buffer, {
      access: 'public',
      contentType,
      token
    });
    res.status(200).json({ ok: true, url: blob.url });
  } catch (e) {
    console.warn('hospedar-midia falhou:', e);
    res.status(502).json({
      erro: 'Falha ao hospedar a midia dos Mocks. Verifique o Blob no Vercel ou cole uma URL HTTPS no card do Kanban.'
    });
  }
}
