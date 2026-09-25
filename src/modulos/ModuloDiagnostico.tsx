import React, { useState, useEffect, useMemo } from 'react';
import { PerfilUsuario, ModeloOperacional, EscopoGeografico, DiagnosticoCompleto, RespostasFiltroSetePerguntas, CategoriaModeloNegocio } from '../tipos';
import { OBTER_CAMPO_LOCALIDADE_ESCOPO, OPCOES_ESCOPO_GEOGRAFICO } from '../utilitarios/escopoGeograficoUi';
import {
  OBTER_SETE_PERGUNTAS_ESTRATEGICAS,
  CALCULAR_CATEGORIA_MODELO_NEGOCIO,
  CRIAR_DIAGNOSTICO_COMPLETO,
  CLASSIFICAR_RESPOSTAS_OUTROS,
  FILTRO_COMPLETO,
  PERGUNTA_ESTA_RESPONDIDA,
  OBTER_RESPOSTA_PERGUNTA,
  VALOR_OPCAO_OUTROS
} from '../servicos/servicoDiagnostico';
import { Brain, Sparkles, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';

interface PropriedadesDiagnostico {
  usuario: PerfilUsuario;
  aoConcluirDiagnostico: (diagnostico: DiagnosticoCompleto) => void;
}

const RESPOSTAS_INICIAIS: RespostasFiltroSetePerguntas = {
  1: { valores: [] },
  2: { valores: [] },
  3: { valores: [] },
  4: { valores: [] },
  5: { valores: [] },
  6: { valores: [] },
  7: { valores: [] }
};

function rotuloQuadrante(categoria: CategoriaModeloNegocio): string {
  return `Q${categoria.quadrante} · ${categoria.categoria}`;
}

export const ModuloDiagnostico: React.FC<PropriedadesDiagnostico> = ({ usuario, aoConcluirDiagnostico }) => {
  const [nomeNegocio, setNomeNegocio] = useState<string>(usuario.nomeEmpresaOuUsuario || '');
  const [setor, setSetor] = useState<string>(usuario.setor || 'Cafeteria e Varejo');
  const [modeloOperacional, setModeloOperacional] = useState<ModeloOperacional>(usuario.modeloOperacional || 'Presencial');
  const [escopoGeografico, setEscopoGeografico] = useState<EscopoGeografico>(usuario.escopoGeografico || 'Local');
  const [cidade, setCidade] = useState<string>(usuario.cidade || '');

  const [respostasFiltro, setRespostasFiltro] = useState<RespostasFiltroSetePerguntas>(RESPOSTAS_INICIAIS);
  const [perguntaAtualIdx, setPerguntaAtualIdx] = useState<number>(0);
  const [investigando, setInvestigando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroFiltro, setErroFiltro] = useState<string | null>(null);

  const perguntasList = OBTER_SETE_PERGUNTAS_ESTRATEGICAS(setor, nomeNegocio);
  const perguntaAtual = perguntasList[perguntaAtualIdx];
  const respostaAtual = OBTER_RESPOSTA_PERGUNTA(respostasFiltro, perguntaAtual?.id ?? 1);

  const categoriaPrevia = useMemo(
    () => CALCULAR_CATEGORIA_MODELO_NEGOCIO(respostasFiltro, setor),
    [setor, respostasFiltro]
  );

  useEffect(() => {
    setErroFiltro(null);
  }, [respostasFiltro, perguntaAtualIdx]);

  const alternarOpcao = (perguntaId: number, valor: string) => {
    const unica = perguntasList.find(p => p.id === perguntaId)?.selecaoUnica;
    setRespostasFiltro(prev => {
      const atual = OBTER_RESPOSTA_PERGUNTA(prev, perguntaId);
      const jaSelecionada = atual.valores.includes(valor);
      let valores: string[];
      let textoOutros = atual.textoOutros;
      if (unica) {
        valores = jaSelecionada ? [] : [valor];
        if (valor !== VALOR_OPCAO_OUTROS) textoOutros = undefined;
        if (jaSelecionada && valor === VALOR_OPCAO_OUTROS) textoOutros = undefined;
      } else {
        valores = jaSelecionada
          ? atual.valores.filter(v => v !== valor)
          : [...atual.valores, valor];
        if (valor === VALOR_OPCAO_OUTROS && jaSelecionada) textoOutros = atual.textoOutros;
      }
      return {
        ...prev,
        [perguntaId]: {
          ...atual,
          valores,
          textoOutros
        }
      };
    });
  };

  const atualizarTextoOutros = (perguntaId: number, texto: string) => {
    const unica = perguntasList.find(p => p.id === perguntaId)?.selecaoUnica;
    setRespostasFiltro(prev => {
      const atual = OBTER_RESPOSTA_PERGUNTA(prev, perguntaId);
      const valores = unica
        ? [VALOR_OPCAO_OUTROS]
        : (atual.valores.includes(VALOR_OPCAO_OUTROS) ? atual.valores : [...atual.valores, VALOR_OPCAO_OUTROS]);
      return {
        ...prev,
        [perguntaId]: { ...atual, valores, textoOutros: texto }
      };
    });
  };

  const submitDiagnostico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!FILTRO_COMPLETO(respostasFiltro)) {
      setErroFiltro('Responda as 7 perguntas. Se marcar Outros, descreva a resposta em texto.');
      return;
    }

    setEnviando(true);
    try {
      const respostasClassificadas = await CLASSIFICAR_RESPOSTAS_OUTROS(respostasFiltro, setor);
      const diagnosticoFinal = CRIAR_DIAGNOSTICO_COMPLETO(
        nomeNegocio,
        setor,
        modeloOperacional,
        escopoGeografico,
        respostasClassificadas
      );
      aoConcluirDiagnostico(diagnosticoFinal);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-white">

      <div className="gb-panel p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Brain className="w-4 h-4" />
              <span>Módulo 1: Diagnóstico (7 Perguntas)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Investigação Estratégica & Sensoriamento
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Mapeie o negócio no <strong className="text-slate-200 font-mono">Filtro de 7 Perguntas</strong> (única ou múltipla escolha + Outros) e posicione o modelo nos eixos ciclo de venda × escala.
            </p>
          </div>

          
        </div>
      </div>

      <form onSubmit={submitDiagnostico} className="space-y-8">

        <div className="gb-panel p-6 shadow-xl">
          <h2 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 border border-blue-400 rounded-full flex items-center justify-center text-blue-400 text-[10px]">01</span>
            Input Inicial do Negócio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-800/80 rounded-xl border-l-4 border-blue-500 border-slate-700">
              <label className="block text-[10px] font-mono text-blue-400 font-bold uppercase mb-1">Nome do Negócio</label>
              <input
                type="text"
                required
                value={nomeNegocio}
                onChange={(e) => setNomeNegocio(e.target.value)}
                placeholder="Ex: Cafeteria Especial"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border-l-4 border-slate-500 border-slate-700">
              <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Setor do Negócio</label>
              <input
                type="text"
                required
                value={setor}
                onChange={(e) => { setSetor(e.target.value); setRespostasFiltro(RESPOSTAS_INICIAIS); setPerguntaAtualIdx(0); setInvestigando(false); }}
                placeholder="Ex: Cafeteria, Gastronomia"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border-l-4 border-slate-500 border-slate-700">
              <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Modelo Operacional</label>
              <select
                value={modeloOperacional}
                onChange={(e) => setModeloOperacional(e.target.value as ModeloOperacional)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Presencial">Presencial (Ponto Físico)</option>
                <option value="Online">Online / Digital</option>
                <option value="Híbrido">Híbrido (Loja + E-commerce)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border-l-4 border-slate-500 border-slate-700">
              <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">Escopo Geográfico</label>
              <select
                value={escopoGeografico}
                onChange={(e) => setEscopoGeografico(e.target.value as EscopoGeografico)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {OPCOES_ESCOPO_GEOGRAFICO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              </select>
            </div>
            {(() => {
              const campo = OBTER_CAMPO_LOCALIDADE_ESCOPO(escopoGeografico);
              if (!campo.mostrar) return null;
              return (
              <div className="p-3 bg-slate-800/80 rounded-xl border-l-4 border-emerald-500 border-slate-700 sm:col-span-2 lg:col-span-4">
                <label className="block text-[10px] font-mono text-emerald-400 font-bold uppercase mb-1">{campo.label}</label>
                <input
                  type="text"
                  required={campo.obrigatorio}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder={campo.placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{campo.ajuda}</p>
              </div>
              );
            })()}
          </div>
        </div>

        {!investigando && <button type="button" className="gb-btn w-full" disabled={!nomeNegocio.trim() || !setor.trim() || (OBTER_CAMPO_LOCALIDADE_ESCOPO(escopoGeografico).obrigatorio && !cidade.trim())} onClick={() => setInvestigando(true)}>Continuar para as 7 perguntas →</button>}
        {investigando && <>
        <div className="gb-panel p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 border border-blue-400 rounded-full flex items-center justify-center text-blue-400 text-[10px]">02</span>
              Protocolo de Investigação (Filtro de 7 Perguntas)
            </h2>
            <span className="text-xs font-mono text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Pergunta {perguntaAtualIdx + 1} de 7
            </span>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {perguntasList.map((p, idx) => {
              const respondida = PERGUNTA_ESTA_RESPONDIDA(respostasFiltro[p.id]);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPerguntaAtualIdx(idx)}
                  className={`flex-1 min-w-[36px] py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                    perguntaAtualIdx === idx
                      ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                      : respondida
                      ? 'bg-slate-800 text-blue-400 border-slate-700'
                      : 'bg-slate-800/40 text-slate-500 border-slate-800'
                  }`}
                >
                  Q{p.id}
                </button>
              );
            })}
          </div>

          {perguntaAtual && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold text-blue-400 uppercase tracking-widest block mb-1">
                  Q{perguntaAtual.id}: Eixo {perguntaAtual.eixo === 'X' ? 'X — Ciclo de Venda' : 'Y — Escala'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {perguntaAtual.pergunta}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {perguntaAtual.subtexto}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {perguntaAtual.opcoes.map((op) => {
                  const selecionada = respostaAtual.valores.includes(op.valor);
                  return (
                    <div key={op.valor}>
                      <button
                        type="button"
                        onClick={() => alternarOpcao(perguntaAtual.id, op.valor)}
                        className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between border-l-4 ${
                          selecionada
                            ? 'bg-blue-500/10 border-blue-500 text-white shadow-sm'
                            : 'bg-slate-800/90 border-slate-700 border-l-slate-600 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 flex-shrink-0 ${
                            perguntaAtual.selecaoUnica ? 'rounded-full' : 'rounded'
                          } border ${
                            selecionada ? 'bg-blue-500 border-blue-400' : 'border-slate-500'
                          }`} />
                          {op.rotulo}
                        </span>
                        {selecionada && <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />}
                      </button>
                      {op.eOutros && selecionada && (
                        <textarea
                          value={respostaAtual.textoOutros || ''}
                          onChange={(e) => atualizarTextoOutros(perguntaAtual.id, e.target.value)}
                          placeholder="Descreva a resposta. A IA vai enquadrar este texto nos eixos do modelo de negócio."
                          rows={3}
                          className="mt-2 w-full bg-slate-900 border border-blue-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <button
                  type="button"
                  disabled={perguntaAtualIdx === 0}
                  onClick={() => setPerguntaAtualIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {perguntaAtualIdx < perguntasList.length - 1 ? (
                  <button
                    type="button"
                    disabled={!PERGUNTA_ESTA_RESPONDIDA(respostaAtual)}
                    onClick={() => setPerguntaAtualIdx(prev => prev + 1)}
                    className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5"
                  >
                    <span>Próxima Pergunta</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-green-400 font-mono font-bold uppercase tracking-wider">
                    {FILTRO_COMPLETO(respostasFiltro) ? 'Filtro de 7 Perguntas Concluído!' : 'Revise as respostas antes de gerar'}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        
        <div data-gb-resumo-pos-filtro className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold block mb-1">
              Resumo da matriz (após as 7 perguntas):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded ${
                categoriaPrevia.quadrante === 1 || categoriaPrevia.quadrante === 4
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 uppercase tracking-wider'
                  : 'bg-blue-500 text-white shadow-md shadow-blue-500/20 uppercase tracking-wider'
              }`}>
                {FILTRO_COMPLETO(respostasFiltro) ? rotuloQuadrante(categoriaPrevia) : 'Responda às 7 perguntas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Ciclo PX {categoriaPrevia.pontuacaoX.toFixed(1)} · Escala PY {categoriaPrevia.pontuacaoY.toFixed(1)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {FILTRO_COMPLETO(respostasFiltro) ? categoriaPrevia.justificativa : 'A classificação será concluída após suas respostas.'}
            </p>
        </div>

{erroFiltro && (
          <p className="text-center text-xs text-amber-400 font-mono">{erroFiltro}</p>
        )}

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={enviando || !FILTRO_COMPLETO(respostasFiltro)}
            className="w-full sm:w-auto min-w-[320px] bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-extrabold py-4 px-8 rounded-xl text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-3 scale-100 hover:scale-[1.02]"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span>{enviando ? 'Classificando respostas Outros…' : 'Gerar Mocks e Consultoria com IA'}</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>

        </>}
      </form>
    </div>
  );
};
