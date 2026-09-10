import React from 'react';
import { Sparkles, Brain, Bot, Compass, Clapperboard, CheckCircle2, Loader2 } from 'lucide-react';

interface PropriedadesCarregamento {
  etapaTexto: string;
  percentual: number;
}

export const ModuloCarregamentoIA: React.FC<PropriedadesCarregamento> = ({ etapaTexto, percentual }) => {
  const etapasVisuais = [
    { titulo: "Leitura das respostas e classificação do negócio", minPct: 15 },
    { titulo: "Consulta de referências na web, quando disponível", minPct: 40 },
    { titulo: "Preparação da estratégia e das hipóteses", minPct: 65 },
    { titulo: "Criação de Mocks Visuais: Copy + Imagem + Roteiro de Vídeo", minPct: 85 },
    { titulo: "Organização do plano e indicadores de demonstração", minPct: 100 }
  ];

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 text-white">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
        
        {/* GLOW DECORATIVO DE PROCESSAMENTO */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* ICONE ANIMADO */}
        <div className="relative inline-flex items-center justify-center p-5 rounded-3xl bg-slate-800/80 border border-emerald-500/30 text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
          <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          SaaS GrowBiz <span className="text-emerald-400">V2.2 Core IA</span>
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          Processando dados do diagnóstico e arquitetando a melhor estratégia de crescimento
        </p>

        {/* BARRA DE PROGRESSO DINÂMICA */}
        <div className="mt-8 mb-8 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-400 font-mono flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              {etapaTexto || 'Iniciando inteligência...'}
            </span>
            <span className="text-white font-mono text-sm">{percentual}%</span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* LISTA DAS ETAPAS PROCESSADAS PELA IA */}
        <div className="space-y-2.5 text-left bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
          {etapasVisuais.map((item, idx) => {
            const concluido = percentual >= item.minPct;
            const emAndamento = percentual < item.minPct && (idx === 0 || percentual >= etapasVisuais[idx - 1].minPct);

            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 text-xs p-2.5 rounded-xl transition-all ${
                  concluido
                    ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20'
                    : emAndamento
                    ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {concluido ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : emAndamento ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                )}
                <span className="truncate">{item.titulo}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
