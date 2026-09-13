import { TomNarracao, GeneroVoz } from '../tipos';

/** Ajustes de ritmo/timbre por tom de narração, aplicados sobre a mesma voz do navegador. */
/** Ritmo mais próximo de fala humana; a Web Speech API ainda limita o quão natural soa. */
export const PARAMETROS_TOM: Record<TomNarracao, { rate: number; pitch: number }> = {
  calma: { rate: 0.9, pitch: 0.95 },
  agitada: { rate: 1.08, pitch: 1.05 },
  seria: { rate: 0.88, pitch: 0.9 },
  empolgante: { rate: 1.05, pitch: 1.08 },
  energetica: { rate: 1.1, pitch: 1.02 }
};

export const ROTULO_TOM: Record<TomNarracao, string> = {
  calma: 'Calma',
  agitada: 'Agitada',
  seria: 'Séria',
  empolgante: 'Empolgante',
  energetica: 'Enérgica'
};

const PISTAS_NOME_FEMININO = ['maria', 'female', 'luciana', 'francisca', 'camila', 'fernanda', 'helena', 'joana', 'raquel', 'vitória', 'vitoria', 'ana', 'zira', 'catarina'];
const PISTAS_NOME_MASCULINO = ['daniel', 'male', 'ricardo', 'felipe', 'thiago', 'antónio', 'antonio', 'joão', 'joao', 'pedro', 'carlos', 'ricardo', 'diego', 'guilherme'];

function classificarGeneroVoz(voz: SpeechSynthesisVoice): GeneroVoz | null {
  const nome = voz.name.toLowerCase();
  if (PISTAS_NOME_FEMININO.some(pista => nome.includes(pista))) return 'feminina';
  if (PISTAS_NOME_MASCULINO.some(pista => nome.includes(pista))) return 'masculina';
  return null;
}

function ehVozPtBr(voz: SpeechSynthesisVoice): boolean {
  return voz.lang === 'pt-BR' || voz.lang === 'pt_BR' || voz.name.toLowerCase().includes('brazil') || voz.name.toLowerCase().includes('portuguese') || voz.lang?.startsWith('pt');
}

/**
 * Escolhe a melhor voz disponível no navegador para o gênero pedido, entre as vozes PT-BR.
 * Nem todo navegador expõe gênero explicitamente (a Web Speech API não tem esse campo),
 * então classificamos pelo nome da voz (heurística) — se não achar par exato, cai para
 * qualquer voz PT-BR disponível, e por fim para a primeira voz do sistema.
 */
export function selecionarVozParaGenero(generoDesejado: GeneroVoz): SpeechSynthesisVoice | undefined {
  const vozes = window.speechSynthesis.getVoices();
  const vozesPtBr = vozes.filter(ehVozPtBr);

  const correspondenciaExata = vozesPtBr.find(v => classificarGeneroVoz(v) === generoDesejado);
  if (correspondenciaExata) return correspondenciaExata;

  // Sem classificação por nome disponível: usa a ordem de listagem como heurística de variação
  // (na prática, navegadores como Edge/Chrome no Windows costumam listar vozes MS em pares M/F).
  const semClassificacao = vozesPtBr.filter(v => classificarGeneroVoz(v) === null);
  if (semClassificacao.length > 1) {
    return generoDesejado === 'feminina' ? semClassificacao[0] : semClassificacao[1];
  }

  return vozesPtBr[0] || vozes[0];
}
