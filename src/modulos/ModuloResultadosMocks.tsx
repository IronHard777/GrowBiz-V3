import { MONTAR_PROMPT_VISUAL } from '../servicos/servicoContextoVisual';
import React, { useState } from 'react';
import { MockCampanhaConteudo, ResultadoCompletoConsultoria, PropostaCampanha, CanalPublicacao } from '../tipos';
import { CardCampanhaMock } from '../componentes/CardCampanhaMock';
import { VisualizadorRoteiroVideo } from '../componentes/VisualizadorRoteiroVideo';
import { RelatorioEstrategicoTriplo } from '../componentes/RelatorioEstrategicoTriplo';
import { PainelPerformance } from '../componentes/PainelPerformance';
import { MochilaMultiformato } from '../componentes/MochilaMultiformato';
import { CalendarioConteudo } from '../componentes/CalendarioConteudo';
import { ModuloPropostasCampanha } from '../componentes/ModuloPropostasCampanha';
import { useImagemCampanhaIA } from '../hooks/useImagemCampanhaIA';
import { CategoriaEstilo } from '../servicos/servicoCategoriasEstilo';
import { GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI, GERAR_IMAGEM_IMAGEN3 } from '../servicos/servicoGemini';
import { CRIAR_EVENTO_CALENDARIO } from '../servicos/servicoPersistencia';
import { Sparkles, Compass, Clapperboard, BarChart3, RefreshCw, CheckCircle2, LayoutGrid } from 'lucide-react';

type AbaResultados = 'modulo3' | 'propostas' | 'kanban' | 'modulo2' | 'modulo4';

interface PropriedadesResultados {
  resultado: ResultadoCompletoConsultoria;
  aoRefazerDiagnostico: () => void;
}

export const ModuloResultadosMocks: React.FC<PropriedadesResultados> = ({ resultado, aoRefazerDiagnostico }) => {
  const [abaAtiva, setAbaAtiva] = useState<AbaResultados>('modulo3');
  const [notificacaoPivotagem, setNotificacaoPivotagem] = useState<boolean>(false);
  const [campanhaAtual, setCampanhaAtual] = useState<MockCampanhaConteudo>(resultado.campanhaMock);
  const [estiloVideoSelecionado, setEstiloVideoSelecionado] = useState<CategoriaEstilo | null>(null);
  const [regenerandoRoteiro, setRegenerandoRoteiro] = useState<boolean>(false);
  const [erroRegeneracaoRoteiro, setErroRegeneracaoRoteiro] = useState<string | null>(null);
  // Imagem do player de vídeo, independente da imagem do mockup estático — só existe depois que
  // o cliente escolhe uma categoria de vídeo (antes disso, o player usa a imagem compartilhada).
  const [imagemVideoEstilizada, setImagemVideoEstilizada] = useState<string | null>(null);
  // Propostas de campanha já enviadas ao Kanban, e sinal para o Kanban recarregar do localStorage.
  const [propostasAdicionadasIds, setPropostasAdicionadasIds] = useState<string[]>([]);
  const [sinalDeAtualizacaoKanban, setSinalDeAtualizacaoKanban] = useState<number>(0);

  const { diagnostico, estrategias, kpisSimulados, alertaPivotagem } = resultado;

  // Única fonte da imagem visual da campanha — compartilhada entre o mockup estático e o
  // player de vídeo, para que ambos mostrem exatamente a mesma imagem gerada/personalizada.
  const imagemCampanha = useImagemCampanhaIA(campanhaAtual, diagnostico);

  const aplicarPivotagem = () => {
    setNotificacaoPivotagem(true);
    setTimeout(() => setNotificacaoPivotagem(false), 4000);
  };

  const aoSelecionarEstiloVideo = async (categoria: CategoriaEstilo) => {
    // Toque na categoria já ativa desmarca e volta ao roteiro original não é suportado aqui
    // (o roteiro base já foi sobrescrito) — reselecionar apenas troca de estilo.
    setImagemVideoEstilizada(null);
    setEstiloVideoSelecionado(categoria);
    setRegenerandoRoteiro(true);
    setErroRegeneracaoRoteiro(null);
    try {
      // Regenera roteiro (texto) e imagem do player (visual) em paralelo — antes só o texto
      // mudava e a prévia do player continuava sempre com a mesma foto, dando a impressão de
      // que a escolha de categoria não fazia nada.
      const promptImagemEstilizada = MONTAR_PROMPT_VISUAL(diagnostico, campanhaAtual, categoria.modificadorImagemIngles);

      const [novoRoteiro, novaImagem] = await Promise.all([
        GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI(diagnostico, campanhaAtual, categoria.nome, categoria.modificadorPrompt),
        GERAR_IMAGEM_IMAGEN3(promptImagemEstilizada)
      ]);

      if (novoRoteiro) {
        setCampanhaAtual(prev => {
          const generoCampanha = prev.roteiroVideo[0]?.generoVoz || novoRoteiro[0]?.generoVoz || 'feminina';
          return {
            ...prev,
            roteiroVideo: novoRoteiro.map((cena, i) => ({
              ...cena,
              generoVoz: generoCampanha,
              promptUsuario: prev.roteiroVideo[i]?.promptUsuario || ''
            }))
          };
        });
      } else {
        setErroRegeneracaoRoteiro('Não foi possível regenerar o roteiro com esse estilo. Tente novamente.');
      }

      if (novaImagem) {
        setImagemVideoEstilizada(novaImagem);
      }
    } catch (erro) {
      console.warn('Erro ao regenerar roteiro/imagem com estilo:', erro);
      setErroRegeneracaoRoteiro('Falha ao regenerar o roteiro com esse estilo.');
    } finally {
      setRegenerandoRoteiro(false);
    }
  };

  const aoAdicionarPropostaAoKanban = (proposta: PropostaCampanha) => {
    CRIAR_EVENTO_CALENDARIO({
      id: `evt_${proposta.id}`,
      diagnosticoId: diagnostico.id,
      titulo: proposta.titulo,
      dataHorario: new Date(Date.now() + 86400000).toISOString(),
      canal: proposta.plataforma as CanalPublicacao,
      status: 'rascunho',
      copy: proposta.descricao,
      hashtags: campanhaAtual.hashtagsEstrategicas,
      criadoEm: new Date().toISOString()
    });
    setPropostasAdicionadasIds(prev => [...prev, proposta.id]);
    setSinalDeAtualizacaoKanban(sinal => sinal + 1);
  };

  const TABS: { id: AbaResultados; label: string; icone: React.ReactNode }[] = [
    { id: 'modulo3', label: 'Mocks de Conteúdo', icone: <Clapperboard className="w-3.5 h-3.5" /> },
    { id: 'propostas', label: 'Propostas de Campanha', icone: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'kanban', label: 'Kanban', icone: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'modulo2', label: 'Estratégia Tripla', icone: <Compass className="w-3.5 h-3.5" /> },
    { id: 'modulo4', label: 'Performance & Pivotagem', icone: <BarChart3 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 text-white space-y-8">

      {/* CABEÇALHO COM RESUMO DO DIAGNÓSTICO E DA MATRIZ */}
      <div className="gb-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                SEU PLANO DE CAMPANHA
              </span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                diagnostico.categoriaModelo?.quadrante === 1 || diagnostico.categoriaModelo?.quadrante === 4
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-blue-500 text-white border-blue-400'
              }`}>
                {diagnostico.categoriaModelo
                  ? `Q${diagnostico.categoriaModelo.quadrante} · ${diagnostico.categoriaModelo.categoria}`
                  : `Matriz: Decisão ${diagnostico.tipoDecisaoCalculado === 'RAPIDA' ? 'Rápida' : 'Elaborada'}`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Plano de Ataque & Mocks para <span className="text-blue-400">{diagnostico.nomeNegocio}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {diagnostico.justificativaMatriz}
            </p>
          </div>

          <div className="flex items-center space-x-3">
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
          <p>{diagnostico.sensoriamento.statusPesquisa === 'consultado' ? 'Referências de mercado consultadas — resultados de terceiros não garantem o desempenho desta campanha.' : 'Pesquisa indisponível. Este plano contém hipóteses para validar, sem casos comprovados.'}</p>
          {diagnostico.sensoriamento.fontes?.map((fonte, i) => <a key={i} href={fonte.url} target="_blank" rel="noopener noreferrer" className="inline-block mr-4 text-blue-300 underline">{fonte.titulo}</a>)}
          {diagnostico.sensoriamento.sugestoesBuscaHtml && <iframe title="Sugestões de pesquisa do Google" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={diagnostico.sensoriamento.sugestoesBuscaHtml} className="w-full border-0 h-20" />}
        </div>
        {diagnostico.sensoriamento.casosDeSucessoAncorados.length > 0 && (
          <details className="mt-4 border-t border-white/10 pt-4">
            <summary className="cursor-pointer text-sm text-blue-300 font-semibold">Ver pesquisa, resultados reportados e limites de aplicação</summary>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 max-w-4xl">
              {diagnostico.sensoriamento.casosDeSucessoAncorados.flatMap(caso => caso.split(/\n\s*\n/)).map((paragrafo, idx) => (
                <p key={idx}>{paragrafo.replace(/\*+/g, '')}</p>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* NOTIFICAÇÃO SE A PIVOTAGEM FOR APLICADA */}
      {notificacaoPivotagem && (
        <div className="bg-blue-500 text-white p-4 rounded-xl font-mono text-xs font-bold flex items-center space-x-3 shadow-xl animate-bounce border border-blue-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
          <span>Pivotagem de Campanha aplicada com sucesso! O orçamento foi otimizado para focar no Roteiro de Vídeo em alta no TikTok / Instagram.</span>
        </div>
      )}

      {/* NAVEGAÇÃO ENTRE OS MÓDULOS DE RESULTADO (TABS EM PÍLULA) */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            className={`gb-tab flex items-center gap-2 ${abaAtiva === tab.id ? 'gb-tab-active' : ''}`}
          >
            {tab.icone}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* EXIBIÇÃO DO CONTEÚDO CONFORME A ABA ATIVA */}

      {/* MÓDULO 3: MOCKS DE CRIAÇÃO E EXECUÇÃO */}
      {abaAtiva === 'modulo3' && (
        <div className="space-y-8">

          {/* UPLOAD MULTIFORMATO PARA PERSONALIZAÇÃO DA IA */}
          <MochilaMultiformato
            diagnostico={diagnostico}
            objetivoPrincipal={campanhaAtual.objetivoPrincipal}
            aoPersonalizarCampanha={(atualizacoes) => setCampanhaAtual(prev => ({ ...prev, ...atualizacoes }))}
          />

          {/* MOCKUP VISUAL DE IMAGEM + COPY */}
          {imagemCampanha.erro && <p role="status" className="text-sm text-amber-300">{imagemCampanha.erro}</p>}
          <CardCampanhaMock
            promptAplicado={imagemCampanha.promptAplicado}
            campanha={campanhaAtual}
            imagemUrl={imagemCampanha.imagemUrl}
            carregandoImagem={imagemCampanha.carregando}
            modoImagem={imagemCampanha.modo}
            aoAlterarModoImagem={imagemCampanha.setModo}
            aoRegenerarImagem={imagemCampanha.regenerar}
            aoCarregarImagem={imagemCampanha.aoCarregarImagem}
            aoErroImagem={imagemCampanha.aoErroImagem}
            estiloSelecionado={imagemCampanha.estiloSelecionado}
            aoSelecionarEstilo={imagemCampanha.selecionarEstilo}
          />

          {/* ROTEIRO DE VÍDEO DETALHADO POR SEGUNDOS */}
          <VisualizadorRoteiroVideo
            key={`${diagnostico.id}-${estiloVideoSelecionado?.id || 'natural'}`}
            roteiro={campanhaAtual.roteiroVideo}
            tituloCampanha={campanhaAtual.tituloCampanha}
            imagemVisualPrincipal={imagemVideoEstilizada || imagemCampanha.imagemUrl}
            estiloSelecionado={estiloVideoSelecionado}
            aoSelecionarEstilo={aoSelecionarEstiloVideo}
            regenerandoRoteiro={regenerandoRoteiro}
            erroRegeneracao={erroRegeneracaoRoteiro}
            aoAtualizarCena={(idx, patch) => {
              setCampanhaAtual(prev => ({
                ...prev,
                roteiroVideo: prev.roteiroVideo.map((cena, i) => (i === idx ? { ...cena, ...patch } : cena))
              }));
            }}
          />
        </div>
      )}

      {/* PROPOSTAS DE CAMPANHA */}
      {abaAtiva === 'propostas' && (
        <ModuloPropostasCampanha
          diagnostico={diagnostico}
          campanha={campanhaAtual}
          aoAdicionarAoKanban={aoAdicionarPropostaAoKanban}
          idsJaAdicionados={propostasAdicionadasIds}
        />
      )}

      {/* KANBAN DE ACOMPANHAMENTO */}
      {abaAtiva === 'kanban' && (
        <CalendarioConteudo diagnosticoId={diagnostico.id} sinalDeAtualizacao={sinalDeAtualizacaoKanban} />
      )}

      {/* MÓDULO 2: ESTRATÉGIA DE CRESCIMENTO */}
      {abaAtiva === 'modulo2' && (
        <RelatorioEstrategicoTriplo estrategias={estrategias} />
      )}

      {/* MÓDULO 4: ANÁLISE DE PERFORMANCE */}
      {abaAtiva === 'modulo4' && (
        <PainelPerformance kpis={kpisSimulados} alerta={alertaPivotagem} aoSolicitarPivotagem={aplicarPivotagem} />
      )}

    </div>
  );
};
