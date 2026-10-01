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

export type TierPlano = {
  id: IdTierPlano;
  nome: string;
  resumo: string;
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
