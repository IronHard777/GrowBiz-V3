import React from 'react';
import { ResultadoCompletoConsultoria } from '../../tipos';
import {
  Sparkles,
  Compass,
  Clapperboard,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';
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
  modulo2: <Compass className="w-3.5 h-3.5" />,
  modulo3: <Clapperboard className="w-3.5 h-3.5" />,
  propostas: <Sparkles className="w-3.5 h-3.5" />,
  kanban: <LayoutGrid className="w-3.5 h-3.5" />,
  modulo4: <BarChart3 className="w-3.5 h-3.5" />
};

/**
 * Resultados — profundidade completo (consultoria + estratégia + performance).
 * Abas: Estratégia Tripla, Mocks, Propostas, Kanban, Performance.
 * Vídeo / presets seguem as flags do tier.
 */
export const ModuloResultadosCompleto: React.FC<Props> = ({
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
      <div className="gb-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                {copyCabecalho.badge}
              </span>
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  diagnostico.categoriaModelo?.quadrante === 1 ||
                  diagnostico.categoriaModelo?.quadrante === 4
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-blue-500 text-white border-blue-400'
                }`}
              >
                {diagnostico.categoriaModelo
                  ? `Q${diagnostico.categoriaModelo.quadrante} · ${diagnostico.categoriaModelo.categoria}`
                  : `Matriz: Decisão ${diagnostico.tipoDecisaoCalculado === 'RAPIDA' ? 'Rápida' : 'Elaborada'}`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {copyCabecalho.tituloPrefixo}{' '}
              <span className="text-blue-400">{diagnostico.nomeNegocio}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {diagnostico.justificativaMatriz || copyCabecalho.subtituloFallback}
            </p>
            <p className="text-[11px] text-blue-300/90 mt-2 font-mono max-w-2xl flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 flex-shrink-0" />
              Comece pela Estratégia Tripla; depois execute mocks, propostas e acompanhe a performance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-slate-300">
                {infoTier.nome}
              </span>
              <button
                type="button"
                onClick={aoTrocarTier}
                className="text-[11px] text-slate-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                title="Trocar formato do plano"
              >
                Trocar plano
              </button>
            </div>
            <button
              onClick={aoRefazerDiagnostico}
              className="gb-btn-ghost flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Refazer Filtro</span>
            </button>
          </div>
        </div>

        <div className="mt-5 text-sm text-slate-300 space-y-3">
          <p>
            {diagnostico.sensoriamento.statusPesquisa === 'consultado'
              ? 'Referências de mercado consultadas — resultados de terceiros não garantem o desempenho desta campanha.'
              : 'Pesquisa indisponível. Este plano contém hipóteses para validar, sem casos comprovados.'}
          </p>
          {diagnostico.sensoriamento.fontes?.map((fonte, i) => (
            <a
              key={i}
              href={fonte.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mr-4 text-blue-300 underline"
            >
              {fonte.titulo}
            </a>
          ))}
          {diagnostico.sensoriamento.sugestoesBuscaHtml && (
            <iframe
              title="Sugestões de pesquisa do Google"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={diagnostico.sensoriamento.sugestoesBuscaHtml}
              className="w-full border-0 h-20"
            />
          )}
        </div>
        {diagnostico.sensoriamento.casosDeSucessoAncorados.length > 0 && (
          <details className="mt-4 border-t border-white/10 pt-4">
            <summary className="cursor-pointer text-sm text-blue-300 font-semibold">
              Ver pesquisa, resultados reportados e limites de aplicação
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 max-w-4xl">
              {diagnostico.sensoriamento.casosDeSucessoAncorados
                .flatMap((caso) => caso.split(/\n\s*\n/))
                .map((paragrafo, idx) => (
                  <p key={idx}>{paragrafo.replace(/\*+/g, '')}</p>
                ))}
            </div>
          </details>
        )}
      </div>

      {notificacaoPivotagem && (
        <div className="bg-blue-500 text-white p-4 rounded-xl font-mono text-xs font-bold flex items-center space-x-3 shadow-xl animate-bounce border border-blue-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
          <span>
            Pivotagem de Campanha aplicada com sucesso! O orçamento foi otimizado para focar no Roteiro
            de Vídeo em alta no TikTok / Instagram.
          </span>
        </div>
      )}

      {/* Stepper presente, sem ênfase visual do enxuto — ao lado da estratégia */}
      <PassosFluxoPublicacao estado={estadoFluxo} aoIrParaPasso={aoIrParaPassoFluxo} />

      <div className="flex flex-wrap items-center gap-2">
        {metasAbas.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            className={`gb-tab flex items-center gap-2 ${
              abaAtiva === tab.id ? 'gb-tab-active' : ''
            }${tab.id === 'modulo2' && abaAtiva !== 'modulo2' ? ' border-blue-500/30' : ''}`}
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
