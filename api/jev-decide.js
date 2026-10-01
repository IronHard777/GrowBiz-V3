import { decide, statusJev } from './_lib/jevCore.js';
import { temChaveTypesafe } from './_lib/chaveTypesafe.js';

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
    res.status(200).json(statusJev());
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Method Not Allowed' });
    return;
  }

  if (!temChaveTypesafe()) {
    res.status(503).json({ erro: 'TYPESAFE_API_KEY nao configurada' });
    return;
  }

  const body = lerBody(req);
  const prompt = body.prompt;
  const schema = body.schema;
  if (prompt === undefined || prompt === null || prompt === '') {
    res.status(400).json({ erro: 'prompt obrigatorio' });
    return;
  }
  if (!schema || typeof schema !== 'object') {
    res.status(400).json({ erro: 'schema obrigatorio' });
    return;
  }

  try {
    const resultado = await decide(prompt, schema, { model: body.model });
    res.status(200).json({ ok: true, resultado });
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.warn('api/jev-decide falhou:', msg);
    if (msg.includes('chave TypeSafe') || msg.includes('TYPESAFE_API_KEY')) {
      res.status(401).json({ erro: msg });
      return;
    }
    if (msg.includes('limite de taxa') || msg.includes('sobrecarregado')) {
      res.status(429).json({ erro: msg });
      return;
    }
    if (msg.includes('schema') || msg.includes('questions') || msg.includes('pedido TypeSafe invalido')) {
      res.status(400).json({ erro: msg });
      return;
    }
    res.status(502).json({ erro: msg || 'falha ao processar pedido Jev' });
  }
}
