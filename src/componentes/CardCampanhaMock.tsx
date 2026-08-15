import React, { useState } from 'react';
import { MockCampanhaConteudo } from '../tipos';
import { Copy, Check, Sparkles, Share2, Image as ImageIcon, MessageSquare, Target, RefreshCw, Loader2 } from 'lucide-react';
import { CategoriaEstilo, CATEGORIAS_ESTILO_IMAGEM } from '../servicos/servicoCategoriasEstilo';
import { SeletorDeCategoria } from './SeletorDeCategoria';

interface PropriedadesCampanha {
  campanha: MockCampanhaConteudo;
  imagemUrl: string;
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
    navigator.clipboard.writeText(campanha.promptImagemIa);
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* COLUNA DA IMAGEM GERADA POR IA EM TEMPO REAL */}
        <div className="lg:col-span-5 p-5 bg-slate-950/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Mockup Visual de Anúncio
              </span>

              {/* SELETOR DE MODO DA IMAGEM (IA GERATIVA x FOTO DE ALTA DEFINIÇÃO DO SETOR) */}
              <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setModoImagem('ia')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                    modoImagem === 'ia' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  IA Generativa
                </button>
                <button
                  onClick={() => setModoImagem('curada')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
                    modoImagem === 'curada' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Foto Setor
                </button>
              </div>
            </div>

            {/* SELETOR DE CATEGORIA DE ESTILO PARA A IMAGEM */}
            <SeletorDeCategoria
              titulo="Categoria do Estilo Visual"
              categorias={CATEGORIAS_ESTILO_IMAGEM}
              categoriaAtivaId={estiloSelecionado?.id || null}
              aoSelecionar={aoSelecionarEstilo}
              carregando={carregandoImagem}
            />

            {/* PREVIEW DA IMAGEM DE CAMPANHA IA */}
            <div className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-[9/16] shadow-lg bg-slate-800 flex items-center justify-center">
              {carregandoImagem && (
                <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                  <span className="text-xs font-mono font-bold text-white uppercase">Gerando Imagem Comercial por IA...</span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1">Renderizando composição</span>
                </div>
              )}

              <img
                src={imagemIaUrl}
                alt={campanha.tituloCampanha}
                onLoad={aoCarregarImagem}
                onError={aoErroImagem}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 text-xs pointer-events-none">
                <span className="text-[10px] text-blue-400 font-bold block uppercase tracking-widest font-mono">
                  Chamada em Destaque
                </span>
                <p className="font-bold text-white mt-0.5">{campanha.chamadaParaAcao}</p>
              </div>
            </div>

            {/* BOTAO PARA RE-GERAR NOVA IMAGEM COM IA */}
            {modoImagem === 'ia' && (
              <button
                onClick={regenerarImagemIa}
                disabled={carregandoImagem}
                className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${carregandoImagem ? 'animate-spin' : ''}`} />
                <span>Recriar Variação de Imagem com IA</span>
              </button>
            )}
          </div>

          {/* PROMPT UTILIZADO PARA GERAR A IMAGEM */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Prompt da Imagem (IA):</span>
              <button
                onClick={copiarPromptImagem}
                className="text-[10px] font-mono text-blue-400 hover:underline flex items-center gap-1"
              >
                {promptCopiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {promptCopiado ? 'Copiado!' : 'Copiar Prompt'}
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 line-clamp-2">
              "{campanha.promptImagemIa}"
            </p>
          </div>
        </div>

        {/* COLUNA DA COPY PERSUASIVA & HASHTAGS */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Copy Persuasiva Pronta para Publicação
              </span>
              <button
                onClick={copiarTextoCopy}
                className="flex items-center space-x-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
              >
                {copyCopiada ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyCopiada ? 'Copy Copiada!' : 'Copiar Texto'}</span>
              </button>
            </div>

            {/* CORPO DA COPY COM BORDA DE ACENTO */}
            <div className="bg-slate-800/80 p-4 rounded-xl border-l-4 border-blue-500 border-slate-700 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans mb-4">
              {campanha.copyPersuasiva}
            </div>

            {/* HASHTAGS ESTRATÉGICAS */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Hashtags de Alto Engajamento e Alcance Local:
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
          </div>

          {/* DICA DE AÇÃO OMNICHANNEL */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
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
