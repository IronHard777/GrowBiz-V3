import React, { useState, useEffect, useRef } from 'react';
import { CenaRoteiroVideo, TomNarracao, GeneroVoz } from '../tipos';
import { Video, Camera, Mic, Play, Pause, RotateCcw, Check, Copy, Sparkles, Clock, Eye, Volume2, VolumeX, Film, AlertTriangle, Gauge, UserRound, SkipBack, SkipForward, Loader2, PenLine, FastForward } from 'lucide-react';
import { CategoriaEstilo, CATEGORIAS_ESTILO_VIDEO } from '../servicos/servicoCategoriasEstilo';
import { SeletorDeCategoria } from './SeletorDeCategoria';
import { PARAMETROS_TOM, ROTULO_TOM, selecionarVozParaGenero } from '../servicos/servicoNarracao';
import { GERAR_VIDEO_VEO, ESTENDER_VIDEO_VEO, TEM_CHAVE_GEMINI_CONFIGURADA, HandleVideoVeo, ehFalhaVideoVeo } from '../servicos/servicoGemini';

interface PropriedadesRoteiro {
  roteiro: CenaRoteiroVideo[];
  tituloCampanha: string;
  imagemVisualPrincipal: string;
  estiloSelecionado: CategoriaEstilo | null;
  aoSelecionarEstilo: (categoria: CategoriaEstilo) => void;
  regenerandoRoteiro: boolean;
  erroRegeneracao: string | null;
  aoAtualizarCena?: (idx: number, patch: Partial<CenaRoteiroVideo>) => void;
}

function indiceCenaContinua(roteiro: CenaRoteiroVideo[], tempoNoRoteiro: number): number {
  if (!roteiro.length) return 0;
  let idx = 0;
  for (let i = 0; i < roteiro.length; i++) {
    if (tempoNoRoteiro >= roteiro[i].segundoInicio) idx = i;
  }
  return idx;
}

function faixaCena(roteiro: CenaRoteiroVideo[], idx: number): { inicio: number; fim: number } {
  const cena = roteiro[idx];
  const proxima = roteiro[idx + 1];
  return {
    inicio: cena.segundoInicio,
    fim: proxima ? proxima.segundoInicio : cena.segundoFim
  };
}

/** No clipe Veo as 4 cenas ocupam fatias iguais da duração real (ex.: 0–2, 2–4, 4–6, 6–8). */
function faixaCenaNoPlayer(
  roteiro: CenaRoteiroVideo[],
  idx: number,
  duracaoRoteiro: number,
  duracaoPlayer: number,
  clipeVeo: boolean
): { inicio: number; fim: number } {
  if (clipeVeo && roteiro.length > 0 && duracaoPlayer > 0) {
    const fatia = duracaoPlayer / roteiro.length;
    return { inicio: idx * fatia, fim: (idx + 1) * fatia };
  }
  const faixa = faixaCena(roteiro, idx);
  if (duracaoRoteiro <= 0 || duracaoPlayer === duracaoRoteiro) return faixa;
  return {
    inicio: (faixa.inicio / duracaoRoteiro) * duracaoPlayer,
    fim: (faixa.fim / duracaoRoteiro) * duracaoPlayer
  };
}

function rotuloFaixa(inicio: number, fim: number): string {
  return `${Math.round(inicio)}s–${Math.round(fim)}s`;
}

function formatarTempo(segundos: number): string {
  const seguro = Math.max(0, segundos);
  const m = Math.floor(seguro / 60);
  const s = Math.floor(seguro % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const CORES_CENA = ['#3b82f6', '#22d3ee', '#f59e0b', '#34d399'];
const veoAutoJaPedido = new Set<string>();

export const VisualizadorRoteiroVideo: React.FC<PropriedadesRoteiro> = ({
  roteiro,
  tituloCampanha,
  imagemVisualPrincipal,
  estiloSelecionado,
  aoSelecionarEstilo,
  regenerandoRoteiro,
  erroRegeneracao,
  aoAtualizarCena
}) => {
  const [cenaAtiva, setCenaAtiva] = useState<number>(0);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [tocando, setTocando] = useState<boolean>(false);
  const [segundoAtual, setSegundoAtual] = useState<number>(0);
  const [audioAtivo, setAudioAtivo] = useState<boolean>(true);
  const [sobrescritasVoz, setSobrescritasVoz] = useState<Record<number, { tom: TomNarracao; genero: GeneroVoz }>>({});
  const [urlVideoIa, setUrlVideoIa] = useState<string | null>(null);
  const [handleVideoVeo, setHandleVideoVeo] = useState<HandleVideoVeo | null>(null);
  const [extensoesVeo, setExtensoesVeo] = useState(0);
  const [gerandoVideo, setGerandoVideo] = useState(false);
  const [etapaVideo, setEtapaVideo] = useState<string | null>(null);
  const [erroVideo, setErroVideo] = useState<string | null>(null);
  const [duracaoVideoIa, setDuracaoVideoIa] = useState<number | null>(null);
  const [arrastandoTimeline, setArrastandoTimeline] = useState(false);
  const [generoCampanha, setGeneroCampanha] = useState<GeneroVoz>(roteiro[0]?.generoVoz || 'feminina');

  const duracaoRoteiro = roteiro.length > 0 ? roteiro[roteiro.length - 1].segundoFim : 22;
  const duracaoTotal = urlVideoIa ? (duracaoVideoIa || 8) : duracaoRoteiro;
  const temChaveGemini = TEM_CHAVE_GEMINI_CONFIGURADA();

  const intervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const imagemCarregadaRef = useRef<HTMLImageElement | null>(null);
  const tocandoRef = useRef(false);
  const cenaAtivaRef = useRef(0);
  const ultimaCenaNarradaRef = useRef<number | null>(null);
  const geracaoAutoRef = useRef(false);
  const narracaoTimerRef = useRef<number | null>(null);

  tocandoRef.current = tocando;
  cenaAtivaRef.current = cenaAtiva;

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = !audioAtivo;
  }, [audioAtivo, urlVideoIa]);

  useEffect(() => {
    setSobrescritasVoz({});
    setSegundoAtual(0);
    setCenaAtiva(0);
    setTocando(false);
  }, [roteiro]);

  const obterTomEGenero = (idx: number): { tom: TomNarracao; genero: GeneroVoz } => {
    const sobrescrita = sobrescritasVoz[idx];
    const cena = roteiro[idx];
    return {
      tom: sobrescrita?.tom || cena?.tomNarracao || 'calma',
      genero: generoCampanha
    };
  };

  const clipeVeo = Boolean(urlVideoIa);
  const faixaDaCena = (idx: number) =>
    faixaCenaNoPlayer(roteiro, idx, duracaoRoteiro, duracaoTotal, clipeVeo);

  const indiceCenaNoTempo = (tempo: number) => {
    if (!roteiro.length) return 0;
    if (clipeVeo && duracaoTotal > 0) {
      const fatia = duracaoTotal / roteiro.length;
      return Math.min(roteiro.length - 1, Math.max(0, Math.floor(tempo / fatia)));
    }
    const escala = duracaoRoteiro > 0 ? duracaoTotal / duracaoRoteiro : 1;
    const tempoNoRoteiro = escala === 0 ? 0 : tempo / escala;
    return indiceCenaContinua(roteiro, tempoNoRoteiro);
  };

  const narrarFalaFluida = (texto: string, tomNarracao: TomNarracao = 'calma', generoVoz: GeneroVoz = 'feminina') => {
    if (urlVideoIa || !audioAtivo || !('speechSynthesis' in window)) return;
    try {
      let textoFonético = texto
        .replace(/["'“”]/g, '')
        .replace(/WhatsApp/gi, 'Uats Záp')
        .replace(/Whats/gi, 'Uats')
        .replace(/Reels/gi, 'Ríols')
        .replace(/TikTok/gi, 'Tik Tok')
        .trim();

      if (!textoFonético) return;

      if (narracaoTimerRef.current) {
        window.clearTimeout(narracaoTimerRef.current);
        narracaoTimerRef.current = null;
      }

      // cancel() imediato estala o áudio; um pequeno intervalo evita o clique na troca de cena
      window.speechSynthesis.cancel();
      narracaoTimerRef.current = window.setTimeout(() => {
        const u = new SpeechSynthesisUtterance(textoFonético);
        u.lang = 'pt-BR';
        const parametrosTom = PARAMETROS_TOM[tomNarracao] || PARAMETROS_TOM.calma;
        u.rate = parametrosTom.rate;
        u.pitch = parametrosTom.pitch;
        const vozEscolhida = selecionarVozParaGenero(generoVoz);
        if (vozEscolhida) u.voice = vozEscolhida;
        window.speechSynthesis.speak(u);
      }, 120);
    } catch (e) {
      console.warn('Aviso na voz nativa:', e);
    }
  };

  const narrarSeCenaNova = (idx: number) => {
    if (urlVideoIa || !tocandoRef.current || !roteiro[idx]) return;
    if (ultimaCenaNarradaRef.current === idx) return;
    ultimaCenaNarradaRef.current = idx;
    const { tom, genero } = obterTomEGenero(idx);
    narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
  };

  const aplicarTempo = (tempo: number, narrarSeMudouCena = true) => {
    const clamped = Math.max(0, Math.min(duracaoTotal, tempo));
    const idx = indiceCenaNoTempo(clamped);
    const cenaMudou = idx !== cenaAtivaRef.current;
    setSegundoAtual(clamped);
    if (cenaMudou) {
      setCenaAtiva(idx);
      cenaAtivaRef.current = idx;
      if (narrarSeMudouCena) narrarSeCenaNova(idx);
    }

    if (videoRef.current && urlVideoIa) {
      if (Math.abs(videoRef.current.currentTime - clamped) > 0.25) {
        videoRef.current.currentTime = clamped;
      }
    }
  };

  useEffect(() => {
    if (!imagemVisualPrincipal) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagemVisualPrincipal;
    imagemCarregadaRef.current = img;
  }, [imagemVisualPrincipal]);

  const alterarTomCena = (idx: number, tom: TomNarracao) => {
    const { genero } = obterTomEGenero(idx);
    setSobrescritasVoz(prev => ({ ...prev, [idx]: { tom, genero } }));
    narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
  };

  const alterarGeneroCena = (_idx: number, genero: GeneroVoz) => {
    setGeneroCampanha(genero);
    roteiro.forEach((_, i) => aoAtualizarCena?.(i, { generoVoz: genero }));
    const { tom } = obterTomEGenero(cenaAtiva);
    narrarFalaFluida(roteiro[cenaAtiva].falaAudio, tom, genero);
  };

  const atualizarPromptCena = (idx: number, texto: string) => {
    aoAtualizarCena?.(idx, { promptUsuario: texto });
  };

  useEffect(() => {
    const g = roteiro[0]?.generoVoz || 'feminina';
    setGeneroCampanha(g);
    if (roteiro.some(cena => cena.generoVoz !== g)) {
      roteiro.forEach((_, i) => aoAtualizarCena?.(i, { generoVoz: g }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roteiro.map(c => c.generoVoz).join('|')]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || urlVideoIa) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderFrame = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentImg = imagemCarregadaRef.current;
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        const scale = 1.0 + (Math.sin(timestamp * 0.001) * 0.05);
        const w = canvas.width * scale;
        const h = canvas.height * scale;
        ctx.drawImage(currentImg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.1)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (tocando) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        const numBars = 16;
        const barWidth = canvas.width / numBars;
        for (let i = 0; i < numBars; i++) {
          const barHeight = Math.abs(Math.sin(timestamp * 0.005 + i)) * 30 + 5;
          ctx.fillRect(i * barWidth, canvas.height - barHeight - 10, barWidth - 2, barHeight);
        }
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (tocando) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } else {
      renderFrame(performance.now());
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [tocando, cenaAtiva, segundoAtual, urlVideoIa]);

  useEffect(() => {
    if (!tocando || urlVideoIa) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }

    let ultimo = performance.now();
    const tick = () => {
      const agora = performance.now();
      const delta = (agora - ultimo) / 1000;
      ultimo = agora;
      setSegundoAtual(prev => {
        const proximo = prev + delta;
        if (proximo >= duracaoTotal) {
          setTocando(false);
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          return duracaoTotal;
        }
        const idx = indiceCenaNoTempo(proximo);
        if (idx !== cenaAtivaRef.current) {
          cenaAtivaRef.current = idx;
          setCenaAtiva(idx);
          narrarSeCenaNova(idx);
        }
        return proximo;
      });
    };

    intervalRef.current = window.setInterval(tick, 80);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [tocando, urlVideoIa, duracaoTotal, roteiro, audioAtivo, sobrescritasVoz]);

  const iniciarOuPausar = async () => {
    if (segundoAtual >= duracaoTotal - 0.05) {
      aplicarTempo(0, false);
      setCenaAtiva(0);
    }

    const proximoEstado = !tocando;
    setTocando(proximoEstado);

    if (urlVideoIa && videoRef.current) {
      if (proximoEstado) {
        try { await videoRef.current.play(); } catch { /* autoplay bloqueado */ }
      } else {
        videoRef.current.pause();
      }
      return;
    }

    if (proximoEstado && roteiro[cenaAtiva]) {
      ultimaCenaNarradaRef.current = null;
      narrarSeCenaNova(cenaAtiva);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const reiniciar = () => {
    setTocando(false);
    aplicarTempo(0, false);
    setCenaAtiva(0);
    cenaAtivaRef.current = 0;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    ultimaCenaNarradaRef.current = null;
    if (narracaoTimerRef.current) {
      window.clearTimeout(narracaoTimerRef.current);
      narracaoTimerRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const saltar = (delta: number) => {
    aplicarTempo(segundoAtual + delta, true);
    if (urlVideoIa && videoRef.current && tocando) {
      videoRef.current.play().catch(() => undefined);
    }
  };

  const selecionarCenaManualmente = (idx: number) => {
    const tempo = faixaDaCena(idx).inicio;
    aplicarTempo(tempo, false);
    setCenaAtiva(idx);
    cenaAtivaRef.current = idx;
    ultimaCenaNarradaRef.current = null;
    if (audioAtivo && !urlVideoIa && roteiro[idx]) {
      ultimaCenaNarradaRef.current = idx;
      const { tom, genero } = obterTomEGenero(idx);
      narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
    }
  };

  const tempoAPartirDoEvento = (clientX: number) => {
    const el = timelineRef.current;
    if (!el || duracaoTotal <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duracaoTotal;
  };

  const aoPointerTimeline = (clientX: number) => {
    aplicarTempo(tempoAPartirDoEvento(clientX), true);
  };

  useEffect(() => {
    if (!arrastandoTimeline) return;
    const mover = (e: PointerEvent) => aoPointerTimeline(e.clientX);
    const soltar = () => setArrastandoTimeline(false);
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
    };
  }, [arrastandoTimeline, duracaoTotal, urlVideoIa]);

  const gerarVideoComApi = async (modo: 'novo' | 'continuar' = 'novo') => {
    if (!temChaveGemini) {
      setErroVideo('Configure VITE_GEMINI_API_KEY para gerar o vídeo com a API Veo.');
      return;
    }
    setGerandoVideo(true);
    setErroVideo(null);
    setEtapaVideo(modo === 'continuar' ? 'Continuando a cena no Veo (Scene extension)…' : 'Montando abertura cinematográfica…');
    const roteiroComVoz = roteiro.map(cena => ({ ...cena, generoVoz: generoCampanha }));
    const resultado = modo === 'continuar'
      ? await ESTENDER_VIDEO_VEO(
          handleVideoVeo || {},
          roteiroComVoz,
          tituloCampanha,
          extensoesVeo,
          (etapa) => setEtapaVideo(etapa)
        )
      : await GERAR_VIDEO_VEO(
          roteiroComVoz,
          tituloCampanha,
          undefined,
          (etapa) => setEtapaVideo(etapa)
        );
    if (ehFalhaVideoVeo(resultado)) {
      setErroVideo(
        modo === 'continuar'
          ? `Não foi possível estender: ${resultado.erro}`
          : resultado.erro
      );
    } else if (resultado.url) {
      if (urlVideoIa?.startsWith('blob:')) URL.revokeObjectURL(urlVideoIa);
      setUrlVideoIa(resultado.url);
      setHandleVideoVeo(resultado.videoApi);
      setExtensoesVeo(modo === 'continuar' ? extensoesVeo + 1 : 0);
      setDuracaoVideoIa(null);
      setSegundoAtual(0);
      setCenaAtiva(0);
      setTocando(false);
    }
    setGerandoVideo(false);
  };

  useEffect(() => {
    if (!temChaveGemini) return;
    const chavePedido = `${tituloCampanha}:${roteiro.map(c => c.falaAudio).join('|').slice(0, 120)}`;
    if (veoAutoJaPedido.has(chavePedido)) return;
    veoAutoJaPedido.add(chavePedido);
    void gerarVideoComApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tituloCampanha]);

  const copiarRoteiroCompleto = () => {
    const texto = roteiro.map(c => (
      `[${c.segundoInicio}s - ${c.segundoFim}s] ENQUADRAMENTO: ${c.enquadramentoCamera}\n` +
      `VISUAL: ${c.acaoVisual}\n` +
      `FALA: ${c.falaAudio}\n` +
      `DICA DA IA: ${c.dicaDirecao}\n` +
      (c.promptUsuario?.trim() ? `PROMPT DO USUÁRIO: ${c.promptUsuario}\n` : '') +
      `----------------------------------------\n`
    )).join('\n');

    navigator.clipboard.writeText(`ROTEIRO DE VÍDEO - ${tituloCampanha}\n\n${texto}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const progressoPct = duracaoTotal > 0 ? (segundoAtual / duracaoTotal) * 100 : 0;

  return (
    <div className="gb-panel p-6 shadow-xl text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <Video className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              {urlVideoIa ? 'Player de Vídeo (Veo)' : 'Simulador de Vídeo + Timeline'}
            </h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono font-bold uppercase">
              {urlVideoIa ? 'API Veo' : 'Prévia local'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Escolha o estilo, depois gere a abertura e continue a história no clipe abaixo.
          </p>
        </div>
      </div>

      <div className="pt-5">
        <SeletorDeCategoria
          titulo="Categoria do Estilo de Direção"
          categorias={CATEGORIAS_ESTILO_VIDEO}
          categoriaAtivaId={estiloSelecionado?.id || null}
          aoSelecionar={aoSelecionarEstilo}
          carregando={regenerandoRoteiro}
          animarComZoom
        />
        {erroRegeneracao && (
          <div className="mb-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{erroRegeneracao}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2 mt-1">
        <button
          onClick={() => setAudioAtivo(!audioAtivo)}
          className={`p-2 rounded-xl border text-xs font-mono transition-all ${
            audioAtivo
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}
          title={urlVideoIa ? 'Áudio do clipe Veo' : (audioAtivo ? 'Narração PT-BR ativa' : 'Áudio mudo')}
        >
          {audioAtivo ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => void gerarVideoComApi('novo')}
          disabled={gerandoVideo}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white border border-slate-600 text-xs font-mono font-bold uppercase"
          title="Gera a abertura (8s) do zero"
        >
          {gerandoVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{gerandoVideo ? 'Gerando…' : 'Gerar do zero'}</span>
        </button>

        <button
          onClick={() => void gerarVideoComApi('continuar')}
          disabled={gerandoVideo || (!handleVideoVeo && !urlVideoIa)}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white border border-violet-400 text-xs font-mono font-bold uppercase"
          title="Estende o clipe atual (~7s) com continuidade de cena"
        >
          {gerandoVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FastForward className="w-4 h-4" />}
          <span>Continuar história</span>
        </button>

        <button
          onClick={iniciarOuPausar}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md ${
            tocando
              ? 'bg-amber-500 text-slate-950 border border-amber-400'
              : 'bg-blue-500 hover:bg-blue-400 text-white border border-blue-400 shadow-blue-500/20'
          }`}
        >
          {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{tocando ? 'Pausar' : 'Play'}</span>
        </button>

        <button
          onClick={copiarRoteiroCompleto}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all"
        >
          {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          <span className="hidden sm:inline">{copiado ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {(etapaVideo || erroVideo) && (
        <div className={`mb-4 p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
          erroVideo ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' : 'bg-violet-500/10 border border-violet-500/20 text-violet-200'
        }`}>
          {erroVideo ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Loader2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${gerandoVideo ? 'animate-spin' : ''}`} />}
          <span>{erroVideo || etapaVideo}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Film className="w-4 h-4 text-blue-400" />
              {urlVideoIa ? 'Clipe Veo 9:16' : 'Prévia local (imagem + zoom — não é o MP4)'}
            </span>
            <div className="flex items-center space-x-1.5 font-mono text-[10px]">
              <span className={`w-2 h-2 rounded-full ${tocando ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-blue-400 font-bold">{formatarTempo(segundoAtual)} / {formatarTempo(duracaoTotal)}</span>
            </div>
          </div>

          <div className="w-[260px] h-[450px] bg-slate-900 border-4 border-slate-700 rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col justify-between">
            {urlVideoIa ? (
              <video
                ref={videoRef}
                src={urlVideoIa}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted={!audioAtivo}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d) && d > 0) setDuracaoVideoIa(d);
                }}
                onTimeUpdate={(e) => {
                  if (arrastandoTimeline) return;
                  aplicarTempo(e.currentTarget.currentTime, false);
                }}
                onEnded={() => {
                  setTocando(false);
                  aplicarTempo(duracaoTotal, false);
                }}
              />
            ) : (
              <canvas
                ref={canvasRef}
                width={260}
                height={450}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
              <span className="text-[9px] font-mono font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase shadow">
                Cena {cenaAtiva + 1} de {roteiro.length}
              </span>
              <span className="text-[9px] font-mono font-bold bg-slate-900/90 text-blue-300 px-2 py-0.5 rounded border border-slate-700">
                {rotuloFaixa(faixaDaCena(cenaAtiva).inicio, faixaDaCena(cenaAtiva).fim)}
              </span>
            </div>

            <div className="relative z-10 p-4 space-y-2 text-center">
              <div className="bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-lg">
                <span className="text-[9px] font-mono text-amber-400 uppercase font-bold flex items-center justify-center gap-1 mb-1">
                  <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                  {urlVideoIa ? 'Roteiro sincronizado' : 'Teleprompter (PT-BR)'}
                </span>
                <p className="text-xs font-bold text-white italic leading-snug font-sans">
                  "{roteiro[cenaAtiva]?.falaAudio.replace(/["'“”]/g, '')}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {roteiro.map((cena, idx) => {
              const faixa = faixaDaCena(idx);
              return (
              <button
                key={idx}
                onClick={() => selecionarCenaManualmente(idx)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  cenaAtiva === idx
                    ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cena {idx + 1} ({rotuloFaixa(faixa.inicio, faixa.fim)})</span>
              </button>
              );
            })}
          </div>

          {roteiro[cenaAtiva] && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl border-l border-b border-blue-500/20">
                DURAÇÃO: {Math.max(1, Math.round(faixaDaCena(cenaAtiva).fim - faixaDaCena(cenaAtiva).inicio))} SEGUNDOS
              </div>
              {clipeVeo && (
                <p className="text-[10px] text-slate-500 font-mono pr-28 leading-snug">
                  No clipe: {rotuloFaixa(faixaDaCena(cenaAtiva).inicio, faixaDaCena(cenaAtiva).fim)}. No roteiro escrito era {roteiro[cenaAtiva].segundoInicio}s–{roteiro[cenaAtiva].segundoFim}s.
                </p>
              )}

              <div className="flex items-start space-x-3 pt-1">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Enquadramento & Câmera</span>
                  <p className="text-xs font-mono font-bold text-blue-300 mt-0.5">{roteiro[cenaAtiva].enquadramentoCamera}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Ação Visual em Cena</span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">{roteiro[cenaAtiva].acaoVisual}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Fala / Locução do Roteiro</span>
                    <button
                      onClick={() => {
                        const { tom, genero } = obterTomEGenero(cenaAtiva);
                        narrarFalaFluida(roteiro[cenaAtiva].falaAudio, tom, genero);
                      }}
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Ouvir Frase</span>
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-amber-200 mt-0.5 bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 italic font-sans">
                    "{roteiro[cenaAtiva].falaAudio.replace(/["'“”]/g, '')}"
                  </p>

                  <div className="mt-3">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                      <Gauge className="w-2.5 h-2.5" />
                      Tom da Narração
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(ROTULO_TOM) as TomNarracao[]).map(tom => (
                        <button
                          key={tom}
                          type="button"
                          onClick={() => alterarTomCena(cenaAtiva, tom)}
                          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border transition-all ${
                            obterTomEGenero(cenaAtiva).tom === tom
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {ROTULO_TOM[tom]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                      <UserRound className="w-2.5 h-2.5" />
                      Gênero da voz (toda a campanha)
                    </span>
                    <div className="flex gap-1.5">
                      {(['feminina', 'masculina'] as GeneroVoz[]).map(genero => (
                        <button
                          key={genero}
                          type="button"
                          onClick={() => alterarGeneroCena(cenaAtiva, genero)}
                          className={`text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border transition-all ${
                            obterTomEGenero(cenaAtiva).genero === genero
                              ? 'bg-slate-600 text-white border-slate-500'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {genero === 'feminina' ? 'Feminina' : 'Masculina'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                      A mesma voz vale nas 4 cenas. Trocar aqui aplica em toda a propaganda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center space-x-2.5 text-xs text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span><strong>Direção da IA:</strong> {roteiro[cenaAtiva].dicaDirecao}</span>
              </div>

              <div className="p-3 bg-slate-900/80 border border-violet-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-violet-300">
                  <PenLine className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Prompt / direção extra desta cena</span>
                </div>
                <textarea
                  value={roteiro[cenaAtiva].promptUsuario || ''}
                  onChange={(e) => atualizarPromptCena(cenaAtiva, e.target.value)}
                  rows={4}
                  placeholder="Ex.: duas pessoas conversando no balcão; corte para o close do cliente; barista entrega a xícara; câmera passa por trás do ombro; vapor do espresso; sem foto estática."
                  className="w-full text-xs text-slate-200 bg-slate-950/80 border border-slate-700 rounded-lg p-2.5 leading-relaxed resize-y min-h-[88px] placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[10px] text-slate-500 leading-snug max-w-md">
                    Esse texto entra na próxima extensão. Continuar história acrescenta ~7s no mesmo clipe, sem recomeçar do zero.
                  </p>
                  <button
                    type="button"
                    onClick={() => void gerarVideoComApi(handleVideoVeo ? 'continuar' : 'novo')}
                    disabled={gerandoVideo}
                    className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white border border-violet-400"
                  >
                    {handleVideoVeo ? 'Continuar história' : 'Gerar clipe'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Timeline interativa</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={reiniciar} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white" title="Reiniciar">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => saltar(-3)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white" title="Voltar 3s">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={iniciarOuPausar} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400">
              {tocando ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button type="button" onClick={() => saltar(3)} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white" title="Avançar 3s">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-blue-300 min-w-[72px] text-right">{formatarTempo(segundoAtual)}</span>
          </div>
        </div>

        <div
          ref={timelineRef}
          className="relative h-14 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer select-none overflow-hidden"
          onPointerDown={(e) => {
            setArrastandoTimeline(true);
            aoPointerTimeline(e.clientX);
          }}
        >
          <div className="absolute inset-0 flex">
            {roteiro.map((cena, idx) => {
              const faixa = faixaDaCena(idx);
              const inicioPct = duracaoTotal > 0 ? (faixa.inicio / duracaoTotal) * 100 : 0;
              const larguraPct = duracaoTotal > 0 ? ((faixa.fim - faixa.inicio) / duracaoTotal) * 100 : 0;
              return (
                <div
                  key={idx}
                  className={`absolute top-0 bottom-0 border-r border-slate-950/40 ${cenaAtiva === idx ? 'opacity-100' : 'opacity-70'}`}
                  style={{
                    left: `${inicioPct}%`,
                    width: `${larguraPct}%`,
                    background: `${CORES_CENA[idx % CORES_CENA.length]}33`
                  }}
                >
                  <span className="absolute left-2 top-1.5 text-[9px] font-mono font-bold uppercase" style={{ color: CORES_CENA[idx % CORES_CENA.length] }}>
                    Cena {idx + 1}
                  </span>
                  <span className="absolute left-2 bottom-1.5 text-[9px] font-mono text-slate-400">
                    {rotuloFaixa(faixa.inicio, faixa.fim)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style={{ left: `${progressoPct}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-400 z-20 shadow"
            style={{ left: `${progressoPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          {clipeVeo
            ? `O Veo gera 8s na abertura e cada “Continuar história” soma ~7s no mesmo MP4 (até ~148s). Já houve ${extensoesVeo} extensão(ões).`
            : 'Arraste o playhead ou clique em qualquer ponto da barra para retroceder e acompanhar o andamento.'}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-800">
        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">Visão Geral de Todas as Cenas</h4>
        <div className="space-y-2">
          {roteiro.map((c, i) => (
            <div
              key={i}
              onClick={() => selecionarCenaManualmente(i)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                cenaAtiva === i
                  ? 'bg-slate-800 border-blue-500 text-white'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <span className="font-mono text-blue-400 font-bold">[{rotuloFaixa(faixaDaCena(i).inicio, faixaDaCena(i).fim)}]</span>
                <span className="truncate text-slate-200 font-medium">{c.falaAudio.replace(/["'“”]/g, '')}</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">Cena {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
