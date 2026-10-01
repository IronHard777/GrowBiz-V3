import { useState, useEffect } from 'react';
import { MockCampanhaConteudo, ResultadoCompletoConsultoria, PropostaCampanha, CanalPublicacao } from '../../tipos';
import { useImagemCampanhaIA } from '../../hooks/useImagemCampanhaIA';
import { CategoriaEstilo } from '../../servicos/servicoCategoriasEstilo';
import { GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI, GERAR_IMAGEM_IMAGEN3 } from '../../servicos/servicoGemini';
import { CRIAR_EVENTO_CALENDARIO, ATUALIZAR_EVENTO_CALENDARIO, OBTER_EVENTOS_CALENDARIO } from '../../servicos/servicoPersistencia';
import { appendPresetToPrompt, type PresetSelection } from '../../components/media/MediaPresets';
import { MONTAR_PROMPT_VISUAL } from '../../servicos/servicoContextoVisual';
import {
  IdTierPlano,
  IdAbaResultados,
  OBTER_TIER,
  LISTAR_ABAS_RESULTADOS,
  ABA_INICIAL_RESULTADOS,
  COPY_CABECALHO_RESULTADOS
} from '../../tipos/tierPlano';
import {
  type PassoFluxoId,
  type EstadoFluxoPublicacao
} from '../../components/fluxo/PassosFluxoPublicacao';
import { OBTER_SESSAO_INSTAGRAM, CANAL_INSTAGRAM } from '../../servicos/servicoInstagram';

/** HTTPS real (nao estoque) — alinhado ao criterio do Kanban/Instagram. */
export function URL_HTTPS_MIDIA_UTIL(url?: string | null): boolean {
  const u = (url || '').trim();
  if (!u || !/^https:\/\//i.test(u)) return false;
  if (/unsplash|picsum|placehold/i.test(u)) return false;
  return true;
}

export type PropriedadesLogicaResultados = {
  resultado: ResultadoCompletoConsultoria;
  tier: IdTierPlano;
};

/**
 * Estado e handlers compartilhados entre ModuloResultadosEnxuto e Completo.
 * Mantém a lógica de mídia, Kanban e fluxo feliz em um único lugar.
 */
export function useLogicaResultados({ resultado, tier }: PropriedadesLogicaResultados) {
  const infoTier = OBTER_TIER(tier);
  const copyCabecalho = COPY_CABECALHO_RESULTADOS(tier);
  const metasAbas = LISTAR_ABAS_RESULTADOS(tier);

  const [abaAtiva, setAbaAtiva] = useState<IdAbaResultados>(() => ABA_INICIAL_RESULTADOS(tier));
  const [notificacaoPivotagem, setNotificacaoPivotagem] = useState<boolean>(false);
  const [campanhaAtual, setCampanhaAtual] = useState<MockCampanhaConteudo>(resultado.campanhaMock);
  const [estiloVideoSelecionado, setEstiloVideoSelecionado] = useState<CategoriaEstilo | null>(null);
  const [regenerandoRoteiro, setRegenerandoRoteiro] = useState<boolean>(false);
  const [erroRegeneracaoRoteiro, setErroRegeneracaoRoteiro] = useState<string | null>(null);
  const [imagemVideoEstilizada, setImagemVideoEstilizada] = useState<string | null>(null);
  const [mediaPreset, setMediaPreset] = useState<PresetSelection>({
    type: 'image',
    ratio: '9:16',
    style: 'realistic'
  });
  const [propostasAdicionadasIds, setPropostasAdicionadasIds] = useState<string[]>([]);
  const [sinalDeAtualizacaoKanban, setSinalDeAtualizacaoKanban] = useState<number>(0);

  const { diagnostico, estrategias, kpisSimulados, alertaPivotagem } = resultado;

  // Se o tier mudar (Trocar plano), realinha aba inicial e abas válidas.
  useEffect(() => {
    const permitidas = LISTAR_ABAS_RESULTADOS(tier).map((a) => a.id);
    if (!permitidas.includes(abaAtiva)) {
      setAbaAtiva(ABA_INICIAL_RESULTADOS(tier));
    }
  }, [tier, abaAtiva]);

  // Enxuto só-imagens: força preset de imagem (UI de vídeo fica oculta).
  useEffect(() => {
    if (!infoTier.incluiVideo && mediaPreset.type === 'video') {
      setMediaPreset((prev) => ({ ...prev, type: 'image' }));
    }
  }, [infoTier.incluiVideo, mediaPreset.type]);

  const imagemCampanha = useImagemCampanhaIA(campanhaAtual, diagnostico, mediaPreset);

  // Sincroniza URL HTTPS nos cards mesmo sem a aba Kanban montada
  useEffect(() => {
    const url = (imagemCampanha.imagemUrl || '').trim();
    if (!url || !/^https:\/\//i.test(url)) return;
    if (/unsplash|picsum|placehold/i.test(url)) return;
    const lista = OBTER_EVENTOS_CALENDARIO().filter((e) => e.diagnosticoId === diagnostico.id);
    let mudou = false;
    for (const evt of lista) {
      if (evt.canal === 'Instagram Reels') continue;
      const atual = (evt.imagemUrl || '').trim();
      if (atual === url) continue;
      const precisaTrocar =
        !atual ||
        /^data:/i.test(atual) ||
        /unsplash|picsum|placehold/i.test(atual);
      if (!precisaTrocar) continue;
      ATUALIZAR_EVENTO_CALENDARIO({ ...evt, imagemUrl: url });
      mudou = true;
    }
    if (mudou) setSinalDeAtualizacaoKanban((n) => n + 1);
  }, [imagemCampanha.imagemUrl, diagnostico.id]);

  const aplicarPivotagem = () => {
    setNotificacaoPivotagem(true);
    setTimeout(() => setNotificacaoPivotagem(false), 4000);
  };

  const aoSelecionarEstiloVideo = async (categoria: CategoriaEstilo) => {
    setImagemVideoEstilizada(null);
    setEstiloVideoSelecionado(categoria);
    setRegenerandoRoteiro(true);
    setErroRegeneracaoRoteiro(null);
    try {
      const promptImagemEstilizada = appendPresetToPrompt(
        MONTAR_PROMPT_VISUAL(diagnostico, campanhaAtual, categoria.modificadorImagemIngles),
        { ...mediaPreset, type: 'video' }
      );

      const [novoRoteiro, novaImagem] = await Promise.all([
        GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI(diagnostico, campanhaAtual, categoria.nome, categoria.modificadorPrompt),
        GERAR_IMAGEM_IMAGEN3(promptImagemEstilizada, mediaPreset.ratio)
      ]);

      if (novoRoteiro) {
        setCampanhaAtual((prev) => {
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

  const aoAbrirProposta = (proposta: PropostaCampanha) => {
    setCampanhaAtual((prev) => ({
      ...prev,
      tituloCampanha: proposta.titulo,
      objetivoPrincipal: proposta.descricao,
      copyPersuasiva: proposta.copy || proposta.descricao,
      hashtagsEstrategicas: proposta.hashtags?.length ? proposta.hashtags : prev.hashtagsEstrategicas,
      canalIdeal: proposta.plataforma,
      chamadaParaAcao: proposta.chamadaParaAcao || prev.chamadaParaAcao
    }));
    setAbaAtiva('modulo3');
  };

  const aoAdicionarPropostaAoKanban = (proposta: PropostaCampanha) => {
    const midia = (imagemCampanha.imagemUrl || '').trim();
    const midiaOk = Boolean(
      midia &&
      /^https:\/\//i.test(midia) &&
      !/unsplash|picsum|placehold/i.test(midia)
    );
    CRIAR_EVENTO_CALENDARIO({
      id: `evt_${proposta.id}`,
      diagnosticoId: diagnostico.id,
      titulo: proposta.titulo,
      dataHorario: new Date(Date.now() + 86400000).toISOString(),
      canal: proposta.plataforma as CanalPublicacao,
      status: 'rascunho',
      copy: proposta.copy || proposta.descricao,
      hashtags: proposta.hashtags?.length ? proposta.hashtags : campanhaAtual.hashtagsEstrategicas,
      imagemUrl: midiaOk ? midia : undefined,
      criadoEm: new Date().toISOString()
    });
    setPropostasAdicionadasIds((prev) => [...prev, proposta.id]);
    setSinalDeAtualizacaoKanban((sinal) => sinal + 1);
  };

  void sinalDeAtualizacaoKanban;
  const eventosKanban = OBTER_EVENTOS_CALENDARIO().filter((e) => e.diagnosticoId === diagnostico.id);
  const temMidiaUtil =
    URL_HTTPS_MIDIA_UTIL(imagemCampanha.imagemUrl) ||
    URL_HTTPS_MIDIA_UTIL(imagemVideoEstilizada);
  const propostaPronta =
    temMidiaUtil &&
    Boolean((campanhaAtual.copyPersuasiva || '').trim()) &&
    Boolean((campanhaAtual.tituloCampanha || '').trim());
  const sessaoIg = OBTER_SESSAO_INSTAGRAM();
  const temCardProntoPublicar = eventosKanban.some(
    (e) =>
      CANAL_INSTAGRAM(e.canal) &&
      e.status !== 'publicado' &&
      (URL_HTTPS_MIDIA_UTIL(e.imagemUrl) || temMidiaUtil)
  );
  const publicacaoConcluida = eventosKanban.some((e) => e.status === 'publicado');

  const estadoFluxo: EstadoFluxoPublicacao = {
    temMidiaUtil,
    propostaPronta,
    estaNoKanban: abaAtiva === 'kanban',
    temCardsKanban: eventosKanban.length > 0,
    instagramConectado: Boolean(sessaoIg),
    temCardProntoPublicar,
    publicacaoConcluida
  };

  const aoIrParaPassoFluxo = (passo: PassoFluxoId) => {
    if (passo === 1) {
      setAbaAtiva('modulo3');
      return;
    }
    if (passo === 2) {
      setAbaAtiva('propostas');
      return;
    }
    setAbaAtiva('kanban');
  };

  const irProximaEtapa = () => {
    const ids = metasAbas.map((t) => t.id);
    const idx = ids.findIndex((id) => id === abaAtiva);
    if (idx >= 0 && idx < ids.length - 1) setAbaAtiva(ids[idx + 1]);
  };

  const temProximaEtapa = () => {
    const ids = metasAbas.map((t) => t.id);
    const idx = ids.findIndex((id) => id === abaAtiva);
    return idx >= 0 && idx < ids.length - 1;
  };

  return {
    infoTier,
    copyCabecalho,
    metasAbas,
    diagnostico,
    estrategias,
    kpisSimulados,
    alertaPivotagem,
    abaAtiva,
    setAbaAtiva,
    notificacaoPivotagem,
    campanhaAtual,
    setCampanhaAtual,
    estiloVideoSelecionado,
    regenerandoRoteiro,
    erroRegeneracaoRoteiro,
    imagemVideoEstilizada,
    mediaPreset,
    setMediaPreset,
    propostasAdicionadasIds,
    sinalDeAtualizacaoKanban,
    setSinalDeAtualizacaoKanban,
    imagemCampanha,
    aplicarPivotagem,
    aoSelecionarEstiloVideo,
    aoAbrirProposta,
    aoAdicionarPropostaAoKanban,
    estadoFluxo,
    aoIrParaPassoFluxo,
    irProximaEtapa,
    temProximaEtapa
  };
}

