export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const appId = process.env.META_APP_ID || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const redirectUri = process.env.META_REDIRECT_URI || '';
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const erroOAuth = typeof req.query.error === 'string' ? req.query.error : '';
  const erroDesc = typeof req.query.error_description === 'string' ? req.query.error_description : '';

  const html = (payload) => '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Instagram</title></head>' +
    '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">' +
    '<p id="msg">Conectando Instagram...</p><script>' +
    'const payload = ' + JSON.stringify(payload) + ';' +
    'try { if (window.opener) { window.opener.postMessage({ type: "growbiz-instagram-oauth", ...payload }, window.location.origin); }' +
    ' localStorage.setItem("growbiz_ig_oauth_result", JSON.stringify(payload)); } catch (e) {}' +
    'document.getElementById("msg").textContent = payload.ok ? "Conta conectada. Voce pode fechar esta janela." : ("Falha: " + (payload.erro || "desconhecida"));' +
    'setTimeout(function () { window.close(); }, 1200);' +
    '</script></body></html>';

  if (erroOAuth) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html({ ok: false, erro: erroDesc || erroOAuth }));
    return;
  }
  if (!code || !appId || !appSecret || !redirectUri) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html({ ok: false, erro: 'Codigo OAuth ou credenciais Meta ausentes.' }));
    return;
  }

  try {
    const tokenUrl =
      'https://graph.facebook.com/v21.0/oauth/access_token' +
      '?client_id=' + encodeURIComponent(appId) +
      '&client_secret=' + encodeURIComponent(appSecret) +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&code=' + encodeURIComponent(code);
    const tokenRes = await fetch(tokenUrl);
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html({ ok: false, erro: (tokenJson.error && tokenJson.error.message) || 'Falha ao trocar codigo por token.' }));
      return;
    }

    let accessToken = tokenJson.access_token;
    const longUrl =
      'https://graph.facebook.com/v21.0/oauth/access_token' +
      '?grant_type=fb_exchange_token&client_id=' + encodeURIComponent(appId) +
      '&client_secret=' + encodeURIComponent(appSecret) +
      '&fb_exchange_token=' + encodeURIComponent(accessToken);
    const longRes = await fetch(longUrl);
    const longJson = await longRes.json();
    if (longJson.access_token) accessToken = longJson.access_token;

    const pagesRes = await fetch(
      'https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=' +
        encodeURIComponent(accessToken)
    );
    const pagesJson = await pagesRes.json();
    const paginaComIg = (pagesJson.data || []).find((p) => p.instagram_business_account && p.instagram_business_account.id);
    if (!paginaComIg) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html({
        ok: false,
        erro: 'Nenhuma Pagina do Facebook com conta Instagram Business/Creator vinculada foi encontrada.'
      }));
      return;
    }

    const sessao = {
      ok: true,
      accessToken: paginaComIg.access_token || accessToken,
      pageId: paginaComIg.id,
      pageName: paginaComIg.name,
      igUserId: paginaComIg.instagram_business_account.id,
      igUsername: paginaComIg.instagram_business_account.username || null,
      expiresIn: longJson.expires_in || null,
      conectadoEm: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html(sessao));
  } catch (erro) {
    console.warn('instagram-callback falhou:', erro);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html({ ok: false, erro: 'Erro interno no callback OAuth.' }));
  }
}
