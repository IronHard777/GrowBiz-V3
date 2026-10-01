import React from 'react';
import { ResultadoCompletoConsultoria } from '../../tipos';
import { Sparkles, Clapperboard, LayoutGrid, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { IdTierPlano } from '../../tipos/tierPlano';
import { PassosFluxoPublicacao } from '../../components/fluxo/PassosFluxoPublicacao';
import { useLogicaResultados } from './useLogicaResultados';
import { ConteudoAbasResultados } from './ConteudoAbasResultados';

interface Props {
  resultado: ResultadoCompletoConsultoria;
  tier: IdTierPlano;
  aoRefazerDiagnostico: () => void;
  aoTrocarTier: () => void;
}

const ICONES_ABA: Record<string, React.ReactNode> = {
  modulo3: <Clapperboard className="w-3.5 h-3.5" />,
  propostas: <Sparkles className="w-3.5 h-3.5" />,
  kanban: <LayoutGrid className="w-3.5 h-3.5" />
};

/**
 * Resultados — profundidade enxuto (campanha leve + presets + fluxo feliz).
 * Abas: Mocks, Propostas, Kanban. Sem Estratégia Tripla / Performance.
 */
export const ModuloResultadosEnxuto: React.FC<Props> = ({
  resultado,
  tier,
  aoRefazerDiagnostico,
  aoTrocarTier
}) => {
  const logica = useLogicaResultados({ resultado, tier });
  const {
    infoTier,
    copyCabecalho,
    metasAbas,
    diagnostico,
    abaAtiva,
    setAbaAtiva,
    notificacaoPivotagem,
    estadoFluxo,
    aoIrParaPassoFluxo,
    irProximaEtapa,
    temProximaEtapa
  } = logica;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 text-white space-y-8">
      <div className="gb-panel p-6 sm:p-8 relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                {copyCabecalho.badge}
              </span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider bg-amber-500 text-slate-950 border-amber-400">
                {infoTier.mostraPresetsMidia ? 'Presets de mídia' : 'Campanha leve'}
                {infoTier.incluiVideo ? ' · vídeo' : ' · imagens'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {copyCabecalho.tituloPrefixo}{' '}
              <span className="text-amber-300">{diagnostico.nomeNegocio}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {diagnostico.justificativaMatriz || copyCabecalho.subtituloFallback}
            </p>
            <p className="text-[11px] text-amber-200/80 mt-2 font-mono max-w-2xl">
              Foque no fluxo: gerar mídia → proposta → Kanban → publicar. Estratégia completa fica no plano Completo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200">
                {infoTier.nome}
              </span>
              <button
                type="button"
                onClick={aoTrocarTier}
                className="text-[11px] text-slate-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                title="Trocar formato do plano"
              >
                Trocar plano
              </button>
            </div>
            <button
              onClick={aoRefazerDiagnostico}
              className="gb-btn-ghost flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" />
              <span>Refazer Filtro</span>
            </button>
          </div>
        </div>
      </div>

      {notificacaoPivotagem && (
        <div className="bg-blue-500 text-white p-4 rounded-xl font-mono text-xs font-bold flex items-center space-x-3 shadow-xl animate-bounce border border-blue-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
          <span>Pivotagem aplicada. No plano enxuto, priorize regenerar o mock e seguir o fluxo feliz.</span>
        </div>
      )}

      {/* Stepper enfatizado no enxuto */}
      <div className="rounded-2xl ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10 p-1">
        <PassosFluxoPublicacao
          estado={estadoFluxo}
          aoIrParaPasso={aoIrParaPassoFluxo}
          enfatizado
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {metasAbas.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            className={`gb-tab flex items-center gap-2 ${abaAtiva === tab.id ? 'gb-tab-active' : ''}`}
          >
            {ICONES_ABA[tab.id]}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <ConteudoAbasResultados abaAtiva={abaAtiva} logica={logica} />

      {temProximaEtapa() && (
        <div className="pt-4 flex justify-end">
          <button type="button" onClick={irProximaEtapa} className="gb-btn flex items-center gap-2">
            <span>Próxima etapa</span>
          </button>
        </div>
      )}
    </div>
  );
};
