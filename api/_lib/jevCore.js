/**
 * Cliente TypeSafe / Jev (System One): decisoes tipadas Choice / Score / Noul.
 * Preco publico: US$ 0,042 por milhao de tokens de entrada; saida gratis.
 * Contexto: 64k tokens/request; entrada so texto.
 * Modelo padrao: jev-latest (alias estavel). Prefira pin jev-1.13.0 so se
 * voce calibrar limiares de confidence contra essa versao especifica.
 */
import {
  obterBaseUrlTypesafe,
  obterChaveTypesafe,
  temChaveTypesafe,
} from './chaveTypesafe.js';

export function statusJev() {
  return { configured: temChaveTypesafe() };
}

function normalizarState(prompt) {
  if (typeof prompt === 'string') return prompt;
  return JSON.stringify(prompt ?? '');
}

function extrairQuestions(schema) {
  if (!schema || typeof schema !== 'object') {
    throw new Error('schema obrigatorio (mapa de questions TypeSafe)');
  }
  if (schema.questions && typeof schema.questions === 'object') {
    return schema.questions;
  }
  return schema;
}

function extrairModel(schema, opcoes) {
  if (opcoes?.model) return String(opcoes.model);
  if (schema && typeof schema === 'object' && typeof schema.model === 'string') {
    return schema.model;
  }
  return 'jev-latest';
}

/**
 * Normaliza a resposta da API TypeSafe.
 * @param {unknown} data
 */
export function parseJevResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('resposta TypeSafe invalida: corpo vazio');
  }
  const raw = data;
  if (!raw.answers || typeof raw.answers !== 'object') {
    throw new Error('resposta TypeSafe invalida: answers ausente');
  }

  const answers = {};
  for (const [id, ans] of Object.entries(raw.answers)) {
    if (!ans || typeof ans !== 'object' || !ans.type) {
      throw new Error(`resposta TypeSafe invalida: answer "${id}" sem type`);
    }
    const type = String(ans.type).toLowerCase();
    if (type === 'noul') {
      answers[id] = {
        type: 'noul',
        noul: Number(ans.noul),
      };
    } else if (type === 'choice') {
      answers[id] = {
        type: 'choice',
        choice: ans.choice,
        probabilities: ans.probabilities || {},
        confidence: ans.confidence != null ? Number(ans.confidence) : undefined,
      };
    } else if (type === 'score') {
      answers[id] = {
        type: 'score',
        score: Number(ans.score),
        legend: ans.legend || {},
        probabilities: ans.probabilities || {},
        confidence: ans.confidence != null ? Number(ans.confidence) : undefined,
      };
    } else {
      throw new Error(`resposta TypeSafe invalida: tipo desconhecido "${ans.type}" em "${id}"`);
    }
  }

  const usageRaw = raw.usage && typeof raw.usage === 'object' ? raw.usage : {};
  return {
    model: typeof raw.model === 'string' ? raw.model : 'unknown',
    answers,
    usage: {
      input_tokens: Number(usageRaw.input_tokens) || 0,
      output_tokens: Number(usageRaw.output_tokens) || 0,
    },
  };
}

/**
 * Mapeia status HTTP TypeSafe para mensagens claras.
 * @param {number} status
 * @param {string} bodyText
 */
export function mensagemErroTypesafe(status, bodyText) {
  if (status === 401) return 'chave TypeSafe invalida ou ausente';
  if (status === 429) return 'limite de taxa TypeSafe excedido; tente de novo em breve';
  if (status === 529) return 'TypeSafe temporariamente sobrecarregado; tente de novo em breve';
  if (status === 422) {
    return bodyText
      ? `pedido TypeSafe invalido (422): ${bodyText.slice(0, 400)}`
      : 'pedido TypeSafe invalido (422)';
  }
  return `falha TypeSafe (HTTP ${status})${bodyText ? `: ${bodyText.slice(0, 200)}` : ''}`;
}

/**
 * Envia state + questions tipadas para a Jev e devolve answers parseadas.
 * @param {string|object} prompt
 * @param {object} schema mapa de questions ou { questions, model? }
 * @param {{ model?: string }} [opcoes]
 */
export async function decide(prompt, schema, opcoes = {}) {
  const apiKey = obterChaveTypesafe();
  if (!apiKey) {
    throw new Error('TYPESAFE_API_KEY nao configurada');
  }

  const questions = extrairQuestions(schema);
  if (!questions || Object.keys(questions).length === 0) {
    throw new Error('schema.questions vazio');
  }

  const body = {
    state: normalizarState(prompt),
    model: extrairModel(schema, opcoes),
    questions,
  };

  const url = `${obterBaseUrlTypesafe()}/v1/systemone`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`falha de rede ao chamar TypeSafe: ${msg}`);
  }

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    throw new Error(mensagemErroTypesafe(response.status, text || ''));
  }

  return parseJevResponse(json);
}
