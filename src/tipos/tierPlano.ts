/**
 * GrowBiz V3 — Tiers de plano (selecao pre-diagnostico).
 * Completo = produto full (diagnostico/estrategia no app).
 * Enxuto = formato leve com presets de midia; sem enfase em estrategia completa.
 */

export type IdTierPlano =
  | 'enxuto_imagens'
  | 'enxuto_imagens_videos'
  | 'completo_imagens'
  | 'completo_imagens_videos';

/** Profundidade do plano: enxuto (campanha leve) vs completo (consultoria). */
export type ProfundidadeTier = 'enxuto' | 'completo';

/** Abas possíveis na tela de resultados (após o diagnóstico / mocks). */
export type IdAbaResultados = 'modulo3' | 'propostas' | 'kanban' | 'modulo2' | 'modulo4';

export type MetaAbaResultados = {
  id: IdAbaResultados;
  label: string;
  /** Primária = destaque no fluxo; secundária = demotida / só no completo. */
  primaria: boolean;
};

export type CopyCabecalhoResultados = {
  badge: string;
  tituloPrefixo: string;
  /** Usado quando a justificativa da matriz estiver vazia. */
  subtituloFallback: string;
};

export type TierPlano = {
  id: IdTierPlano;
  nome: string;
  resumo: string;
  profundidade: ProfundidadeTier;
  incluiDiagnostico: boolean;
  incluiImagem: boolean;
  incluiVideo: boolean;
  mostraPresetsMidia: boolean;
};

export const TIERS_PLANO: TierPlano[] = [
  {
    id: 'enxuto_imagens',
    nome: 'Enxuto · só imagens',
    resumo:
      'Campanha leve com presets de mídia para gerar imagens. Sem ênfase no plano estratégico completo.',
    profundidade: 'enxuto',
    incluiDiagnostico: false,
    incluiImagem: true,
    incluiVideo: false,
    mostraPresetsMidia: true,
  },
  {
    id: 'enxuto_imagens_videos',
    nome: 'Enxuto · imagens + vídeos',
    resumo:
      'Campanha leve com presets para imagens e vídeos. Formato ágil, sem o pacote estratégico completo.',
    profundidade: 'enxuto',
    incluiDiagnostico: false,
    incluiImagem: true,
    incluiVideo: true,
    mostraPresetsMidia: true,
  },
  {
    id: 'completo_imagens',
    nome: 'Completo · só imagens',
    resumo:
      'Plano completo: diagnóstico das 7 perguntas, estratégia e mocks de imagem. Estilo visual nas categorias do mock.',
    profundidade: 'completo',
    incluiDiagnostico: true,
    incluiImagem: true,
    incluiVideo: false,
    mostraPresetsMidia: false,
  },
  {
    id: 'completo_imagens_videos',
    nome: 'Completo · imagens + vídeos',
    resumo:
      'Plano completo com diagnóstico, estratégia, imagens e roteiro de vídeo. Estilo visual nas categorias já existentes.',
    profundidade: 'completo',
    incluiDiagnostico: true,
    incluiImagem: true,
    incluiVideo: true,
    mostraPresetsMidia: false,
  },
];

export function OBTER_TIER(id: IdTierPlano): TierPlano {
  const encontrado = TIERS_PLANO.find((t) => t.id === id);
  if (!encontrado) {
    throw new Error(`Tier de plano desconhecido: ${id}`);
  }
  return encontrado;
}

export function E_PROFUNDIDADE_ENXUTO(id: IdTierPlano): boolean {
  return OBTER_TIER(id).profundidade === 'enxuto';
}

export function E_PROFUNDIDADE_COMPLETO(id: IdTierPlano): boolean {
  return OBTER_TIER(id).profundidade === 'completo';
}

/**
 * Abas de resultado por profundidade.
 * Enxuto: Mocks + Propostas + Kanban (fluxo feliz).
 * Completo: Estratégia primeiro, depois mocks/propostas/kanban e Performance.
 */
export function LISTAR_ABAS_RESULTADOS(id: IdTierPlano): MetaAbaResultados[] {
  const { profundidade } = OBTER_TIER(id);
  const fluxoFeliz: MetaAbaResultados[] = [
    { id: 'modulo3', label: 'Mocks de Conteúdo', primaria: true },
    { id: 'propostas', label: 'Propostas de Campanha', primaria: true },
    { id: 'kanban', label: 'Kanban', primaria: true },
  ];
  if (profundidade === 'enxuto') {
    return fluxoFeliz;
  }
  return [
    { id: 'modulo2', label: 'Estratégia Tripla', primaria: true },
    ...fluxoFeliz,
    { id: 'modulo4', label: 'Performance & Pivotagem', primaria: true },
  ];
}

/** Aba inicial: enxuto → mocks; completo → estratégia. */
export function ABA_INICIAL_RESULTADOS(id: IdTierPlano): IdAbaResultados {
  return E_PROFUNDIDADE_ENXUTO(id) ? 'modulo3' : 'modulo2';
}

export function COPY_CABECALHO_RESULTADOS(id: IdTierPlano): CopyCabecalhoResultados {
  if (E_PROFUNDIDADE_ENXUTO(id)) {
    return {
      badge: 'CAMPANHA LEVE',
      tituloPrefixo: 'Campanha leve & presets para',
      subtituloFallback:
        'Fluxo ágil com presets de mídia: gere o visual, revise propostas e publique pelo Kanban.',
    };
  }
  return {
    badge: 'PLANO DE ATAQUE',
    tituloPrefixo: 'Plano de Ataque & consultoria para',
    subtituloFallback:
      'Diagnóstico, estratégia tripla, mocks e performance — o pacote completo de consultoria.',
  };
}
