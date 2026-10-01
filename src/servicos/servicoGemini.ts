import { DiagnosticoCompleto, EstrategiaCrescimento, SensoriamentoMercado, EscopoGeografico, CenaRoteiroVideo, MockCampanhaConteudo, PropostaCampanha, ClassificacaoRespostaOutros, PerguntaEstrategica } from '../tipos';

export interface AnexoArquivoIA {
  nome: string;
  mimeType: string;
  dadosBase64: string;
}

export interface HandleVideoVeo {
  uri?: string;
  name?: string;
  mimeType?: string;
  videoBytes?: string;
}

export interface ResultadoVideoVeo {
  url: string;
  videoApi: HandleVideoVeo;
}

export interface FalhaVideoVeo {
  erro: string;
}

/** Cache do status da chave no servidor (/api/ia). */
let cacheChaveConfigurada: boolean | null = null;
let promiseStatus: Promise<boolean> | null = null;

async function atualizarStatusChave(): Promise<boolean> {
  try {
    const resp = await fetch('/api/ia', { method: 'GET', cache: 'no-store' });
    const json = await resp.json();
    cacheChaveConfigurada = Boolean(json?.configured);
  } catch {
    cacheChaveConfigurada = false;
  }
  return cacheChaveConfigurada!;
}

/** Indica se o servidor tem GEMINI_API_KEY. Dispara refresh assíncrono; otimista true até saber. */
export function TEM_CHAVE_GEMINI_CONFIGURADA(): boolean {
  if (cacheChaveConfigurada === null && !promiseStatus) {
    promiseStatus = atualizarStatusChave();
  }
  return cacheChaveConfigurada !== false;
}

/** Cliente aborta ~10s antes do maxDuration 60s do server (/api/ia) para soft-fallback na UI. */
const TIMEOUT_FETCH_IA_MS = 50_000;

async function chamarIa<T>(action: string, payload: Record<string, unknown> = {}): Promise<T | null> {
  try {
    const resp = await fetch('/api/ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: AbortSignal.timeout(TIMEOUT_FETCH_IA_MS)
    });
    if (!resp.ok) {
      console.warn(`api/ia (${action}) HTTP ${resp.status}`);
      return null;
    }
    const json = await resp.json();
    if (json?.configured === false && action === 'status') return null;
    return (json?.resultado ?? null) as T | null;
  } catch (erro) {
    console.warn(`api/ia (${action}) falhou:`, erro);
    return null;
  }
}

export function VALIDAR_ESTRATEGIAS_GEMINI(valor: unknown): valor is EstrategiaCrescimento {
  const e = valor as EstrategiaCrescimento | undefined;
  const texto = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  return !!e && [e.estrategiaBase?.titulo, e.estrategiaBase?.descricao,
    e.estrategiaOportunidade?.titulo, e.estrategiaOportunidade?.planoAtaqueImediato,
    e.estrategiaOportunidade?.gatilhoTendencia, e.estrategiaComplementar?.titulo,
    e.estrategiaComplementar?.jornadaForaRedes?.googleMeuNegocio,
    e.estrategiaComplementar?.jornadaForaRedes?.whatsappEstrategico,
    e.estrategiaComplementar?.jornadaForaRedes?.deliveryOuPresencial].every(texto)
    && Array.isArray(e.estrategiaBase?.pilaresAtemporais)
    && e.estrategiaBase.pilaresAtemporais.length > 0 && e.estrategiaBase.pilaresAtemporais.every(texto);
}

export async function GERAR_COPY_PERSUASIVA_GEMINI(
  diagnostico: DiagnosticoCompleto,
  objetivo: string,
  anexos?: AnexoArquivoIA[]
): Promise<{
  copy: string;
  hashtags: string[];
  promptImagem: string;
  roteiroVideo: CenaRoteiroVideo[];
  estrategias?: EstrategiaCrescimento;
} | null> {
  return chamarIa('copy', { diagnostico, objetivo, anexos });
}

export async function GERAR_IMAGEM_IMAGEN3(prompt: string, aspectRatio: string = '9:16'): Promise<string | null> {
  const r = await chamarIa<{ imagem: string | null }>('imagem', { prompt, aspectRatio });
  return r?.imagem ?? null;
}

export async function GERAR_SENSORIAMENTO_MERCADO_GEMINI(
  setor: string,
  nomeNegocio: string,
  escopo: EscopoGeografico,
  contexto?: DiagnosticoCompleto
): Promise<SensoriamentoMercado | null> {
  return chamarIa('sensoriamento', { setor, nomeNegocio, escopo, contexto });
}

export async function GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI(
  diagnostico: DiagnosticoCompleto,
  campanha: MockCampanhaConteudo,
  nomeCategoria: string,
  modificadorEstilo: string
): Promise<CenaRoteiroVideo[] | null> {
  const r = await chamarIa<{ roteiroVideo: CenaRoteiroVideo[] | null }>('roteiro', {
    diagnostico, campanha, nomeCategoria, modificadorEstilo
  });
  return r?.roteiroVideo ?? null;
}

export async function GERAR_PROPOSTAS_CAMPANHA_GEMINI(
  diagnostico: DiagnosticoCompleto,
  campanha: MockCampanhaConteudo
): Promise<PropostaCampanha[] | null> {
  const r = await chamarIa<{ propostas: PropostaCampanha[] | null }>('propostas', { diagnostico, campanha });
  return r?.propostas ?? null;
}

export async function CATEGORIZAR_RESPOSTAS_OUTROS_GEMINI(
  itens: { pergunta: PerguntaEstrategica; textoOutros: string }[]
): Promise<Record<number, ClassificacaoRespostaOutros> | null> {
  if (!itens.length) return null;
  const r = await chamarIa<{ classificacoes: Record<number, ClassificacaoRespostaOutros> | null }>('categorizar', { itens });
  return r?.classificacoes ?? null;
}

const MODELOS_VEO = [
  'veo-3.1-fast-generate-preview',
  'veo-3.1-generate-preview'
];

const MODELOS_VEO_EXTENSAO = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview'
];

const TRAVA_ELENCO_VEO = `CHARACTER CONTINUITY LOCK (mandatory): One lead adult character. Keep identical appearance in every shot and every extension: same face, same skin tone, same age, same hair COLOR, same hair LENGTH, same hair STYLE. If the hair starts as a short pixie, it MUST stay a short pixie — never switch to ponytail, bun, long hair, or a different cut. Same clothes unless the script explicitly shows a change. Do not swap actors or change look without narrative reason.`;

const TRAVA_DIALOGO_VEO = `DIALOGUE LOCK (mandatory): Speak ONLY the exact words inside each Line "..." quote, in Brazilian Portuguese. Do NOT invent words, do NOT ad-lib, do NOT add fillers, brand names, English phrases, or opening gibberish before the first Line. If a Line is empty, remain silent for that beat. Pronounce only what is written — no paraphrasing.`;

/** URI do último clipe Veo desta sessão — a extensão REST exige o uri da API. */
let videoUriParaExtensao: string | null = null;

function mensagemErroVeo(erro: unknown): string {
  if (!erro) return 'Falha desconhecida na API Veo.';
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'string') return erro;
  try {
    return JSON.stringify(erro).slice(0, 280);
  } catch {
    return String(erro);
  }
}

function descricaoGenero(roteiro: CenaRoteiroVideo[]): string {
  return roteiro[0]?.generoVoz === 'masculina'
    ? 'the same adult male Brazilian Portuguese speaking voice in every shot'
    : 'the same adult female Brazilian Portuguese speaking voice in every shot';
}

function linhaCena(cena: CenaRoteiroVideo, rotulo: string): string {
  const extra = cena.promptUsuario?.trim() ? ` Client note: ${cena.promptUsuario.trim()}` : '';
  return `${rotulo}: CAMERA ${cena.enquadramentoCamera}. ACTION: ${cena.acaoVisual}. Spoken Line (verbatim only): "${cena.falaAudio.replace(/["']/g, '')}".${extra}`;
}

function montarPromptVideoVeo(roteiro: CenaRoteiroVideo[], tituloCampanha: string, estilo = 'cinematográfico natural'): string {
  const genero = descricaoGenero(roteiro);
  const gancho = roteiro[0];
  const dor = roteiro[1] || roteiro[0];

  return `Animated or live-action vertical 9:16 commercial PART 1 for "${tituloCampanha}". Duration 8 seconds. 720p.

This is ONLY the opening of a longer ad (Google Flow / scene-extension style). Do NOT deliver the WhatsApp/CTA yet. End on a living shot that can continue: same people, same location, camera still moving.

MUST include: adult characters, full environment, interaction and continuous visible subject motion. Use live-action for photographic styles; anime, pixel art or stop-motion must retain their chosen medium. No slideshow, no still image with zoom, no frozen subject.
MUST keep ${genero}. Spoken Brazilian Portuguese. Natural ambient sound only (no music lyrics).
${TRAVA_ELENCO_VEO}
${TRAVA_DIALOGO_VEO}
Visual style cue (direction only — NOT spoken dialogue): ${estilo}.

Beats:
${gancho ? linhaCena(gancho, '0-4s HOOK') : ''}
${dor ? linhaCena(dor, '4-8s PAIN') : ''}

No readable on-screen text, no invented logos, no watermarks.`;
}

function montarPromptExtensaoVeo(
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  indiceExtensao: number
): string {
  const genero = descricaoGenero(roteiro);
  const cenasContinuacao = roteiro.slice(2);
  const cena = cenasContinuacao[Math.min(indiceExtensao, Math.max(cenasContinuacao.length - 1, 0))] || roteiro[roteiro.length - 1];
  const ehFinal = indiceExtensao >= Math.max(cenasContinuacao.length - 1, 0);

  return `SCENE EXTENSION of the existing Veo clip for "${tituloCampanha}". Continue from the LAST SECOND of the input video — same people,wardrobe, location, lighting and ${genero}. Seamless narrative, not a new commercial.
${TRAVA_ELENCO_VEO}
${TRAVA_DIALOGO_VEO}
The lead character must look exactly as in the previous clip (hair, face, clothes). No sudden restyle.

Next action:
${cena ? linhaCena(cena, ehFinal ? 'FINAL CTA BEAT' : 'NEXT STORY BEAT') : ''}

${ehFinal
    ? 'This is the ENDING: character looks at camera, finishes the CTA, smiles and waves. Hold a resolved last frame. The ad must feel complete.'
    : 'Do not close the ad yet. End on a shot that can still continue.'}

No readable on-screen text, no invented logos.`;
}

function handleDeArquivoVeo(arquivoVideo: any): HandleVideoVeo {
  const interno = arquivoVideo?.video || arquivoVideo;
  const uri = interno?.uri || arquivoVideo?.uri;
  const handle: HandleVideoVeo = {
    uri,
    name: interno?.name || arquivoVideo?.name,
    mimeType: interno?.mimeType || arquivoVideo?.mimeType || 'video/mp4'
  };
  if (interno?.videoBytes || arquivoVideo?.videoBytes) {
    handle.videoBytes = interno?.videoBytes || arquivoVideo?.videoBytes;
  }
  return handle;
}

async function blobParaBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binario = '';
  const fatia = 0x8000;
  for (let i = 0; i < bytes.length; i += fatia) {
    binario += String.fromCharCode(...bytes.subarray(i, i + fatia));
  }
  return btoa(binario);
}

/** Download via proxy servidor — nunca anexa apiKey no browser. */
async function baixarVideoGerado(video: any): Promise<{ url: string; videoBytes?: string } | null> {
  if (video?.videoBytes) {
    const binario = Uint8Array.from(atob(video.videoBytes), c => c.charCodeAt(0));
    return { url: URL.createObjectURL(new Blob([binario], { type: 'video/mp4' })), videoBytes: video.videoBytes };
  }

  const uri: string | undefined = video?.uri || video?.video?.uri;
  if (!uri) return null;

  const resposta = await fetch(`/api/veo-download?uri=${encodeURIComponent(uri)}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao baixar o vídeo (${resposta.status})`);
  }
  const blob = await resposta.blob();
  if (blob.size < 1000) {
    throw new Error('O download do MP4 veio vazio ou inválido.');
  }
  const videoBytes = await blobParaBase64(blob);
  return { url: URL.createObjectURL(blob), videoBytes };
}

async function aguardarOperacaoPorNome(
  nomeOp: string,
  notificarProgresso?: (etapa: string) => void
): Promise<any> {
  let tentativas = 0;
  const maxTentativas = 30;
  let status: any = { done: false, name: nomeOp };
  while (!status?.done && tentativas < maxTentativas) {
    tentativas += 1;
    notificarProgresso?.(`Renderizando no Veo (${tentativas}/${maxTentativas})…`);
    await new Promise(resolve => setTimeout(resolve, 8000));
    const poll = await fetch(`/api/veo-operation?name=${encodeURIComponent(nomeOp)}`);
    status = await poll.json();
    if (!poll.ok && status.error) {
      throw new Error(status.error.message || JSON.stringify(status.error));
    }
  }
  if (!status?.done) throw new Error('A geração de vídeo excedeu o tempo de espera.');
  if (status.error) throw new Error(status.error.message || JSON.stringify(status.error));
  return status;
}

async function iniciarEBaixarVeo(
  endpoint: '/api/veo-generate' | '/api/veo-extend',
  corpo: Record<string, unknown>,
  modelos: string[],
  notificarProgresso?: (etapa: string) => void,
  rotulo = 'Gerando'
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  let ultimoErro: unknown = null;

  for (const modelo of modelos) {
    try {
      notificarProgresso?.(`${rotulo} com ${modelo}…`);
      const inicio = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...corpo, modelo })
      });
      const jsonInicio = await inicio.json();
      if (!inicio.ok || jsonInicio.error) {
        throw new Error(jsonInicio.error?.message || JSON.stringify(jsonInicio.error || jsonInicio).slice(0, 280));
      }
      const nomeOp = jsonInicio.name;
      if (!nomeOp) throw new Error('A API não devolveu o nome da operação.');

      const status = await aguardarOperacaoPorNome(nomeOp, notificarProgresso);
      const gerados = status.response?.generateVideoResponse?.generatedSamples
        || status.response?.generatedVideos;
      const arquivoVideo = gerados?.[0]?.video || gerados?.[0];
      const baixado = await baixarVideoGerado(arquivoVideo);
      if (baixado?.url) {
        const handle = handleDeArquivoVeo(arquivoVideo);
        if (baixado.videoBytes) handle.videoBytes = baixado.videoBytes;
        if (handle.uri) videoUriParaExtensao = handle.uri;
        notificarProgresso?.(endpoint === '/api/veo-extend' ? 'História estendida.' : 'Vídeo pronto.');
        return { url: baixado.url, videoApi: handle };
      }
      throw new Error('A API concluiu, mas não devolveu o arquivo de vídeo.');
    } catch (erro) {
      ultimoErro = erro;
      notificarProgresso?.(`Falha em ${modelo}: ${mensagemErroVeo(erro).slice(0, 180)}`);
      console.warn(`Falha Veo em ${modelo}:`, erro);
    }
  }

  return { erro: mensagemErroVeo(ultimoErro) };
}

export function ehFalhaVideoVeo(resultado: ResultadoVideoVeo | FalhaVideoVeo): resultado is FalhaVideoVeo {
  return 'erro' in resultado && !('url' in resultado);
}

export async function GERAR_VIDEO_VEO(
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  _imagemReferencia?: string,
  notificarProgresso?: (etapa: string) => void,
  estilo?: string
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  videoUriParaExtensao = null;
  return iniciarEBaixarVeo(
    '/api/veo-generate',
    { prompt: montarPromptVideoVeo(roteiro, tituloCampanha, estilo) },
    MODELOS_VEO,
    notificarProgresso,
    'Enviando prompt'
  );
}

export async function ESTENDER_VIDEO_VEO(
  videoAnterior: HandleVideoVeo,
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  indiceExtensao: number,
  notificarProgresso?: (etapa: string) => void
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  const uri = videoUriParaExtensao || videoAnterior?.uri;
  if (!uri) {
    return { erro: 'Não há URI do clipe Veo desta sessão. Clique em Gerar do zero, espere o MP4 e então Continuar história.' };
  }
  return iniciarEBaixarVeo(
    '/api/veo-extend',
    { prompt: montarPromptExtensaoVeo(roteiro, tituloCampanha, indiceExtensao), videoUri: uri },
    MODELOS_VEO_EXTENSAO,
    notificarProgresso,
    'Estendendo cena'
  );
}
