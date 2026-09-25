import React, { useState } from 'react';
import { MockCampanhaConteudo } from '../tipos';
import { Copy, Check, Sparkles, Share2, Image as ImageIcon, MessageSquare, Target, RefreshCw, Loader2 } from 'lucide-react';
import { CategoriaEstilo, CATEGORIAS_ESTILO_IMAGEM } from '../servicos/servicoCategoriasEstilo';
import { SeletorDeCategoria } from './SeletorDeCategoria';

interface PropriedadesCampanha {
  campanha: MockCampanhaConteudo;
  imagemUrl: string;
  promptAplicado: string;
  carregandoImagem: boolean;
  modoImagem: 'ia' | 'curada';
  aoAlterarModoImagem: (modo: 'ia' | 'curada') => void;
  aoRegenerarImagem: () => void;
  aoCarregarImagem: () => void;
  aoErroImagem: () => void;
  estiloSelecionado: CategoriaEstilo | null;
  aoSelecionarEstilo: (categoria: CategoriaEstilo) => void;
}

export const CardCampanhaMock: React.FC<PropriedadesCampanha> = ({
  campanha,
  imagemUrl: imagemIaUrl,
  promptAplicado,
  carregandoImagem,
  modoImagem,
  aoAlterarModoImagem: setModoImagem,
  aoRegenerarImagem: regenerarImagemIa,
  aoCarregarImagem,
  aoErroImagem,
  estiloSelecionado,
  aoSelecionarEstilo
}) => {
  const [copyCopiada, setCopyCopiada] = useState<boolean>(false);
  const [promptCopiado, setPromptCopiado] = useState<boolean>(false);

  const copiarTextoCopy = () => {
    const textoCompleto = `${campanha.copyPersuasiva}\n\n${campanha.hashtagsEstrategicas.join(' ')}`;
    navigator.clipboard.writeText(textoCompleto);
    setCopyCopiada(true);
    setTimeout(() => setCopyCopiada(false), 2000);
  };

  const copiarPromptImagem = () => {
    navigator.clipboard.writeText(promptAplicado);
    setPromptCopiado(true);
    setTimeout(() => setPromptCopiado(false), 2000);
  };

  return (
    <div className="gb-panel overflow-hidden shadow-2xl text-white">
      {/* CABEÇALHO DO MOCK DE CRIAÇÃO */}
      <div className="p-5 border-b border-slate-700 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">{campanha.tituloCampanha}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            Objetivo: <span className="text-slate-200 font-semibold">{campanha.objetivoPrincipal}</span>
          </p>
        </div>

        <span className="self-start sm:self-auto text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
          {campanha.canalIdeal}
        </span>
      </div>

      {/* GRID DO MOCKUP VISUAL (IMAGEM GERADA POR IA + COPY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5">
        
        {/* COLUNA DA IMAGEM — frame 9:16 como o player de vídeo */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              Mockup Visual 9:16
            </span>
            <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setModoImagem('ia')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                  modoImagem === 'ia' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IA
              </button>
              <button
                type="button"
                onClick={() => setModoImagem('curada')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                  modoImagem === 'curada' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Foto
              </button>
            </div>
          </div>

          <div className="w-[260px] h-[450px] bg-slate-900 border-4 border-slate-700 rounded-[32px] overflow-hidden relative shadow-2xl flex items-center justify-center">
            {carregandoImagem && (
              <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <span className="text-xs font-mono font-bold text-white uppercase">Gerando imagem…</span>
              </div>
            )}

            {!imagemIaUrl && !carregandoImagem ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Quadro vazio</span>
                <span className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                  Gere a imagem com IA ou escolha Foto. Nenhuma foto de estoque é carregada automaticamente.
                </span>
                <button
                  type="button"
                  onClick={regenerarImagemIa}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-mono font-bold uppercase tracking-wider"
                >
                  Gerar imagem com IA
                </button>
              </div>
            ) : (
              <img
                src={imagemIaUrl || undefined}
                alt={campanha.tituloCampanha}
                onLoad={aoCarregarImagem}
                onError={aoErroImagem}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {imagemIaUrl && <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 pointer-events-none" />}

            {imagemIaUrl && (
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 text-xs pointer-events-none z-10">
                <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-widest font-mono">
                  Chamada em Destaque
                </span>
                <p className="font-bold text-white mt-0.5">{campanha.chamadaParaAcao}</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — estilo + copy (ocupa o espaço como as cenas no vídeo) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <SeletorDeCategoria
            titulo="Categoria do Estilo Visual"
            categorias={CATEGORIAS_ESTILO_IMAGEM}
            categoriaAtivaId={estiloSelecionado?.id || null}
            aoSelecionar={aoSelecionarEstilo}
            carregando={carregandoImagem}
          />

          {modoImagem === 'ia' && (
            <button
              type="button"
              onClick={regenerarImagemIa}
              disabled={carregandoImagem}
              className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregandoImagem ? 'animate-spin' : ''}`} />
              <span>Recriar variação de imagem com IA</span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Copy persuasiva pronta para publicação
            </span>
            <button
              type="button"
              onClick={copiarTextoCopy}
              className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
            >
              {copyCopiada ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copyCopiada ? 'Copy Copiada!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border-l-4 border-blue-500 border-slate-700 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans flex-1">
            {campanha.copyPersuasiva}
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Hashtags de alto engajamento:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {campanha.hashtagsEstrategicas.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-800 text-blue-400 px-2.5 py-1 rounded-md border border-slate-700 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              Pronto para impulsionar no Meta Ads ou publicar organicamente.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
