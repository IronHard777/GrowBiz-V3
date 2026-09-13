import React, { useEffect, useState } from 'react';
import { DiagnosticoCompleto, MockCampanhaConteudo, PropostaCampanha } from '../tipos';
import { GERAR_PROPOSTAS_CAMPANHA_GEMINI, TEM_CHAVE_GEMINI_CONFIGURADA } from '../servicos/servicoGemini';
import { GERAR_PROPOSTAS_CAMPANHA_FALLBACK } from '../servicos/servicoIA';
import { Compass, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface PropriedadesPropostas {
  diagnostico: DiagnosticoCompleto;
  campanha: MockCampanhaConteudo;
  aoAdicionarAoKanban: (proposta: PropostaCampanha) => void;
  aoAbrirProposta: (proposta: PropostaCampanha) => void;
  idsJaAdicionados: string[];
}

export const ModuloPropostasCampanha: React.FC<PropriedadesPropostas> = ({ diagnostico, campanha, aoAdicionarAoKanban, aoAbrirProposta, idsJaAdicionados }) => {
  const [propostas, setPropostas] = useState<PropostaCampanha[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    const carregar = async () => {
      if (TEM_CHAVE_GEMINI_CONFIGURADA()) {
        const geradas = await GERAR_PROPOSTAS_CAMPANHA_GEMINI(diagnostico, campanha);
        if (!ativo) return;
        setPropostas(geradas || GERAR_PROPOSTAS_CAMPANHA_FALLBACK(diagnostico));
      } else {
        setPropostas(GERAR_PROPOSTAS_CAMPANHA_FALLBACK(diagnostico));
      }
      if (ativo) setCarregando(false);
    };

    carregar();
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnostico.id]);

  return (
    <div className="gb-panel p-6 sm:p-8 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Com base no seu perfil</span>
      </div>
      <h2 className="text-lg sm:text-xl font-bold mb-6">3 campanhas sugeridas para {diagnostico.nomeNegocio}</h2>

      {carregando ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Gerando propostas com IA...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {propostas.map((proposta) => {
            const jaAdicionada = idsJaAdicionados.includes(proposta.id);
            return (
              <div key={proposta.id} className="gb-card p-5 flex flex-col justify-between">
                <div>
                  <span className="gb-badge-plat mb-3">{proposta.plataforma}</span>
                  <h4 className="text-sm font-bold text-white mb-1.5">{proposta.titulo}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{proposta.descricao}</p>
                  <div className="text-xs font-bold mb-4" style={{ color: 'var(--gb-blue-2)' }}>
                    {proposta.aderenciaPercentual}% de aderência ao seu perfil
                  </div>
                </div>
                <button
                    type="button"
                    onClick={() => aoAbrirProposta(proposta)}
                    className="gb-btn w-full flex items-center justify-center gap-2 mb-2"
                  >
                    <span>Abrir</span>
                  </button>
                  <button
                  onClick={() => aoAdicionarAoKanban(proposta)}
                  disabled={jaAdicionada}
                  className={jaAdicionada ? 'gb-btn-ghost w-full flex items-center justify-center gap-2' : 'gb-btn w-full flex items-center justify-center gap-2'}
                >
                  {jaAdicionada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{jaAdicionada ? 'Adicionada ao Kanban' : 'Adicionar ao Kanban'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
