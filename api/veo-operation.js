export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const nome = typeof req.query.name === 'string' ? req.query.name : '';
  if (!nome || nome.includes('://') || nome.includes('..')) {
    res.status(400).send('name ausente');
    return;
  }

  const chave = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const alvo = `https://generativelanguage.googleapis.com/v1beta/${nome}?key=${encodeURIComponent(chave)}`;

  try {
    const remoto = await fetch(alvo);
    const texto = await remoto.text();
    res.status(remoto.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(texto);
  } catch (erro) {
    console.warn('Proxy Veo operation falhou:', erro);
    res.status(502).json({ error: { message: 'falha ao consultar operacao' } });
  }
}
