import React, { useState } from 'react';
import { Check, Image as ImageIcon, Clapperboard, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { IdTierPlano, TIERS_PLANO, OBTER_TIER } from '../tipos/tierPlano';

interface PropriedadesEscolhaTier {
  aoEscolher: (id: IdTierPlano) => void;
  tierAtual?: IdTierPlano | null;
  /** true quando veio de Trocar plano (ja tem resultado da IA) */
  jaTemResultado?: boolean;
}

function eCompleto(id: IdTierPlano): boolean {
  return id.startsWith('completo_');
}

export const ModuloEscolhaTier: React.FC<PropriedadesEscolhaTier> = ({
  aoEscolher,
  tierAtual,
  jaTemResultado = false
}) => {
  const [selecionado, setSelecionado] = useState<IdTierPlano | null>(tierAtual ?? null);

  const confirmar = () => {
    if (!selecionado) return;
    aoEscolher(selecionado);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 text-white">
      <div className="gb-panel p-6 sm:p-8 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Formato do plano
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {jaTemResultado ? 'Trocar formato do plano' : 'Escolha o formato do plano para continuar'}
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
          {jaTemResultado
            ? 'Altere o formato do plano. O diagnostico ja gerado sera mantido — ao Continuar voce volta aos resultados com o novo tier.'
            : 'Escolha o formato do plano antes das 7 perguntas. Enxuto usa presets de midia; Completo enfatiza estrategia e estilo visual nas categorias do mock.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {TIERS_PLANO.map((tier) => {
          const ativo = selecionado === tier.id;
          const completo = eCompleto(tier.id);
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelecionado(tier.id)}
              className={`gb-card text-left p-5 transition-all relative overflow-hidden ${
                ativo
                  ? 'ring-2 ring-blue-400 border-blue-400/50 bg-blue-500/10'
                  : 'hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      completo
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {completo ? (
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Enxuto
                      </span>
                    )}
                  </span>
                  {tier.incluiImagem && (
                    <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Imagens
                    </span>
                  )}
                  {tier.incluiVideo && (
                    <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                      <Clapperboard className="w-3 h-3" /> Vídeos
                    </span>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    ativo
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
              <h2 className="text-base font-bold text-white mb-1.5">{tier.nome}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{tier.resumo}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!selecionado}
          onClick={confirmar}
          className="gb-btn flex items-center gap-2 px-6 py-3 disabled:opacity-40"
        >
          <span>{jaTemResultado ? 'Continuar para resultados' : 'Continuar para o diagnostico'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {selecionado && (
        <p className="text-[11px] text-slate-500 mt-3 text-right font-mono">
          Selecionado: {OBTER_TIER(selecionado).nome}
        </p>
      )}
    </div>
  );
};

export default ModuloEscolhaTier;
