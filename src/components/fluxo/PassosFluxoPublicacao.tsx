import React from 'react';
import { Check, ImageIcon, FileText, LayoutGrid, Instagram } from 'lucide-react';

/** Indices 1-4 do happy path Gerar -> Proposta -> Kanban -> Publicar. */
export type PassoFluxoId = 1 | 2 | 3 | 4;

export type EstadoFluxoPublicacao = {
  /** Midia HTTPS util (nao estoque / placeholder). */
  temMidiaUtil: boolean;
  /** Copy/proposta preenchida o suficiente para seguir. */
  propostaPronta: boolean;
  /** Usuario esta na aba Kanban/calendario. */
  estaNoKanban: boolean;
  /** Ha cards no Kanban para este diagnostico. */
  temCardsKanban: boolean;
  /** Sessao Instagram conectada. */
  instagramConectado: boolean;
  /** Card com midia HTTPS pronto para publicar no Instagram. */
  temCardProntoPublicar: boolean;
  /** Ja existe card com status publicado. */
  publicacaoConcluida: boolean;
};

type PassoMeta = {
  id: PassoFluxoId;
  rotulo: string;
  ajuda: string;
  Icone: React.ComponentType<{ className?: string }>;
};

function MONTAR_PASSOS(incluiVideo: boolean): PassoMeta[] {
  return [
    {
      id: 1,
      rotulo: incluiVideo ? 'Gerar imagem/vídeo' : 'Gerar imagem',
      ajuda: incluiVideo
        ? 'Gere uma imagem ou vídeo nos Mocks para continuar o fluxo.'
        : 'Gere uma imagem nos Mocks para continuar o fluxo.',
      Icone: ImageIcon
    },
    {
      id: 2,
      rotulo: 'Proposta',
      ajuda: 'Revise título e copy da proposta; quando estiver pronta, envie ao Kanban.',
      Icone: FileText
    },
    {
      id: 3,
      rotulo: 'Kanban',
      ajuda: 'Organize os cards no Kanban e confira se a mídia HTTPS está no card.',
      Icone: LayoutGrid
    },
    {
      id: 4,
      rotulo: 'Publicar no Instagram',
      ajuda: 'Conecte o Instagram e publique pelo botão do card no Kanban.',
      Icone: Instagram
    }
  ];
}

/**
 * Deriva o passo atual a partir do estado real.
 * Em caso de ambiguidade, prefere o primeiro passo incompleto.
 * A aba Kanban e o contexto de publicacao avancam a indicacao visual.
 */
export function DERIVAR_PASSO_ATUAL(estado: EstadoFluxoPublicacao): PassoFluxoId {
  const {
    temMidiaUtil,
    propostaPronta,
    estaNoKanban,
    temCardsKanban,
    instagramConectado,
    temCardProntoPublicar,
    publicacaoConcluida
  } = estado;

  // Prefer earliest incomplete; view context only advances when durable progress exists.
  if (publicacaoConcluida) return 4;

  if (!temMidiaUtil) return 1;

  if (!propostaPronta) {
    // Se ja ha cards / esta no Kanban, nao trava visualmente no passo 2
    if (estaNoKanban || temCardsKanban) {
      if (instagramConectado && temCardProntoPublicar) return 4;
      return 3;
    }
    return 2;
  }

  // Proposta pronta: permanece no passo 2 ate haver Kanban (ou o usuario ir ao Kanban)
  if (!temCardsKanban && !estaNoKanban) return 2;

  if (instagramConectado && temCardProntoPublicar) return 4;

  return 3;
}

export function PASSO_ESTA_COMPLETO(passo: PassoFluxoId, estado: EstadoFluxoPublicacao): boolean {
  switch (passo) {
    case 1:
      return estado.temMidiaUtil;
    case 2:
      return estado.propostaPronta;
    case 3:
      return estado.temCardsKanban;
    case 4:
      return estado.publicacaoConcluida;
    default:
      return false;
  }
}

interface PropriedadesPassosFluxo {
  estado: EstadoFluxoPublicacao;
  aoIrParaPasso: (passo: PassoFluxoId) => void;
  /** Enxuto: destaque visual no happy-path. Completo: layout padrão. */
  enfatizado?: boolean;
  /** Quando false (tier so imagens), o passo 1 diz Gerar imagem. Default true. */
  incluiVideo?: boolean;
}

export const PassosFluxoPublicacao: React.FC<PropriedadesPassosFluxo> = ({
  estado,
  aoIrParaPasso,
  enfatizado = false,
  incluiVideo = true
}) => {
  const PASSOS = MONTAR_PASSOS(incluiVideo);
  const passoAtual = DERIVAR_PASSO_ATUAL(estado);
  const ajudaAtual = PASSOS.find((p) => p.id === passoAtual)?.ajuda ?? '';

  return (
    <div
      className={[
        'sticky top-16 z-40 -mx-4 px-4 py-3 sm:mx-0 sm:px-0 backdrop-blur-md border-b sm:border sm:rounded-2xl',
        enfatizado
          ? 'bg-[#12100a]/95 border-amber-500/40 sm:border-amber-500/40 sm:bg-[rgba(245,158,11,0.06)]'
          : 'bg-[#0b0f1a]/90 border-white/10 sm:border-white/10 sm:bg-[rgba(255,255,255,0.03)]'
      ].join(' ')}
      role="navigation"
      aria-label="Fluxo de publicação"
    >
      <div className="overflow-x-auto pb-1">
        <ol className="flex items-center gap-1 sm:gap-2 min-w-max sm:min-w-0 sm:justify-between">
          {PASSOS.map((passo, idx) => {
            const completo = PASSO_ESTA_COMPLETO(passo.id, estado);
            const ativo = passoAtual === passo.id;
            const futuro = !completo && !ativo;

            return (
              <li key={passo.id} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => aoIrParaPasso(passo.id)}
                  aria-current={ativo ? 'step' : undefined}
                  aria-label={`${passo.rotulo}${completo ? ' (concluído)' : ativo ? ' (atual)' : ''}`}
                  className={[
                    'group flex items-center gap-2 rounded-full px-2.5 sm:px-3 py-2 text-left transition-colors border max-w-full',
                    ativo
                      ? 'bg-gradient-to-br from-[#2f7dfa] to-[#5ac8ff] border-transparent text-white shadow-md shadow-blue-500/20'
                      : completo
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
                        : 'bg-white/[0.04] border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono',
                      ativo
                        ? 'bg-white/20 text-white'
                        : completo
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/5 text-slate-500'
                    ].join(' ')}
                  >
                    {completo && !ativo ? (
                      <Check className="w-3.5 h-3.5" aria-hidden />
                    ) : (
                      <passo.Icone className="w-3.5 h-3.5" aria-hidden />
                    )}
                  </span>
                  <span
                    className={[
                      'text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate',
                      futuro ? 'text-slate-500' : ''
                    ].join(' ')}
                  >
                    {passo.rotulo}
                  </span>
                </button>
                {idx < PASSOS.length - 1 && (
                  <span
                    className={[
                      'hidden sm:block h-px w-4 lg:w-8 flex-shrink-0',
                      PASSO_ESTA_COMPLETO(passo.id, estado) ? 'bg-emerald-500/40' : 'bg-white/10'
                    ].join(' ')}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-2 text-[11px] sm:text-xs text-slate-400 font-mono leading-relaxed px-0.5">
        <span className={`${enfatizado ? 'text-amber-300' : 'text-blue-400'} font-bold uppercase tracking-wider mr-1.5`}>
          {enfatizado ? 'Fluxo feliz' : 'Passo'} {passoAtual}/{PASSOS.length}
        </span>
        {ajudaAtual}
      </p>
    </div>
  );
};
