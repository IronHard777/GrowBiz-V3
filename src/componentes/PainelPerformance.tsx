import React from 'react';
import { KPIsPerformance, AlertaPivotagem } from '../tipos';
import { BarChart3, TrendingUp, AlertTriangle, ArrowUpRight, DollarSign, Target, MousePointerClick, RefreshCw } from 'lucide-react';

interface PropriedadesPerformance {
  kpis: KPIsPerformance;
  alerta: AlertaPivotagem;
  aoSolicitarPivotagem: () => void;
}

export const PainelPerformance: React.FC<PropriedadesPerformance> = ({ kpis, alerta, aoSolicitarPivotagem }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-6">
      
      {/* CABEÇALHO DO MÓDULO 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Dashboard de Performance & Consultoria (Módulo 4)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento proativo 24/7 e Alertas de Pivotagem de Tendência
          </p>
        </div>

        <span className="text-xs bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 rounded-full font-mono flex items-center gap-1.5 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          KPIs Consolidados
        </span>
      </div>

      {/* CARDS DE KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Taxa de Clique (CTR)</span>
            <MousePointerClick className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{kpis.taxaCliqueCTR}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +1.8% vs média do setor
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Taxa de Conversão</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{kpis.taxaConversao}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3 h-3" /> Alta qualificação de leads
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Retorno (ROI)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{kpis.retornoSobreInvestimentoROI}</div>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            R$ 4,20 retornados por R$ 1,00
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Custo por Aquisição</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{kpis.custoPorAdquisicaoCPA}</div>
          <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
            Excelente eficiência
          </span>
        </div>

      </div>

      {/* ALERTA PROATIVO DE PIVOTAGEM DA IA */}
      {alerta.ativo && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-amber-300">
                  ALERTA PROATIVO DA IA: Transição de Campanha Recomendada
                </h4>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Sensoriamento 24/7
                </span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {alerta.mensagem}
              </p>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/20 text-xs text-slate-200">
                <span className="font-bold text-amber-300 block mb-0.5">Ação de Pivotagem Sugerida:</span>
                {alerta.acaoRecomendada}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={aoSolicitarPivotagem}
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Aplicar Pivotagem de Campanha Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
