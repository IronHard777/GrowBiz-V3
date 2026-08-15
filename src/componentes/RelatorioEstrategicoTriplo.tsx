import React from 'react';
import { EstrategiaCrescimento } from '../tipos';
import { Compass, Flame, Share2, CheckCircle, ShieldCheck, Zap, Globe, MessageCircle, MapPin } from 'lucide-react';

interface PropriedadesRelatorio {
  estrategias: EstrategiaCrescimento;
}

export const RelatorioEstrategicoTriplo: React.FC<PropriedadesRelatorio> = ({ estrategias }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Relatório Triplo de Crescimento (Módulo 2)</h3>
            <p className="text-xs text-slate-400">Plano Estratégico influenciado pela Matriz de Decisão do Módulo 1</p>
          </div>
        </div>

        {/* CARDS DAS 3 ESTRATÉGIAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. ESTRATÉGIA BASE */}
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">1. Estratégia Base</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{estrategias.estrategiaBase.titulo}</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{estrategias.estrategiaBase.descricao}</p>
              
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Pilares Atemporais:</span>
                {estrategias.estrategiaBase.pilaresAtemporais.map((pilar, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{pilar}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[10px] text-slate-400 font-mono">
              Foco: Sustentabilidade e Marca
            </div>
          </div>

          {/* 2. ESTRATÉGIA DE OPORTUNIDADE */}
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2.5 py-1 rounded-bl-lg border-l border-b border-emerald-500/20">
              ATAQUE IMEDIATO
            </div>
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-3">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">2. Estratégia Oportunidade</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-2">{estrategias.estrategiaOportunidade.titulo}</h4>
              <p className="text-xs text-emerald-200 font-medium mb-3 bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
                {estrategias.estrategiaOportunidade.planoAtaqueImediato}
              </p>
              
              <div className="mt-2 text-xs text-slate-300">
                <span className="text-[11px] font-semibold text-amber-300 block mb-1">Gatilho de Tendência Mapeado:</span>
                <p className="text-xs text-slate-300 italic">"{estrategias.estrategiaOportunidade.gatilhoTendencia}"</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[10px] text-emerald-400 font-mono">
              Foco: Conversão Rápida em 48h
            </div>
          </div>

          {/* 3. ESTRATÉGIA COMPLEMENTAR */}
          <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 mb-3">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">3. Jornada Omnichannel</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-3">{estrategias.estrategiaComplementar.titulo}</h4>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">Google Meu Negócio & Mapa:</span>
                    <p className="text-slate-300 text-[11px]">{estrategias.estrategiaComplementar.jornadaForaRedes.googleMeuNegocio}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">WhatsApp Estratégico:</span>
                    <p className="text-slate-300 text-[11px]">{estrategias.estrategiaComplementar.jornadaForaRedes.whatsappEstrategico}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[10px] text-cyan-400 font-mono">
              Foco: Retenção e Vendas Diretas
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
