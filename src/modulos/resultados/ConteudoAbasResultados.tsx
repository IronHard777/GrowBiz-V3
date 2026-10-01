import React from 'react';
import { CardCampanhaMock } from '../../componentes/CardCampanhaMock';
import { VisualizadorRoteiroVideo } from '../../componentes/VisualizadorRoteiroVideo';
import { RelatorioEstrategicoTriplo } from '../../componentes/RelatorioEstrategicoTriplo';
import { PainelPerformance } from '../../componentes/PainelPerformance';
import { MochilaMultiformato } from '../../componentes/MochilaMultiformato';
import { CalendarioConteudo } from '../../componentes/CalendarioConteudo';
import { ModuloPropostasCampanha } from '../../componentes/ModuloPropostasCampanha';
import { MediaPresets } from '../../components/media/MediaPresets';
import { IdAbaResultados } from '../../tipos/tierPlano';
import type { useLogicaResultados } from './useLogicaResultados';

type Logica = ReturnType<typeof useLogicaResultados>;

type Props = {
  abaAtiva: IdAbaResultados;
  logica: Logica;
};

/**
 * Conteúdo das abas compartilhado entre Enxuto e Completo.
 * Presets / vídeo só renderizam conforme capacidades do tier.
 */
export const ConteudoAbasResultados: React.FC<Props> = ({ abaAtiva, logica }) => {
  const {
    infoTier,
    diagnostico,
    estrategias,
    kpisSimulados,
    alertaPivotagem,
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
    adicionandoBloqueado,
    mensagemBloqueioKanban,
    feedbackKanban,
    preferirFeedParaImagem
  } = logica;

  if (abaAtiva === 'modulo3') {
    return (
      <div className="space-y-8">
        <MochilaMultiformato
          diagnostico={diagnostico}
          objetivoPrincipal={campanhaAtual.objetivoPrincipal}
          aoPersonalizarCampanha={(atualizacoes) => setCampanhaAtual((prev) => ({ ...prev, ...atualizacoes }))}
        />

        {imagemCampanha.erro && (
          <p role="status" className="text-sm text-amber-300">{imagemCampanha.erro}</p>
        )}

        {infoTier.incluiImagem && (
          <div className="space-y-6">
            {infoTier.mostraPresetsMidia && (
              <MediaPresets value={mediaPreset} onChange={setMediaPreset} permitirVideo={infoTier.incluiVideo} />
            )}
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
          </div>
        )}

        {infoTier.incluiVideo && (
          <VisualizadorRoteiroVideo
            key={`${diagnostico.id}-${estiloVideoSelecionado?.id || 'natural'}`}
            roteiro={campanhaAtual.roteiroVideo}
            tituloCampanha={campanhaAtual.tituloCampanha}
            imagemVisualPrincipal={imagemVideoEstilizada || imagemCampanha.imagemUrl}
            estiloSelecionado={estiloVideoSelecionado}
            aoSelecionarEstilo={aoSelecionarEstiloVideo}
            regenerandoRoteiro={regenerandoRoteiro}
            erroRegeneracao={erroRegeneracaoRoteiro}
            mediaPreset={mediaPreset}
            aoAtualizarCena={(idx, patch) => {
              setCampanhaAtual((prev) => ({
                ...prev,
                roteiroVideo: prev.roteiroVideo.map((cena, i) => (i === idx ? { ...cena, ...patch } : cena))
              }));
            }}
          />
        )}
      </div>
    );
  }

  if (abaAtiva === 'propostas') {
    return (
      <ModuloPropostasCampanha
        diagnostico={diagnostico}
        campanha={campanhaAtual}
        aoAdicionarAoKanban={aoAdicionarPropostaAoKanban}
        aoAbrirProposta={aoAbrirProposta}
        idsJaAdicionados={propostasAdicionadasIds}
        adicionarDesabilitado={adicionandoBloqueado}
        mensagemBloqueioAdicionar={mensagemBloqueioKanban}
        feedbackAdicionar={feedbackKanban}
        preferirFeedParaImagem={preferirFeedParaImagem}
      />
    );
  }

  if (abaAtiva === 'kanban') {
    return (
      <CalendarioConteudo
        diagnosticoId={diagnostico.id}
        sinalDeAtualizacao={sinalDeAtualizacaoKanban}
        midiaMockUrl={imagemCampanha.imagemUrl}
        aoMudancaEventos={() => setSinalDeAtualizacaoKanban((n) => n + 1)}
      />
    );
  }

  if (abaAtiva === 'modulo2') {
    return <RelatorioEstrategicoTriplo estrategias={estrategias} />;
  }

  if (abaAtiva === 'modulo4') {
    return (
      <PainelPerformance
        kpis={kpisSimulados}
        alerta={alertaPivotagem}
        aoSolicitarPivotagem={aplicarPivotagem}
      />
    );
  }

  return null;
};
