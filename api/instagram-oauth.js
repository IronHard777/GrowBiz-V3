export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const appId = process.env.META_APP_ID || '';
  const redirectUri = process.env.META_REDIRECT_URI || '';
  if (!appId || !redirectUri) {
    res.status(503).send('Meta App nao configurado. Defina META_APP_ID, META_APP_SECRET e META_REDIRECT_URI no Vercel.');
    return;
  }
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'business_management'
  ].join(',');
  const state = typeof req.query.state === 'string' ? req.query.state : 'growbiz';
  const url =
    'https://www.facebook.com/v21.0/dialog/oauth' +
    '?client_id=' + encodeURIComponent(appId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&state=' + encodeURIComponent(state) +
    '&scope=' + encodeURIComponent(scopes) +
    '&response_type=code';
  res.writeHead(302, { Location: url });
  res.end();
}
