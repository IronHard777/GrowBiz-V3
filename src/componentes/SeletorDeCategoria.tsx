import React from 'react';
import { CategoriaEstilo } from '../servicos/servicoCategoriasEstilo';
import { Loader2, Sparkles, Palette, Check } from 'lucide-react';

interface PropriedadesSeletor {
  titulo: string;
  categorias: CategoriaEstilo[];
  categoriaAtivaId: string | null;
  aoSelecionar: (categoria: CategoriaEstilo) => void;
  carregando: boolean;
  /** Aplica um loop sutil de zoom/pan na miniatura, simulando uma prévia "viva" (usado no seletor de vídeo). */
  animarComZoom?: boolean;
}

export const SeletorDeCategoria: React.FC<PropriedadesSeletor> = ({ titulo, categorias, categoriaAtivaId, aoSelecionar, carregando, animarComZoom }) => {
  const deNegocio = categorias.filter(c => c.grupo === 'negocio');
  const esteticas = categorias.filter(c => c.grupo === 'estetico');

  const renderCard = (categoria: CategoriaEstilo) => {
    const ativa = categoriaAtivaId === categoria.id;
    return (
      <button
        key={categoria.id}
        type="button"
        disabled={carregando}
        onClick={() => aoSelecionar(categoria)}
        title={categoria.nome}
        aria-pressed={ativa}
        className={`relative flex-shrink-0 w-[112px] h-[112px] rounded-xl overflow-hidden border-2 transition-all disabled:cursor-not-allowed group ${
          ativa
            ? 'border-blue-400 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/40'
            : 'border-slate-700 hover:border-slate-500 opacity-90 hover:opacity-100'
        } ${carregando && !ativa ? 'opacity-40' : ''}`}
      >
        {categoria.thumbnailUrl ? (
          <img
            src={categoria.thumbnailUrl}
            loading="lazy"
            decoding="async"
            alt={categoria.nome}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
              animarComZoom ? 'animar-ken-burns' : 'group-hover:scale-110'
            }`}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-800" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-transparent" />

        {ativa && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shadow">
            {carregando ? <Loader2 className="w-2.5 h-2.5 text-white animate-spin" /> : <Check className="w-2.5 h-2.5 text-white" />}
          </div>
        )}

        <span className="absolute bottom-1 left-1.5 right-1.5 text-[11px] font-semibold text-white leading-tight text-left drop-shadow">
          {categoria.nome}
        </span>
      </button>
    );
  };

  return (
    <div className="mb-4">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">{titulo}</span>

      {deNegocio.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Estilos de Negócio</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {deNegocio.map(renderCard)}
          </div>
        </>
      )}

      {esteticas.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-1.5 mt-2">
            <Palette className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500">Estilos Criativos</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {esteticas.map(renderCard)}
          </div>
        </>
      )}
    </div>
  );
};
