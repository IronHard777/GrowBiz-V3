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

export async function PUBLICAR_NO_INSTAGRAM(params: {
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'REELS';
}): Promise<{ mediaId: string }> {
  const sessao = OBTER_SESSAO_INSTAGRAM();
  if (!sessao) throw new Error('Conecte uma conta Instagram Business/Creator antes de publicar.');

  const res = await fetch('/api/instagram-publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: sessao.accessToken,
      igUserId: sessao.igUserId,
      caption: params.caption,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) {
    throw new Error(json.erro || 'Falha ao publicar no Instagram.');
  }
  return { mediaId: json.mediaId as string };
}

export function CANAL_INSTAGRAM(canal: string): boolean {
  return canal === 'Instagram Reels' || canal === 'Instagram Feed';
}

export function TIPO_MIDIA_DO_CANAL(canal: string): 'IMAGE' | 'REELS' {
  return canal === 'Instagram Reels' ? 'REELS' : 'IMAGE';
}
