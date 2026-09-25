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

  if (params.mediaType === 'IMAGE') {
    params.onProgress?.('Publicando imagem no Feed…');
    const json = await chamarPublishApi({ ...base, action: 'all' });
    if (!json.mediaId) throw new Error(json.erro || 'Falha ao publicar no Instagram.');
    return { mediaId: json.mediaId as string };
  }

  // REELS: create → poll no cliente → publish (evita timeout da Vercel)
  params.onProgress?.('Enviando vídeo para o Instagram…');
  const criado = await chamarPublishApi({ ...base, action: 'create' });
  const containerId = criado.containerId as string;
  if (!containerId) throw new Error('Instagram nao retornou containerId do Reel.');

  let lastStatus = '';
  let lastDetail = '';
  for (let i = 0; i < 40; i++) {
    params.onProgress?.('Processando Reel no Instagram… (' + (i + 1) + '/40)');
    await new Promise((r) => setTimeout(r, 3000));
    const st = await chamarPublishApi({
      accessToken: sessao.accessToken,
      igUserId: sessao.igUserId,
      action: 'status',
      containerId
    });
    lastStatus = st.status_code || '';
    lastDetail = st.status || '';
    if (lastStatus === 'FINISHED') break;
    if (lastStatus === 'ERROR') {
      throw new Error(
        'Processamento do Reel falhou no Instagram. ' +
          (lastDetail || 'Use uma URL HTTPS publica de video (.mp4/.mov), sem login.')
      );
    }
  }
  if (lastStatus !== 'FINISHED') {
    throw new Error('Timeout aguardando o Instagram processar o Reel (status: ' + (lastStatus || 'vazio') + ').');
  }

  params.onProgress?.('Publicando Reel…');
  const pub = await chamarPublishApi({
    accessToken: sessao.accessToken,
    igUserId: sessao.igUserId,
    action: 'publish',
    containerId
  });
  if (!pub.mediaId) throw new Error(pub.erro || 'Falha ao publicar o Reel.');
  return { mediaId: pub.mediaId as string };
}

export function CANAL_INSTAGRAM(canal: string): boolean {
  return canal === 'Instagram Reels' || canal === 'Instagram Feed';
}

export function TIPO_MIDIA_DO_CANAL(canal: string): 'IMAGE' | 'REELS' {
  return canal === 'Instagram Reels' ? 'REELS' : 'IMAGE';
}
