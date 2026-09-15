export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const appId = process.env.META_APP_ID || '';
  const redirectUri = process.env.META_REDIRECT_URI || '';
  const configId = process.env.META_CONFIG_ID || '';
  if (!appId || !redirectUri) {
    res.status(503).send('Meta App nao configurado. Defina META_APP_ID, META_APP_SECRET e META_REDIRECT_URI no Vercel.');
    return;
  }
  const state = typeof req.query.state === 'string' ? req.query.state : 'growbiz';

  // Login da empresa / Instagram onboarding (docs Meta).
  // Se META_CONFIG_ID existir, usa config_id (Facebook Login for Business).
  // Caso contrario, usa extras IG_API_ONBOARDING + scopes de conteudo.
  const params = new URLSearchParams();
  params.set('client_id', appId);
  params.set('redirect_uri', redirectUri);
  params.set('state', state);
  params.set('response_type', 'code');
  params.set('display', 'page');
  params.set('override_default_response_type', 'true');

  if (configId) {
    params.set('config_id', configId);
  } else {
    params.set(
      'extras',
      JSON.stringify({ setup: { channel: 'IG_API_ONBOARDING' } })
    );
    params.set(
      'scope',
      [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement',
        'business_management'
      ].join(',')
    );
  }

  const url = 'https://www.facebook.com/v21.0/dialog/oauth?' + params.toString();
  res.writeHead(302, { Location: url });
  res.end();
}
