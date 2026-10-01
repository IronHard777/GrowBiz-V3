import React, { useEffect, useState } from 'react';
import { DiagnosticoCompleto, MockCampanhaConteudo, PropostaCampanha } from '../tipos';
import { GERAR_PROPOSTAS_CAMPANHA_GEMINI, TEM_CHAVE_GEMINI_CONFIGURADA } from '../servicos/servicoGemini';
import { GERAR_PROPOSTAS_CAMPANHA_FALLBACK } from '../servicos/servicoIA';
import { Compass, Loader2, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

const CHAVE_PROPOSTAS_PREFIXO = 'growbiz:propostas-campanha:';

function obterChavePropostas(diagnosticoId: string, campanhaId: string): string {
  return `${CHAVE_PROPOSTAS_PREFIXO}${diagnosticoId}:${campanhaId}`;
}

function lerPropostasPersistidas(chave: string): PropostaCampanha[] {
  if (typeof window === 'undefined') return [];
  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return [];
    const valor: unknown = JSON.parse(bruto);
    if (!Array.isArray(valor)) return [];
    return valor.filter((item): item is PropostaCampanha => (
      !!item && typeof item === 'object' && typeof (item as PropostaCampanha).id === 'string'
    ));
  } catch {
    return [];
  }
}

function salvarPropostasPersistidas(chave: string, propostas: PropostaCampanha[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(chave, JSON.stringify(propostas));
  } catch {
    // A sessao continua funcionando mesmo se o armazenamento estiver indisponivel.
  }
}

interface PropriedadesPropostas {
  diagnostico: DiagnosticoCompleto;
  campanha: MockCampanhaConteudo;
  aoAdicionarAoKanban: (proposta: PropostaCampanha) => void;
  aoAbrirProposta: (proposta: PropostaCampanha) => void;
  idsJaAdicionados: string[];
}

export const ModuloPropostasCampanha: React.FC<PropriedadesPropostas> = ({ diagnostico, campanha, aoAdicionarAoKanban, aoAbrirProposta, idsJaAdicionados }) => {
  const chavePersistencia = obterChavePropostas(diagnostico.id, campanha.id);
  const [propostas, setPropostas] = useState<PropostaCampanha[]>(() => lerPropostasPersistidas(chavePersistencia));
  const [carregando, setCarregando] = useState<boolean>(() => lerPropostasPersistidas(chavePersistencia).length === 0);
  const [nonceGeracao, setNonceGeracao] = useState(0);

  useEffect(() => {
    let ativo = true;
    const persistidas = lerPropostasPersistidas(chavePersistencia);

    if (persistidas.length > 0) {
      setPropostas(persistidas);
      setCarregando(false);
      return () => { ativo = false; };
    }

    setPropostas([]);
    setCarregando(true);

    const carregar = async () => {
      let geradas: PropostaCampanha[] | null = null;
      if (TEM_CHAVE_GEMINI_CONFIGURADA()) {
        geradas = await GERAR_PROPOSTAS_CAMPANHA_GEMINI(diagnostico, campanha);
      }
      if (!ativo) return;

      const resultado = geradas && geradas.length > 0
        ? geradas
        : GERAR_PROPOSTAS_CAMPANHA_FALLBACK(diagnostico);
      salvarPropostasPersistidas(chavePersistencia, resultado);
      setPropostas(resultado);
      setCarregando(false);
    };

    carregar();
    return () => { ativo = false; };
    // The key changes only when the diagnosis/campaign context changes; nonce changes only on Regenerar.
  }, [chavePersistencia, nonceGeracao]);

  const regenerar = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(chavePersistencia);
    }
    setPropostas([]);
    setCarregando(true);
    setNonceGeracao((valor) => valor + 1);
  };

  return (
    <div className="gb-panel p-6 sm:p-8 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Com base no seu perfil</span>
      </div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold">3 campanhas sugeridas para {diagnostico.nomeNegocio}</h2>
        <button
          type="button"
          onClick={regenerar}
          disabled={carregando || propostas.length === 0}
          className="gb-btn-ghost flex items-center gap-2 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerar</span>
        </button>
      </div>

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
