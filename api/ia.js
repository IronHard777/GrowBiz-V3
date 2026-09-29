import { despacharAcao, statusIa } from './_lib/geminiCore.js';

function lerBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  return body || {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    res.status(200).json(statusIa());
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Method Not Allowed' });
    return;
  }

  const body = lerBody(req);
  const action = String(body.action || '').trim();
  if (!action) {
    res.status(400).json({ erro: 'action obrigatoria' });
    return;
  }

  try {
    if (action === 'status') {
      res.status(200).json(statusIa());
      return;
    }
    const resultado = await despacharAcao(action, body);
    if (resultado && typeof resultado === 'object' && resultado.erro === 'acao desconhecida') {
      res.status(400).json(resultado);
      return;
    }
    res.status(200).json({ ok: true, resultado });
  } catch (erro) {
    console.warn('api/ia falhou:', erro);
    res.status(502).json({ erro: 'falha ao processar pedido de IA' });
  }
}
