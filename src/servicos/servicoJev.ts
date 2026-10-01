/**
 * Cliente front-end para TypeSafe/Jev via POST /api/jev-decide.
 * Soft fallback: retorna null em falha (matriz local permanece canônica).
 */
import {
  ClassificacaoJev,
  ClassificacaoJevChoice,
  ClassificacaoJevScore,
  DiagnosticoCompleto,
  ModeloOperacional,
  EscopoGeografico,
  RespostasFiltroSetePerguntas,
  CategoriaModeloNegocio
} from '../tipos';
import { OBTER_SETE_PERGUNTAS_ESTRATEGICAS } from './servicoDiagnostico';

let cacheChaveConfigurada: boolean | null = null;
let promiseStatus: Promise<boolean> | null = null;

async function atualizarStatusChave(): Promise<boolean> {
  try {
    const resp = await fetch('/api/jev-decide', { method: 'GET', cache: 'no-store' });
    const json = await resp.json();
    cacheChaveConfigurada = Boolean(json?.configured);
  } catch {
    cacheChaveConfigurada = false;
  }
  return cacheChaveConfigurada!;
}

/** Indica se o servidor tem TYPESAFE_API_KEY. Otimista true até saber. */
export function TEM_CHAVE_JEV_CONFIGURADA(): boolean {
  if (cacheChaveConfigurada === null && !promiseStatus) {
    promiseStatus = atualizarStatusChave();
  }
  return cacheChaveConfigurada !== false;
}

export const SCHEMA_CLASSIFICACAO_MODELO_NEGOCIO = {
  questions: {
    quadrante: {
      type: 'choice',
      instructions:
        'Classifique o negócio em um dos quatro quadrantes da matriz ciclo-de-venda (X) vs escala (Y). Escolha o quadrante mais aderente ao estado informado.',
      criteria: {
        Q1: 'High-Ticket Escalavel / B2B — ciclo consultivo com alta escala digital (funil de autoridade, B2B, SaaS enterprise).',
        Q2: 'Giro Rapido Digital / E-commerce — decisao rapida com escala digital (trafego direto, conversao imediata).',
        Q3: 'Varejo Local / Negocio de Bairro — giro rapido com alcance local/fisico (geo-localizado, WhatsApp, GMB).',
        Q4: 'Servico Especializado Local — ciclo consultivo de alcance local (Google Search de intencao, agendamento).'
      }
    },
    ciclo_venda: {
      type: 'score',
      instructions:
        'Avalie o eixo X (ciclo de venda): quão rápida ou consultiva é a decisão de compra deste negócio.',
      criteria: [
        'Giro rápido / impulso (decisão no mesmo dia, ticket baixo)',
        'Neutro / médio (ciclo intermediário de dias a poucas semanas)',
        'Consultivo / longo (semanas ou meses, alto valor agregado)'
      ]
    },
    escala: {
      type: 'score',
      instructions:
        'Avalie o eixo Y (escala): o alcance e a capacidade de atendimento tendem ao local/físico ou à alta escala digital.',
      criteria: [
        'Local / físico / capacidade limitada (bairro, agenda cheia, passagem física)',
        'Misto (indicação, crescimento moderado, canais híbridos)',
        'Alta escala digital (redes, anuncios, operacao escalavel)'
      ]
    }
  }
} as const;

export interface EntradaClassificacaoJev {
  nomeNegocio: string;
  setor: string;
  modeloOperacional: ModeloOperacional;
  escopoGeografico: EscopoGeografico;
  respostasFiltro: RespostasFiltroSetePerguntas;
  /** Matriz local ja calculada — contexto para o overlay, nao autoridade. */
  matrizLocal?: Pick<CategoriaModeloNegocio, 'quadrante' | 'categoria' | 'pontuacaoX' | 'pontuacaoY' | 'justificativa'>;
}

function montarPromptClassificacao(entrada: EntradaClassificacaoJev): object {
  const perguntas = OBTER_SETE_PERGUNTAS_ESTRATEGICAS(entrada.setor, entrada.nomeNegocio);
  const respostas = perguntas.map(p => {
    const r = entrada.respostasFiltro[p.id] || { valores: [] as string[] };
    return {
      id: p.id,
      eixo: p.eixo,
      pergunta: p.pergunta,
      valores: r.valores,
      textoOutros: r.textoOutros?.trim() || undefined,
      classificacaoOutros: r.classificacaoOutros
        ? {
            valorMaisProximo: r.classificacaoOutros.valorMaisProximo,
            pontuacaoX: r.classificacaoOutros.pontuacaoX,
            pontuacaoY: r.classificacaoOutros.pontuacaoY
          }
        : undefined
    };
  });

  return {
    contexto: 'Filtro estrategico GrowBiz — 7 perguntas de diagnostico de modelo de negocio.',
    nomeNegocio: entrada.nomeNegocio,
    setor: entrada.setor,
    modeloOperacional: entrada.modeloOperacional,
    escopoGeografico: entrada.escopoGeografico,
    respostas,
    matrizLocal: entrada.matrizLocal
      ? {
          quadrante: entrada.matrizLocal.quadrante,
          categoria: entrada.matrizLocal.categoria,
          pontuacaoX: entrada.matrizLocal.pontuacaoX,
          pontuacaoY: entrada.matrizLocal.pontuacaoY,
          justificativa: entrada.matrizLocal.justificativa
        }
      : undefined
  };
}

function parseChoice(raw: unknown, id: string): ClassificacaoJevChoice | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (String(a.type).toLowerCase() !== 'choice' || typeof a.choice !== 'string') {
    console.warn(`servicoJev: answer "${id}" não é choice válido`);
    return null;
  }
  return {
    type: 'choice',
    choice: a.choice,
    probabilities: (a.probabilities && typeof a.probabilities === 'object'
      ? (a.probabilities as Record<string, number>)
      : {}),
    confidence: a.confidence != null ? Number(a.confidence) : undefined
  };
}

function parseScore(raw: unknown, id: string): ClassificacaoJevScore | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  if (String(a.type).toLowerCase() !== 'score' || a.score == null || Number.isNaN(Number(a.score))) {
    console.warn(`servicoJev: answer "${id}" não é score válido`);
    return null;
  }
  return {
    type: 'score',
    score: Number(a.score),
    legend: (a.legend && typeof a.legend === 'object' ? (a.legend as Record<string, string>) : {}),
    probabilities: (a.probabilities && typeof a.probabilities === 'object'
      ? (a.probabilities as Record<string, number>)
      : {}),
    confidence: a.confidence != null ? Number(a.confidence) : undefined
  };
}

function parseClassificacaoJev(resultado: unknown): ClassificacaoJev | null {
  if (!resultado || typeof resultado !== 'object') return null;
  const r = resultado as Record<string, unknown>;
  const answers = r.answers;
  if (!answers || typeof answers !== 'object') {
    console.warn('servicoJev: resultado sem answers');
    return null;
  }
  const map = answers as Record<string, unknown>;
  const quadrante = parseChoice(map.quadrante, 'quadrante');
  const ciclo_venda = parseScore(map.ciclo_venda, 'ciclo_venda');
  const escala = parseScore(map.escala, 'escala');
  if (!quadrante || !ciclo_venda || !escala) return null;

  const usageRaw = r.usage && typeof r.usage === 'object' ? (r.usage as Record<string, unknown>) : {};
  return {
    model: typeof r.model === 'string' ? r.model : 'unknown',
    quadrante,
    ciclo_venda,
    escala,
    usage: {
      input_tokens: Number(usageRaw.input_tokens) || 0,
      output_tokens: Number(usageRaw.output_tokens) || 0
    },
    obtidoEm: new Date().toISOString()
  };
}

/**
 * Classifica o diagnostico via Jev (overlay). Retorna null em qualquer falha.
 */
export async function CLASSIFICAR_MODELO_NEGOCIO_JEV(
  entrada: EntradaClassificacaoJev
): Promise<ClassificacaoJev | null> {
  try {
    const resp = await fetch('/api/jev-decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: montarPromptClassificacao(entrada),
        schema: SCHEMA_CLASSIFICACAO_MODELO_NEGOCIO
      })
    });

    if (!resp.ok) {
      let detalhe = '';
      try {
        const j = await resp.json();
        detalhe = j?.erro ? String(j.erro) : '';
      } catch {
        /* ignore */
      }
      console.warn(`servicoJev: HTTP ${resp.status}${detalhe ? ` — ${detalhe}` : ''}`);
      if (resp.status === 503) cacheChaveConfigurada = false;
      return null;
    }

    const json = await resp.json();
    if (!json?.ok || !json?.resultado) {
      console.warn('servicoJev: resposta sem ok/resultado');
      return null;
    }

    cacheChaveConfigurada = true;
    return parseClassificacaoJev(json.resultado);
  } catch (erro) {
    console.warn('servicoJev: falha ao classificar modelo de negócio', erro);
    return null;
  }
}

/**
 * Anexa classificacaoJev ao diagnostico se Jev responder; caso contrario devolve o original.
 */
export async function ANEXAR_CLASSIFICACAO_JEV(
  diagnostico: DiagnosticoCompleto
): Promise<DiagnosticoCompleto> {
  const classificacaoJev = await CLASSIFICAR_MODELO_NEGOCIO_JEV({
    nomeNegocio: diagnostico.nomeNegocio,
    setor: diagnostico.setor,
    modeloOperacional: diagnostico.modeloOperacional,
    escopoGeografico: diagnostico.escopoGeografico,
    respostasFiltro: diagnostico.respostasFiltro,
    matrizLocal: diagnostico.categoriaModelo
      ? {
          quadrante: diagnostico.categoriaModelo.quadrante,
          categoria: diagnostico.categoriaModelo.categoria,
          pontuacaoX: diagnostico.categoriaModelo.pontuacaoX,
          pontuacaoY: diagnostico.categoriaModelo.pontuacaoY,
          justificativa: diagnostico.categoriaModelo.justificativa
        }
      : undefined
  });

  if (!classificacaoJev) return diagnostico;
  return { ...diagnostico, classificacaoJev };
}
