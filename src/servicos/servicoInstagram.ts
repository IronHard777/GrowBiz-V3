/** Integracao Instagram Graph API (Content Publishing) via rotas /api/instagram-*. */

export interface SessaoInstagram {
  accessToken: string;
  pageId: string;
  pageName?: string;
  igUserId: string;
  igUsername?: string | null;
  expiresIn?: number | null;
  conectadoEm: string;
}

const CHAVE_SESSAO = 'growbiz_ig_sessao';

export function OBTER_SESSAO_INSTAGRAM(): SessaoInstagram | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const parsed = JSON.parse(bruto) as SessaoInstagram;
    if (!parsed?.accessToken || !parsed?.igUserId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function SALVAR_SESSAO_INSTAGRAM(sessao: SessaoInstagram): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function LIMPAR_SESSAO_INSTAGRAM(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

export async function VERIFICAR_META_CONFIGURADO(): Promise<{
  configurado: boolean;
  appIdPresente: boolean;
  redirectUri: string | null;
}> {
  const res = await fetch('/api/instagram-status');
  if (!res.ok) return { configurado: false, appIdPresente: false, redirectUri: null };
  return res.json();
}

/** Abre popup OAuth Meta e resolve com a sessao ou rejeita com erro. */
export function CONECTAR_INSTAGRAM_OAUTH(): Promise<SessaoInstagram> {
  return new Promise((resolve, reject) => {
    const largura = 640;
    const altura = 720;
    const left = window.screenX + (window.outerWidth - largura) / 2;
    const top = window.screenY + (window.outerHeight - altura) / 2;
    const popup = window.open(
      '/api/instagram-oauth?state=growbiz',
      'growbiz_ig_oauth',
      `width=${largura},height=${altura},left=${left},top=${top}`
    );
    if (!popup) {
      reject(new Error('Popup bloqueado. Permita janelas pop-up para conectar o Instagram.'));
      return;
    }

    const limpar = () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data;
      if (!data || data.type !== 'growbiz-instagram-oauth') return;
      limpar();
      popup.close();
      if (data.ok && data.accessToken && data.igUserId) {
        const sessao: SessaoInstagram = {
          accessToken: data.accessToken,
          pageId: data.pageId,
          pageName: data.pageName,
          igUserId: data.igUserId,
          igUsername: data.igUsername,
          expiresIn: data.expiresIn,
          conectadoEm: data.conectadoEm || new Date().toISOString()
        };
        SALVAR_SESSAO_INSTAGRAM(sessao);
        resolve(sessao);
      } else {
        reject(new Error(data.erro || 'Falha na autenticacao Instagram.'));
      }
    };

    window.addEventListener('message', onMessage);

    const timer = window.setInterval(() => {
      // Fallback: resultado gravado no localStorage pelo callback
      try {
        const bruto = localStorage.getItem('growbiz_ig_oauth_result');
        if (!bruto) return;
        const data = JSON.parse(bruto);
        localStorage.removeItem('growbiz_ig_oauth_result');
        limpar();
        if (popup && !popup.closed) popup.close();
        if (data.ok && data.accessToken && data.igUserId) {
          const sessao: SessaoInstagram = {
            accessToken: data.accessToken,
            pageId: data.pageId,
            pageName: data.pageName,
            igUserId: data.igUserId,
            igUsername: data.igUsername,
            expiresIn: data.expiresIn,
            conectadoEm: data.conectadoEm || new Date().toISOString()
          };
          SALVAR_SESSAO_INSTAGRAM(sessao);
          resolve(sessao);
        } else {
          reject(new Error(data.erro || 'Falha na autenticacao Instagram.'));
        }
      } catch {
        /* ignore */
      }
      if (popup.closed) {
        limpar();
        reject(new Error('Janela de autenticacao fechada antes de concluir.'));
      }
    }, 600);

    const timeout = window.setTimeout(() => {
      limpar();
      if (popup && !popup.closed) popup.close();
      reject(new Error('Tempo esgotado ao conectar Instagram.'));
    }, 180000);
  });
}

async function chamarPublishApi(body: Record<string, unknown>): Promise<any> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch('/api/instagram-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) {
      throw new Error(json.erro || 'Falha ao publicar no Instagram.');
    }
    return json;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tempo esgotado na API do Instagram. Tente de novo.');
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}

async function aguardarContainerPronto(
  sessao: { accessToken: string; igUserId: string },
  containerId: string,
  onProgress?: (msg: string) => void,
  tentativas = 40
): Promise<void> {
  let lastStatus = '';
  let lastDetail = '';
  for (let i = 0; i < tentativas; i++) {
    onProgress?.('Processando midia no Instagram… (' + (i + 1) + '/' + tentativas + ')');
    if (i > 0) await new Promise((r) => setTimeout(r, 2500));
    const st = await chamarPublishApi({
      accessToken: sessao.accessToken,
      igUserId: sessao.igUserId,
      action: 'status',
      containerId
    });
    lastStatus = st.status_code || '';
    lastDetail = st.status || '';
    if (lastStatus === 'FINISHED') return;
    if (lastStatus === 'ERROR') {
      throw new Error(
        'Processamento da midia falhou no Instagram. ' +
          (lastDetail || 'Confira se a URL HTTPS e publica e do tipo certo (imagem no Feed, .mp4/.mov no Reels).')
      );
    }
    // IN_PROGRESS / PUBLISHED / vazio: continua
  }
  throw new Error(
    'Timeout aguardando a Meta processar a midia (status: ' + (lastStatus || 'vazio') + '). ' +
      'Se a URL for valida, tente de novo em alguns segundos.'
  );
}

export async function PUBLICAR_NO_INSTAGRAM(params: {
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'REELS';
  onProgress?: (msg: string) => void;
}): Promise<{ mediaId: string }> {
  const sessao = OBTER_SESSAO_INSTAGRAM();
  if (!sessao) throw new Error('Conecte uma conta Instagram Business/Creator antes de publicar.');

  const base = {
    accessToken: sessao.accessToken,
    igUserId: sessao.igUserId,
    caption: params.caption,
    mediaUrl: params.mediaUrl,
    mediaType: params.mediaType
  };

  params.onProgress?.(
    params.mediaType === 'REELS' ? 'Enviando video para o Instagram…' : 'Enviando imagem para o Instagram…'
  );

  // Sempre create + poll + publish — evita "Media ID is not available"
  const criado = await chamarPublishApi({ ...base, action: 'create' });
  const containerId = criado.containerId as string;
  if (!containerId) throw new Error('Instagram nao retornou containerId da midia.');

  params.onProgress?.('Aguardando Meta processar a midia…');
  await new Promise((r) => setTimeout(r, 2000));
  await aguardarContainerPronto(sessao, containerId, params.onProgress);

  params.onProgress?.('Publicando no Instagram…');
  const pub = await chamarPublishApi({
    accessToken: sessao.accessToken,
    igUserId: sessao.igUserId,
    action: 'publish',
    containerId
  });
  if (!pub.mediaId) {
    throw new Error(
      pub.erro ||
        'Media ID is not available — o container ainda nao estava pronto ou o token/conta Meta precisa ser reconectado.'
    );
  }
  return { mediaId: pub.mediaId as string };
}


/** Dominios de foto de estoque / mock — nao podem ir para o Instagram. */
const DOMINIOS_MIDIA_MOCK = [
  'images.unsplash.com',
  'unsplash.com',
  'picsum.photos',
  'placehold.co',
  'placekitten.com',
  'via.placeholder.com',
  'dummyimage.com',
  'loremflickr.com',
  'source.unsplash.com'
];

export type ResultadoValidacaoMidiaIg = { ok: true } | { ok: false; erro: string };

/**
 * Impede publicar mock/estoque ou card sem midia real gerada/anexada.
 */
export function VALIDAR_MIDIA_PARA_INSTAGRAM(
  mediaUrl: string | undefined | null,
  mediaType: 'IMAGE' | 'REELS',
  midiaMockUrl?: string | null
): ResultadoValidacaoMidiaIg {
  const url = (mediaUrl || '').trim() || (midiaMockUrl || '').trim();
  if (!url) {
    return {
      ok: false,
      erro:
        'Nao ha midia neste card nem nos Mocks de Conteudo. Gere a imagem/video na aba Mocks de Conteudo (IA) ou edite o card e cole uma URL HTTPS publica antes de publicar.'
    };
  }

  // Midia gerada nos Mocks (base64) conta como valida — na publicacao sera hospedada em HTTPS.
  if (/^data:image\//i.test(url)) {
    if (mediaType === 'REELS') {
      return {
        ok: false,
        erro:
          'Nos Mocks ha uma imagem, mas este card e Instagram Reels (video). Gere/anexe um .mp4/.mov ou troque o canal para Instagram Feed.'
      };
    }
    return { ok: true };
  }
  if (/^data:video\//i.test(url)) {
    if (mediaType === 'IMAGE') {
      return {
        ok: false,
        erro:
          'Nos Mocks ha um video, mas este card e Instagram Feed (imagem). Troque o canal para Instagram Reels ou use uma imagem.'
      };
    }
    return { ok: true };
  }

  if (!/^https:\/\//i.test(url)) {
    return {
      ok: false,
      erro:
        'A URL da midia precisa ser HTTPS publica, ou a imagem gerada nos Mocks. Edite o card ou regenere nos Mocks de Conteudo.'
    };
  }
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { ok: false, erro: 'URL da midia invalida. Cole um link https:// completo no card do Kanban.' };
  }
  if (DOMINIOS_MIDIA_MOCK.some((d) => host === d || host.endsWith('.' + d))) {
    return {
      ok: false,
      erro:
        'Esta URL e de imagem mock/estoque (ex.: Unsplash). Use a imagem gerada nos Mocks de Conteudo ou cole uma URL HTTPS da sua arte real.'
    };
  }
  const pareceImagem = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
  const pareceVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
  if (mediaType === 'REELS' && !pareceVideo) {
    return {
      ok: false,
      erro:
        'Instagram Reels exige URL HTTPS de video (.mp4/.mov) ou video gerado nos Mocks. Para imagem, use Instagram Feed.'
    };
  }
  if (mediaType === 'IMAGE' && pareceVideo && !pareceImagem) {
    return {
      ok: false,
      erro:
        'Este card e Instagram Feed (imagem), mas a URL parece video. Troque para Instagram Reels ou cole URL de imagem.'
    };
  }
  return { ok: true };
}

export async function HOSPEDAR_MIDIA_DATA_URL(dataUrl: string): Promise<string> {
  const res = await fetch('/api/hospedar-midia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json.erro || 'Falha ao hospedar midia dos Mocks para a Meta.');
  }
  return json.url as string;
}

export async function RESOLVER_URL_PUBLICA_MIDIA(
  mediaUrl: string,
  midiaMockUrl?: string | null
): Promise<string> {
  let url = (mediaUrl || '').trim() || (midiaMockUrl || '').trim();
  if (!url) throw new Error('Sem midia para publicar.');
  if (/^data:/i.test(url)) {
    return HOSPEDAR_MIDIA_DATA_URL(url);
  }
  return url;
}

export function CANAL_INSTAGRAM(canal: string): boolean {
  return canal === 'Instagram Reels' || canal === 'Instagram Feed';
}

export function TIPO_MIDIA_DO_CANAL(canal: string): 'IMAGE' | 'REELS' {
  return canal === 'Instagram Reels' ? 'REELS' : 'IMAGE';
}
