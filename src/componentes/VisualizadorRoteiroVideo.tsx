import React, { useState, useEffect, useRef } from 'react';
import { CenaRoteiroVideo, TomNarracao, GeneroVoz } from '../tipos';
import { Video, Camera, Mic, Play, Pause, RotateCcw, Check, Copy, Sparkles, Clock, Eye, Volume2, VolumeX, Smartphone, Film, AlertTriangle, Gauge, UserRound } from 'lucide-react';
import { CategoriaEstilo, CATEGORIAS_ESTILO_VIDEO } from '../servicos/servicoCategoriasEstilo';
import { SeletorDeCategoria } from './SeletorDeCategoria';
import { PARAMETROS_TOM, ROTULO_TOM, selecionarVozParaGenero } from '../servicos/servicoNarracao';

interface PropriedadesRoteiro {
  roteiro: CenaRoteiroVideo[];
  tituloCampanha: string;
  imagemVisualPrincipal: string;
  estiloSelecionado: CategoriaEstilo | null;
  aoSelecionarEstilo: (categoria: CategoriaEstilo) => void;
  regenerandoRoteiro: boolean;
  erroRegeneracao: string | null;
}

export const VisualizadorRoteiroVideo: React.FC<PropriedadesRoteiro> = ({
  roteiro,
  tituloCampanha,
  imagemVisualPrincipal,
  estiloSelecionado,
  aoSelecionarEstilo,
  regenerandoRoteiro,
  erroRegeneracao
}) => {
  const [cenaAtiva, setCenaAtiva] = useState<number>(0);
  const [copiado, setCopiado] = useState<boolean>(false);
  const [tocandoSimulador, setTocandoSimulador] = useState<boolean>(false);
  const [segundoAtual, setSegundoAtual] = useState<number>(0);
  const [audioAtivo, setAudioAtivo] = useState<boolean>(true);
  // Sobrescritas manuais de tom/gênero por cena — a IA já sugere um tom/gênero coerente por
  // padrão, mas o cliente pode clicar e trocar por cena; a troca já dispara uma prévia falada.
  const [sobrescritasVoz, setSobrescritasVoz] = useState<Record<number, { tom: TomNarracao; genero: GeneroVoz }>>({});

  useEffect(() => {
    setSobrescritasVoz({});
  }, [roteiro]);

  const obterTomEGenero = (idx: number): { tom: TomNarracao; genero: GeneroVoz } => {
    const sobrescrita = sobrescritasVoz[idx];
    const cena = roteiro[idx];
    return {
      tom: sobrescrita?.tom || cena?.tomNarracao || 'calma',
      genero: sobrescrita?.genero || cena?.generoVoz || 'feminina'
    };
  };

  const duracaoTotal = roteiro.length > 0 ? roteiro[roteiro.length - 1].segundoFim : 22;
  const intervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const imagemCarregadaRef = useRef<HTMLImageElement | null>(null);

  // Usa a MESMA imagem gerada/personalizada exibida no mockup de campanha (Imagen 3 real ou
  // fallback contextualizado por categoria) em vez de um banco fixo de fotos próprio — antes
  // este player cobria só 2 setores e caía nas mesmas 4 fotos genéricas para todos os outros.
  useEffect(() => {
    if (!imagemVisualPrincipal) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagemVisualPrincipal;
    imagemCarregadaRef.current = img;
  }, [imagemVisualPrincipal]);

  // Narração natural da voz sem interrupções, com pronúncia fonética corrigida e variação de
  // tom/gênero por cena (antes usava sempre a mesma voz com rate/pitch fixos para tudo).
  const narrarFalaFluida = (texto: string, tomNarracao: TomNarracao = 'calma', generoVoz: GeneroVoz = 'feminina') => {
    if (!audioAtivo || !('speechSynthesis' in window)) return;
    try {
      // Pré-tratamento de fonética para o sintetizador em Português ler perfeitamente marcas em inglês
      let textoFonético = texto
        .replace(/["'“”]/g, '')
        .replace(/WhatsApp/gi, 'Uats Záp')
        .replace(/Whats/gi, 'Uats')
        .replace(/Reels/gi, 'Ríols')
        .replace(/TikTok/gi, 'Tik Tok')
        .trim();

      if (!textoFonético) return;

      const u = new SpeechSynthesisUtterance(textoFonético);
      u.lang = 'pt-BR';

      const parametrosTom = PARAMETROS_TOM[tomNarracao] || PARAMETROS_TOM.calma;
      u.rate = parametrosTom.rate;
      u.pitch = parametrosTom.pitch;

      const vozEscolhida = selecionarVozParaGenero(generoVoz);
      if (vozEscolhida) u.voice = vozEscolhida;

      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Aviso na voz nativa:", e);
    }
  };

  const alterarTomCena = (idx: number, tom: TomNarracao) => {
    const { genero } = obterTomEGenero(idx);
    setSobrescritasVoz(prev => ({ ...prev, [idx]: { tom, genero } }));
    narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
  };

  const alterarGeneroCena = (idx: number, genero: GeneroVoz) => {
    const { tom } = obterTomEGenero(idx);
    setSobrescritasVoz(prev => ({ ...prev, [idx]: { tom, genero } }));
    narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
  };

  // Motor de Animação de Vídeo em 60 FPS (Canvas 2D Render Loop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const renderFrame = (timestamp: number) => {
      const elapsedSec = (timestamp - startTime) / 1000;
      const progress = (segundoAtual + (elapsedSec % 1)) / duracaoTotal;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Renderizar a imagem da cena com zoom e movimento suave (Ken Burns Effect)
      const currentImg = imagemCarregadaRef.current;
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        const scale = 1.0 + (Math.sin(timestamp * 0.001) * 0.05); // Zoom suave
        const w = canvas.width * scale;
        const h = canvas.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(currentImg, x, y, w, h);
      } else {
        // Fallback de cor caso a imagem ainda esteja carregando
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Gradiente de iluminação cinematográfica (Vignette)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.1)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Espectro de áudio animado (Equalizador 60fps no rodapé do vídeo)
      if (tocandoSimulador) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        const numBars = 16;
        const barWidth = canvas.width / numBars;
        for (let i = 0; i < numBars; i++) {
          const barHeight = Math.abs(Math.sin(timestamp * 0.005 + i)) * 30 + 5;
          ctx.fillRect(i * barWidth, canvas.height - barHeight - 10, barWidth - 2, barHeight);
        }
      }

      if (tocandoSimulador) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (tocandoSimulador) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } else {
      renderFrame(performance.now());
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [tocandoSimulador, cenaAtiva, segundoAtual, duracaoTotal]);

  // Atualização de Cenas baseada no tempo decorrido
  useEffect(() => {
    if (tocandoSimulador) {
      intervalRef.current = setInterval(() => {
        setSegundoAtual(prev => {
          if (prev >= duracaoTotal) {
            setTocandoSimulador(false);
            return 0;
          }
          const proximo = prev + 1;
          const idxCena = roteiro.findIndex(c => proximo >= c.segundoInicio && proximo <= c.segundoFim);

          if (idxCena >= 0 && idxCena !== cenaAtiva) {
            setCenaAtiva(idxCena);
            const { tom, genero } = obterTomEGenero(idxCena);
            narrarFalaFluida(roteiro[idxCena].falaAudio, tom, genero);
          }

          return proximo;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [tocandoSimulador, duracaoTotal, roteiro, cenaAtiva, audioAtivo, sobrescritasVoz]);

  // Ação de Play / Pausa no clique do usuário (Garante permissão de áudio do navegador sem cortes)
  const iniciarOuPausarSimulador = () => {
    if (segundoAtual >= duracaoTotal) {
      setSegundoAtual(0);
      setCenaAtiva(0);
    }

    const proximoEstado = !tocandoSimulador;
    setTocandoSimulador(proximoEstado);

    if (proximoEstado && roteiro[cenaAtiva]) {
      const { tom, genero } = obterTomEGenero(cenaAtiva);
      narrarFalaFluida(roteiro[cenaAtiva].falaAudio, tom, genero);
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  const reiniciarSimulador = () => {
    setTocandoSimulador(false);
    setSegundoAtual(0);
    setCenaAtiva(0);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const selecionarCenaManualmente = (idx: number) => {
    setCenaAtiva(idx);
    setSegundoAtual(roteiro[idx].segundoInicio);
    if (audioAtivo && roteiro[idx]) {
      const { tom, genero } = obterTomEGenero(idx);
      narrarFalaFluida(roteiro[idx].falaAudio, tom, genero);
    }
  };

  const copiarRoteiroCompleto = () => {
    const texto = roteiro.map(c => (
      `[${c.segundoInicio}s - ${c.segundoFim}s] ENQUADRAMENTO: ${c.enquadramentoCamera}\n` +
      `VISUAL: ${c.acaoVisual}\n` +
      `FALA: ${c.falaAudio}\n` +
      `DICA DA IA: ${c.dicaDirecao}\n` +
      `----------------------------------------\n`
    )).join('\n');

    navigator.clipboard.writeText(`ROTEIRO DE VÍDEO - ${tituloCampanha}\n\n${texto}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="gb-panel p-6 shadow-xl text-white">
      {/* CABEÇALHO DO ROTEIRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">Simulador de Vídeo em 60 FPS com Áudio Nativo</h3>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono font-bold uppercase">
              Motor Render 60FPS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Animação fluída com movimento de câmera, equalizador de áudio e narração contínua em Português-BR
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* BOTAO PARA MUTAR OU ATIVAR A VOZ DA IA */}
          <button
            onClick={() => setAudioAtivo(!audioAtivo)}
            className={`p-2 rounded-xl border text-xs font-mono transition-all ${
              audioAtivo
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={audioAtivo ? "Narração de Áudio Ativa (PT-BR)" : "Áudio Muted"}
          >
            {audioAtivo ? <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={iniciarOuPausarSimulador}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md ${
              tocandoSimulador
                ? 'bg-amber-500 text-slate-950 border border-amber-400 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-400 text-white border border-blue-400 shadow-blue-500/20'
            }`}
          >
            {tocandoSimulador ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{tocandoSimulador ? 'Pausar Vídeo' : '▶ Play Vídeo 60fps'}</span>
          </button>

          <button
            onClick={copiarRoteiroCompleto}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all"
          >
            {copiado ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{copiado ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* SELETOR DE CATEGORIA DE ESTILO PARA O ROTEIRO */}
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

      {/* GRID COM SIMULADOR EM CANVAS 60FPS E PAINEL DE CENAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        
        {/* PLAYER DE VÍDEO EM CANVAS 60FPS DENTRO DE SMARTPHONE 9:16 */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Film className="w-4 h-4 text-blue-400" />
              Player Render 60fps (9:16)
            </span>
            <div className="flex items-center space-x-1.5 font-mono text-[10px]">
              <span className={`w-2 h-2 rounded-full ${tocandoSimulador ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-blue-400 font-bold">{segundoAtual}s / {duracaoTotal}s</span>
            </div>
          </div>

          {/* FRAME DO SMARTPHONE COM CANVAS RENDER LOOP EM 60FPS */}
          <div className="w-[260px] h-[450px] bg-slate-900 border-4 border-slate-700 rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col justify-between">
            
            {/* CANVAS RENDERER EM 60 FPS */}
            <canvas
              ref={canvasRef}
              width={260}
              height={450}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* TOP BAR DO SIMULADOR (CENA & SEGUNDOS) */}
            <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
              <span className="text-[9px] font-mono font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase shadow">
                Cena {cenaAtiva + 1} de {roteiro.length}
              </span>
              <span className="text-[9px] font-mono font-bold bg-slate-900/90 text-blue-300 px-2 py-0.5 rounded border border-slate-700">
                {roteiro[cenaAtiva]?.segundoInicio}s - {roteiro[cenaAtiva]?.segundoFim}s
              </span>
            </div>

            {/* TELEPROMPTER OVERLAY (SUBTÍTULOS E FALAS DO ROTEIRO) */}
            <div className="relative z-10 p-4 space-y-2 text-center">
              <div className="bg-slate-950/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-lg">
                <span className="text-[9px] font-mono text-amber-400 uppercase font-bold flex items-center justify-center gap-1 mb-1">
                  <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                  Teleprompter & Narração (PT-BR)
                </span>
                <p className="text-xs font-bold text-white italic leading-snug font-sans">
                  "{roteiro[cenaAtiva]?.falaAudio.replace(/["'“”]/g, '')}"
                </p>
              </div>

              {/* CONTROLES DO PLAYER DENTRO DA TELA */}
              <div className="flex items-center justify-center space-x-3 pt-1">
                <button
                  onClick={iniciarOuPausarSimulador}
                  className="p-2.5 rounded-full bg-blue-500 text-white hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"
                >
                  {tocandoSimulador ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={reiniciarSimulador}
                  className="p-2.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* BARRA DE PROGRESSO DO VÍDEO */}
          <div className="w-full mt-3 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-blue-400 h-full transition-all duration-300"
              style={{ width: `${(segundoAtual / duracaoTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* NAVEGAÇÃO DE CENAS E PAINEL DETALHADO */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {roteiro.map((cena, idx) => (
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
                <span>Cena {idx + 1} ({cena.segundoInicio}s - {cena.segundoFim}s)</span>
              </button>
            ))}
          </div>

          {/* DETALHES DA CENA SELECIONADA */}
          {roteiro[cenaAtiva] && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl border-l border-b border-blue-500/20">
                DURAÇÃO: {roteiro[cenaAtiva].segundoFim - roteiro[cenaAtiva].segundoInicio} SEGUNDOS
              </div>

              {/* ENQUADRAMENTO DA CÂMERA */}
              <div className="flex items-start space-x-3 pt-1">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Enquadramento & Câmera
                  </span>
                  <p className="text-xs font-mono font-bold text-blue-300 mt-0.5">
                    {roteiro[cenaAtiva].enquadramentoCamera}
                  </p>
                </div>
              </div>

              {/* AÇÃO VISUAL */}
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Ação Visual em Cena
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                    {roteiro[cenaAtiva].acaoVisual}
                  </p>
                </div>
              </div>

              {/* FALA / ÁUDIO */}
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Fala / Locução do Roteiro (Narrada por Voz)
                    </span>
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

                  {/* SELETOR DE TOM DE NARRAÇÃO (clicável — troca e já toca a prévia) */}
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

                  {/* SELETOR DE GÊNERO DE VOZ (clicável — troca e já toca a prévia) */}
                  <div className="mt-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1">
                      <UserRound className="w-2.5 h-2.5" />
                      Gênero da Voz
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
                  </div>
                </div>
              </div>

              {/* DICA DE DIREÇÃO DA IA */}
              <div className="mt-2 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center space-x-2.5 text-xs text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span><strong>Direção da IA:</strong> {roteiro[cenaAtiva].dicaDirecao}</span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* TODAS AS CENAS EM LISTA EXPANDIDA */}
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
                <span className="font-mono text-blue-400 font-bold">[{c.segundoInicio}s - {c.segundoFim}s]</span>
                <span className="truncate text-slate-200 font-medium">{c.falaAudio.replace(/["'“”]/g, '')}</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                Cena {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
