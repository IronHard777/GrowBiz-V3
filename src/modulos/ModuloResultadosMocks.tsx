import React from 'react';
import { ResultadoCompletoConsultoria } from '../tipos';
import { IdTierPlano, E_PROFUNDIDADE_ENXUTO } from '../tipos/tierPlano';
import { ModuloResultadosEnxuto } from './resultados/ModuloResultadosEnxuto';
import { ModuloResultadosCompleto } from './resultados/ModuloResultadosCompleto';

interface PropriedadesResultados {
  resultado: ResultadoCompletoConsultoria;
  tier: IdTierPlano;
  aoRefazerDiagnostico: () => void;
  aoTrocarTier: () => void;
}

/**
 * Shell fino: encaminha para a variante de resultados conforme a profundidade do tier.
 * Enxuto → campanha leve / presets / fluxo feliz.
 * Completo → plano de ataque / estratégia / performance.
 */
export const ModuloResultadosMocks: React.FC<PropriedadesResultados> = (props) => {
  if (E_PROFUNDIDADE_ENXUTO(props.tier)) {
    return <ModuloResultadosEnxuto {...props} />;
  }
  return <ModuloResultadosCompleto {...props} />;
};
