export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ erro: 'Method Not Allowed' });
    return;
  }
  const appId = process.env.META_APP_ID || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const redirectUri = process.env.META_REDIRECT_URI || '';
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    configurado: Boolean(appId && appSecret && redirectUri),
    appIdPresente: Boolean(appId),
    redirectUri: redirectUri || null
  });
}
