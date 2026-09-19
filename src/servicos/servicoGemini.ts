import { GoogleGenAI } from '@google/genai';
import { DiagnosticoCompleto, EstrategiaCrescimento, SensoriamentoMercado, EscopoGeografico, CenaRoteiroVideo, MockCampanhaConteudo, PropostaCampanha, ClassificacaoRespostaOutros, PerguntaEstrategica } from '../tipos';

const REGRA_TOM_E_VOZ = `Tom de narração PODE variar entre cenas (abertura empolgante, dor séria, solução energética, CTA agitada).
Gênero da voz NÃO pode variar: use o MESMO "generoVoz" nas 4 cenas (padrão "feminina", a menos que o negócio peça explicitamente voz masculina). Trocar de feminino para masculino no meio da propaganda quebra o sentido comercial.

ELENCO TRAVADO (obrigatório): na cena 1 descreva a protagonista com identidade fixa (idade aparente, tom de pele, COR e COMPRIMENTO do cabelo, se o cabelo está solto/preso/pixie, roupa). Nas cenas 2, 3 e 4 escreva "a MESMA protagonista da cena 1" e repita cabelo + roupa. PROIBIDO mudar corte de cabelo (ex.: pixie virar rabo-de-cavalo), prender/soltar cabelo, trocar roupa, idade ou ator sem o roteiro pedir explicitamente.

Cada "acaoVisual" DEVE ser cinematográfica, com personagens adultos, cenário completo e interação — nunca só um close de produto estático:
- quem está em cena (a mesma protagonista + outros se houver)
- o que fazem (olhares, sorrisos, troca de produto, reação)
- cortes de câmera (plano geral → close no rosto → over-the-shoulder)
- fala/interação entre personagens quando fizer sentido`;

const TONS_VALIDOS = ['calma', 'agitada', 'seria', 'empolgante', 'energetica'];
const GENEROS_VALIDOS = ['masculina', 'feminina'];

/** Garante que toda cena tenha tomNarracao/generoVoz válidos, mesmo se o Gemini omitir algum campo. */
function normalizarRoteiro(roteiro: any[]): CenaRoteiroVideo[] {
  const lista = roteiro || [];
  const generoUnico = GENEROS_VALIDOS.includes(lista[0]?.generoVoz) ? lista[0].generoVoz : 'feminina';
  return lista.map((cena, idx) => ({
    ...cena,
    promptUsuario: typeof cena.promptUsuario === 'string' ? cena.promptUsuario : '',
    tomNarracao: TONS_VALIDOS.includes(cena.tomNarracao) ? cena.tomNarracao : TONS_VALIDOS[idx % TONS_VALIDOS.length],
    generoVoz: generoUnico
  }));
}

/**
 * Serviço de Integração com a API do Google Gemini (@google/genai)
 * Suporta fallback automático quando a chave de API não estiver definida.
 */

export interface AnexoArquivoIA {
  nome: string;
  mimeType: string;
  dadosBase64: string;
}

function obterChaveGemini(): string | null {
  // Verifica variáveis injetadas no Vite / Node / Ambiente
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (import.meta as any).env?.GEMINI_API_KEY || 
                 (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null);

  if (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey.trim().length > 0) {
    return envKey;
  }
  return null;
}

export function TEM_CHAVE_GEMINI_CONFIGURADA(): boolean {
  return obterChaveGemini() !== null;
}

/**
 * Chamada à API real do Gemini para otimização da Copy e Justificativa de Matriz
 */
export async function GERAR_COPY_PERSUASIVA_GEMINI(
  diagnostico: DiagnosticoCompleto,
  objetivo: string,
  anexos?: AnexoArquivoIA[]
): Promise<{
  copy: string;
  hashtags: string[];
  promptImagem: string;
  roteiroVideo: CenaRoteiroVideo[];
  estrategias?: EstrategiaCrescimento;
} | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Você é um Consultor Estratégico de Marketing Sênior para o aplicativo GrowBiz V2.2.
Gere um plano de conteúdo comercial e roteiro de vídeo Reels/TikTok 100% EXCLUSIVO e CUSTOMIZADO para este negócio:
- Nome da Empresa: ${diagnostico.nomeNegocio}
- Setor: ${diagnostico.setor}
- Modelo Operacional: ${diagnostico.modeloOperacional}
- Escopo Geográfico: ${diagnostico.escopoGeografico}
- Matriz de Decisão: ${diagnostico.tipoDecisaoCalculado}
- Categoria do modelo (quadrante ${diagnostico.categoriaModelo?.quadrante ?? '-'}): ${diagnostico.categoriaModelo?.categoria || 'não classificado'}
- Estratégia do quadrante: ${diagnostico.categoriaModelo?.estrategia || diagnostico.justificativaMatriz}
- Objetivo da Campanha: ${objetivo}
- Respostas reais do negócio: ${JSON.stringify(diagnostico.respostasFiltro)}
- Pesquisa e fontes disponíveis: ${JSON.stringify(diagnostico.sensoriamento)}
Use as referências apenas quando comparáveis. Explique a adaptação nos campos da estratégia; a copy pública deve falar com o cliente. Para cada ação estratégica, identifique o caso consultado e seu limite de aplicação. Sem evidência comparável, escreva "Hipótese a validar". Não invente preços, escassez, depoimentos ou resultados. Um caso publicado não garante o mesmo desempenho neste negócio. Não invente metas numéricas de CPA, conversão ou ROI: proponha medir uma linha de base antes de definir metas. Serviços, combos e descontos não confirmados pelo usuário devem aparecer apenas como sugestões a confirmar, nunca como ofertas já existentes na copy pública.

REGRAS RÍGIDAS DE GERAÇÃO:
1. O Roteiro de vídeo deve conter 4 cenas contínuas, sem segundo vazio entre elas (0-4s Gancho, 4-8s Dor, 8-16s Solução, 16-22s CTA).
2. As falas ("falaAudio") DEVEM SER TOTALMENTE ESPECÍFICAS para o negócio "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}". NUNCA use modelos prontos ou genéricos!
3. Na última cena (CTA), escreva "Zap" ou "Whats" em vez de "WhatsApp" para que a pronúncia de áudio nativa soe perfeita em português.
4. O campo "promptImagem" DEVE ser em INGLÊS comercial focado no produto OU serviço real do setor "${diagnostico.setor}".
5. ${REGRA_TOM_E_VOZ}${anexos && anexos.length > 0 ? `
6. Você recebeu ${anexos.length} arquivo(s) real(is) anexado(s) pelo cliente (catálogo, cardápio ou fotos do produto/local). ANALISE o conteúdo desses arquivos e use detalhes CONCRETOS observados neles (produtos específicos, preços, nomes, estilo visual, ambiente real) na copy, nas hashtags e principalmente no campo "promptImagem" — em vez de generalizações sobre o setor "${diagnostico.setor}". Priorize sempre o que você vê nos arquivos reais sobre suposições genéricas do setor.` : ''}

Retorne um JSON válido com o seguinte formato exato (sem marcadores de código markdown):
{
  "estrategias": {
    "estrategiaBase": { "titulo": "Plano de presença", "pilaresAtemporais": ["Ação específica, caso de referência e limite de aplicação"], "descricao": "Como o padrão observado se adapta ao negócio e às respostas" },
    "estrategiaOportunidade": { "titulo": "Teste de campanha", "planoAtaqueImediato": "Ação, canal, referência consultada e métrica para validar", "gatilhoTendencia": "Evidência datada ou hipótese explicitamente identificada" },
    "estrategiaComplementar": { "titulo": "Relacionamento fora das redes", "jornadaForaRedes": { "googleMeuNegocio": "Ação pertinente ao modelo operacional e sua evidência ou hipótese", "whatsappEstrategico": "Ação pertinente e sua evidência ou hipótese", "deliveryOuPresencial": "Ação adequada à entrega real do serviço ou produto e sua evidência ou hipótese" } }
  },
  "copy": "Texto persuasivo em português brasileiro com emojis e CTA claro",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "promptImagem": "Professional commercial product photography of ${diagnostico.setor}, studio lighting, 8k resolution",
  "roteiroVideo": [
    {
      "segundoInicio": 0,
      "segundoFim": 4,
      "acaoVisual": "Plano geral de pessoas adultas no ambiente do negócio, corte para close no rosto sorrindo, interação real (não still de produto)",
      "falaAudio": "Fala marcante de abertura sobre ${diagnostico.setor}",
      "enquadramentoCamera": "Plano Médio Fechado (Vertical 9:16)",
      "dicaDirecao": "Fale com entusiasmo máximo",
      "tomNarracao": "empolgante",
      "generoVoz": "feminina"
    },
    {
      "segundoInicio": 4,
      "segundoFim": 8,
      "acaoVisual": "Over-the-shoulder de um cliente frustrado, corte para o cotidiano; outra pessoa reage; movimento de câmera",
      "falaAudio": "Pergunta sobre a dor em ${diagnostico.setor}",
      "enquadramentoCamera": "Plano Detalhe dinâmico",
      "dicaDirecao": "Expressão séria e empática",
      "tomNarracao": "seria",
      "generoVoz": "feminina"
    },
    {
      "segundoInicio": 8,
      "segundoFim": 16,
      "acaoVisual": "Atendente e cliente trocam o produto com as mãos, olhares, reação positiva, câmera orbitando o atendimento",
      "falaAudio": "Apresentação da solução da ${diagnostico.nomeNegocio}",
      "enquadramentoCamera": "Plano Geral da ação",
      "dicaDirecao": "Sorria com confiança",
      "tomNarracao": "energetica",
      "generoVoz": "feminina"
    },
    {
      "segundoInicio": 16,
      "segundoFim": 22,
      "acaoVisual": "Personagem olha para a câmera, aponta o celular, equipe acena ao fundo; corte rápido para o espaço da marca",
      "falaAudio": "Clique no botão e fale no Zap com a equipe da ${diagnostico.nomeNegocio}",
      "enquadramentoCamera": "Plano Médio com CTA",
      "dicaDirecao": "Mantenha o botão em destaque",
      "tomNarracao": "agitada",
      "generoVoz": "feminina"
    }
  ]
}`;

    const partes: any[] = [{ text: prompt }];
    if (anexos) {
      for (const anexo of anexos) {
        partes.push({ inlineData: { mimeType: anexo.mimeType, data: anexo.dadosBase64 } });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts: partes }],
      config: {
        httpOptions: { timeout: 60000 },
        responseMimeType: 'application/json'
      }
    });

    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);

    return {
      copy: parsed.copy,
      hashtags: parsed.hashtags || [],
      promptImagem: parsed.promptImagem,
      roteiroVideo: normalizarRoteiro(parsed.roteiroVideo),
      estrategias: VALIDAR_ESTRATEGIAS_GEMINI(parsed.estrategias) ? parsed.estrategias : undefined
    };
  } catch (error) {
    console.warn("Aviso ao chamar API Gemini (fallback ativado):", error);
    return null;
  }
}

export function VALIDAR_ESTRATEGIAS_GEMINI(valor: unknown): valor is EstrategiaCrescimento {
  const e = valor as EstrategiaCrescimento | undefined;
  const texto = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  return !!e && [e.estrategiaBase?.titulo, e.estrategiaBase?.descricao,
    e.estrategiaOportunidade?.titulo, e.estrategiaOportunidade?.planoAtaqueImediato,
    e.estrategiaOportunidade?.gatilhoTendencia, e.estrategiaComplementar?.titulo,
    e.estrategiaComplementar?.jornadaForaRedes?.googleMeuNegocio,
    e.estrategiaComplementar?.jornadaForaRedes?.whatsappEstrategico,
    e.estrategiaComplementar?.jornadaForaRedes?.deliveryOuPresencial].every(texto)
    && Array.isArray(e.estrategiaBase?.pilaresAtemporais)
    && e.estrategiaBase.pilaresAtemporais.length > 0 && e.estrategiaBase.pilaresAtemporais.every(texto);
}

/**
 * Geração de Imagem Comercial Fotorrealista via Gemini (gemini-2.5-flash-image).
 * A superfície antiga (ai.models.generateImages / Imagen :predict) foi descontinuada
 * para contas novas — a própria SDK já sinalizava isso como deprecated, recomendando
 * migrar para generateContent com um modelo de imagem.
 */
export async function GERAR_IMAGEM_IMAGEN3(prompt: string): Promise<string | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: '9:16' }, httpOptions: { timeout: 90000 } }
    });

    const partes = response.candidates?.[0]?.content?.parts || [];
    const parteImagem = partes.find((p: any) => p.inlineData?.data);
    if (parteImagem?.inlineData) {
      const mimeType = parteImagem.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${parteImagem.inlineData.data}`;
    }
  } catch (error) {
    console.warn("Aviso ao gerar imagem com Gemini (fallback ativado):", error);
  }
  return null;
}

/**
 * Geração de Sensoriamento de Mercado (tendências e casos de sucesso) via Gemini.
 * Substitui os números e casos fixos do fallback local ("Caso #104", "+42%" etc.),
 * que se repetiam identicamente em toda consultoria independente do negócio.
 */
export async function GERAR_SENSORIAMENTO_MERCADO_GEMINI(
  setor: string,
  nomeNegocio: string,
  escopo: EscopoGeografico,
  contexto?: DiagnosticoCompleto
): Promise<SensoriamentoMercado | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: `Pesquise na web casos de marketing publicados para o setor ${JSON.stringify(setor)}, alcance ${escopo}.
      Contexto para comparação: ${JSON.stringify({ modelo: contexto?.modeloOperacional, respostas: contexto?.respostasFiltro })}.
      Prefira casos oficiais de Google, Meta e TikTok. Compare setor, objetivo, canal e porte; explicite diferenças.
      Responda em português em até 3 parágrafos: empresa do caso, ação documentada, resultado reportado e limitação para aplicar ao setor solicitado.
      Cite fontes. Não invente casos, concorrentes, percentuais ou demanda local. Anúncio ativo não comprova lucro.
      Se não encontrar caso comparável, diga isso explicitamente. Nunca apresente inferência como resultado comprovado.
      O nome ${JSON.stringify(nomeNegocio)} é somente contexto; não invente informações sobre ele.`,
      config: { tools: [{ googleSearch: {} }], httpOptions: { timeout: 45000 } }
    });
    const metadata = response.candidates?.[0]?.groundingMetadata;
    const fontes = (metadata?.groundingChunks || []).flatMap(chunk => {
      const web = chunk.web;
      return web?.uri && /^https:\/\//.test(web.uri) ? [{ titulo: web.title || 'Fonte da pesquisa', url: web.uri }] : [];
    });
    if (!fontes.length || !metadata?.webSearchQueries?.length || !response.text) return null;
    return {
      concorrentesLocaisMapeados: 0,
      statusPesquisa: 'consultado', fontes, consultadoEm: new Date().toISOString(),
      sugestoesBuscaHtml: metadata.searchEntryPoint?.renderedContent,
      tendenciaPrincipal: 'Referências externas consultadas; aplicação ao negócio é uma hipótese a testar.',
      volumeBuscaRelativo: 'Não medido. Casos publicados não estimam demanda local.',
      casosDeSucessoAncorados: [response.text]
    };
  } catch {
    console.warn('Pesquisa de mercado indisponível; nenhuma evidência será inventada.');
    return null;
  }
}

/**
 * Regenera apenas o roteiro de vídeo (4 cenas) aplicando uma categoria de estilo escolhida
 * pelo cliente (ex: "Exibição de Produto", "Anime"), preservando o contexto real do negócio.
 * Mantém copy/hashtags intactos — só o roteiro muda.
 */
export async function GERAR_ROTEIRO_VIDEO_COM_ESTILO_GEMINI(
  diagnostico: DiagnosticoCompleto,
  campanha: MockCampanhaConteudo,
  nomeCategoria: string,
  modificadorEstilo: string
): Promise<CenaRoteiroVideo[] | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um Diretor de Criação Sênior para o aplicativo GrowBiz V2.2.
Regenere o roteiro de vídeo Reels/TikTok (4 cenas) para este negócio, aplicando um novo estilo de direção:

- Nome da Empresa: ${diagnostico.nomeNegocio}
- Setor: ${diagnostico.setor}
- Campanha: ${campanha.tituloCampanha}
- Objetivo: ${campanha.objetivoPrincipal}
- CHAMADA PARA AÇÃO: ${campanha.chamadaParaAcao}

ESTILO SOLICITADO PELO CLIENTE: "${nomeCategoria}"
${modificadorEstilo}

REGRAS RÍGIDAS:
1. O roteiro deve conter exatamente 4 cenas contínuas (0-4s, 4-8s, 8-16s, 16-22s), sem intervalo vazio entre elas.
2. As falas ("falaAudio") DEVEM SER TOTALMENTE ESPECÍFICAS para "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}" — nunca genéricas.
3. Na última cena (CTA), escreva "Zap" ou "Whats" em vez de "WhatsApp" para a pronúncia de áudio nativa soar perfeita em português.
4. Aplique o estilo solicitado principalmente em "acaoVisual", "enquadramentoCamera" e "dicaDirecao" — mas sem perder a mensagem comercial do negócio.
5. ${REGRA_TOM_E_VOZ} Escolha tons coerentes com o estilo "${nomeCategoria}" (ex: um estilo "Cinematográfico" tende a "seria"/"calma"; um estilo "Dinâmico" ou "Anime" tende a "energetica"/"empolgante").

Retorne APENAS um JSON válido (sem marcadores de código markdown) no formato exato:
{
  "roteiroVideo": [
    { "segundoInicio": 0, "segundoFim": 4, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "empolgante", "generoVoz": "feminina" },
    { "segundoInicio": 4, "segundoFim": 8, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "seria", "generoVoz": "feminina" },
    { "segundoInicio": 8, "segundoFim": 16, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "energetica", "generoVoz": "feminina" },
    { "segundoInicio": 16, "segundoFim": 22, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "agitada", "generoVoz": "feminina" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        httpOptions: { timeout: 60000 },
        responseMimeType: 'application/json'
      }
    });

    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);

    if (!Array.isArray(parsed.roteiroVideo) || parsed.roteiroVideo.length === 0) {
      return null;
    }

    return normalizarRoteiro(parsed.roteiroVideo);
  } catch (error) {
    console.warn("Aviso ao regenerar roteiro de vídeo com estilo via Gemini:", error);
    return null;
  }
}

const PLATAFORMAS_VALIDAS = ['Instagram Reels', 'TikTok', 'Instagram Feed', 'WhatsApp Status', 'Google Meu Negócio'];

/**
 * Gera 3 propostas de campanha (plataforma + formato + % de aderência ao perfil do negócio)
 * para a tela "Proposta de Campanhas" — cada uma pode ser adicionada ao Kanban de acompanhamento.
 */
export async function GERAR_PROPOSTAS_CAMPANHA_GEMINI(
  diagnostico: DiagnosticoCompleto,
  campanha: MockCampanhaConteudo
): Promise<PropostaCampanha[] | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um Planejador de Mídia Sênior para o aplicativo GrowBiz V2.2.
Gere 3 propostas de campanha DISTINTAS (plataformas e formatos diferentes entre si) para este negócio:

- Nome da Empresa: ${diagnostico.nomeNegocio}
- Setor: ${diagnostico.setor}
- Matriz de Decisão: ${diagnostico.tipoDecisaoCalculado}
- Categoria do modelo (quadrante ${diagnostico.categoriaModelo?.quadrante ?? '-'}): ${diagnostico.categoriaModelo?.categoria || 'não classificado'}
- Respostas: ${JSON.stringify(diagnostico.respostasFiltro)}
- Referências: ${JSON.stringify(diagnostico.sensoriamento)}
- Campanha-base proposta: ${campanha.tituloCampanha} (objetivo: ${campanha.objetivoPrincipal})

REGRAS RÍGIDAS:
1. Cada proposta usa uma plataforma diferente, escolhida entre: "Instagram Reels", "TikTok", "Instagram Feed", "WhatsApp Status", "Google Meu Negócio".
2. "titulo" deve ser curto (até 6 palavras) e específico ao formato (ex: "Carrossel — Prova Social", "Vídeo — Bastidores").
3. "descricao" deve ser 1-2 frases explicando a estratégia criativa, específica para "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}".
4. "aderenciaPercentual" é um número entre 60 e 98, DIFERENTE em cada proposta, refletindo o quanto essa proposta combina com o perfil do negócio.

Retorne APENAS um JSON válido (sem marcadores de código markdown) no formato exato:
{
  "propostas": [
    {
      "plataforma": "Instagram Reels|TikTok|Instagram Feed|WhatsApp Status|Google Meu Negócio",
      "titulo": "string",
      "descricao": "string curta",
      "aderenciaPercentual": 0,
      "copy": "texto pronto para publicar",
      "hashtags": ["#tag"],
      "chamadaParaAcao": "CTA curto"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);

    if (!Array.isArray(parsed.propostas) || parsed.propostas.length === 0) return null;

    return parsed.propostas.map((p: any, idx: number) => ({
      id: `prop_gemini_${Date.now()}_${idx}`,
      plataforma: p.plataforma,
      titulo: p.titulo,
      descricao: p.descricao,
      aderenciaPercentual: Number(p.aderenciaPercentual) || 80,
      copy: typeof p.copy === 'string' ? p.copy : undefined,
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : undefined,
      chamadaParaAcao: typeof p.chamadaParaAcao === 'string' ? p.chamadaParaAcao : undefined
    }));
  } catch (error) {
    console.warn("Aviso ao gerar propostas de campanha via Gemini (fallback ativado):", error);
    return null;
  }
}

/**
 * Classifica textos livres da opção "Outros" nas 7 perguntas para os eixos PX/PY.
 * Uma chamada cobre todas as respostas "Outros" do filtro.
 */
export async function CATEGORIZAR_RESPOSTAS_OUTROS_GEMINI(
  itens: { pergunta: PerguntaEstrategica; textoOutros: string }[]
): Promise<Record<number, ClassificacaoRespostaOutros> | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey || itens.length === 0) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const blocoPerguntas = itens.map(({ pergunta, textoOutros }) => {
      const opcoes = pergunta.opcoes
        .filter(o => !o.eOutros)
        .map(o => `- valor="${o.valor}" | X=${o.pontuacaoX} | Y=${o.pontuacaoY} | ${o.rotulo}`)
        .join('\n');
      return `Pergunta Q${pergunta.id} (eixo ${pergunta.eixo}): ${pergunta.pergunta}
Texto livre do usuário: "${textoOutros}"
Opções oficiais e pontuações:
${opcoes}`;
    }).join('\n\n');

    const prompt = `Você é um analista de modelo de negócio para o GrowBiz V2.2.
O usuário escolheu "Outros" em uma ou mais perguntas do diagnóstico. Classifique cada texto livre nos eixos:

- Eixo X (ciclo de venda): -10 = giro rápido / impulso | +10 = consultivo / autoridade
- Eixo Y (escala): -10 = negócio local / físico | +10 = alta escala digital

REGRAS:
1. Para perguntas de eixo X, pontuacaoY DEVE ser 0. Para perguntas de eixo Y, pontuacaoX DEVE ser 0.
2. pontuacaoX e pontuacaoY devem ficar entre -10 e +10 (podem ser valores intermediários, ex: -7, 4).
3. valorMaisProximo deve ser exatamente um dos valores oficiais listados (nunca "outros").
4. A classificação deve refletir o significado do texto, não copiar a pergunta.

${blocoPerguntas}

Retorne APENAS um JSON válido (sem markdown) no formato:
{
  "classificacoes": [
    {
      "perguntaId": 1,
      "pontuacaoX": -10,
      "pontuacaoY": 0,
      "valorMaisProximo": "imediato",
      "justificativa": "Frase curta explicando o enquadramento"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);

    if (!Array.isArray(parsed.classificacoes) || parsed.classificacoes.length === 0) {
      return null;
    }

    const resultado: Record<number, ClassificacaoRespostaOutros> = {};
    for (const item of parsed.classificacoes) {
      const perguntaId = Number(item.perguntaId);
      const pergunta = itens.find(i => i.pergunta.id === perguntaId)?.pergunta;
      if (!pergunta) continue;

      const opcoesValidas = pergunta.opcoes.filter(o => !o.eOutros).map(o => o.valor);
      const valorMaisProximo = opcoesValidas.includes(item.valorMaisProximo)
        ? item.valorMaisProximo
        : opcoesValidas[0];

      let pontuacaoX = Number(item.pontuacaoX);
      let pontuacaoY = Number(item.pontuacaoY);
      if (!Number.isFinite(pontuacaoX)) pontuacaoX = 0;
      if (!Number.isFinite(pontuacaoY)) pontuacaoY = 0;
      pontuacaoX = Math.max(-10, Math.min(10, pontuacaoX));
      pontuacaoY = Math.max(-10, Math.min(10, pontuacaoY));

      if (pergunta.eixo === 'X') pontuacaoY = 0;
      if (pergunta.eixo === 'Y') pontuacaoX = 0;

      resultado[perguntaId] = {
        pontuacaoX,
        pontuacaoY,
        valorMaisProximo,
        justificativa: item.justificativa || 'Classificado pela IA a partir do texto livre.'
      };
    }

    return Object.keys(resultado).length > 0 ? resultado : null;
  } catch (error) {
    console.warn('Aviso ao classificar respostas "Outros" via Gemini (fallback ativado):', error);
    return null;
  }
}

const MODELOS_VEO = [
  'veo-3.1-fast-generate-preview',
  'veo-3.1-generate-preview'
];

/** Handle do arquivo Veo na API — necessário para Scene extension (continuidade tipo Google Flow). */
export interface HandleVideoVeo {
  uri?: string;
  name?: string;
  mimeType?: string;
  videoBytes?: string;
}

export interface ResultadoVideoVeo {
  url: string;
  videoApi: HandleVideoVeo;
}

export interface FalhaVideoVeo {
  erro: string;
}

function mensagemErroVeo(erro: unknown): string {
  if (!erro) return 'Falha desconhecida na API Veo.';
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'string') return erro;
  try {
    const texto = JSON.stringify(erro);
    return texto.slice(0, 280);
  } catch {
    return String(erro);
  }
}

/** Objeto cru / URI do último clipe Veo desta sessão — a extensão REST exige o uri da API. */
let videoSdkParaExtensao: any = null;
let videoUriParaExtensao: string | null = null;

const MODELOS_VEO_EXTENSAO = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview'
];

const TRAVA_ELENCO_VEO = `CHARACTER CONTINUITY LOCK (mandatory): One lead adult character. Keep identical appearance in every shot and every extension: same face, same skin tone, same age, same hair COLOR, same hair LENGTH, same hair STYLE. If the hair starts as a short pixie, it MUST stay a short pixie — never switch to ponytail, bun, long hair, or a different cut. Same clothes unless the script explicitly shows a change. Do not swap actors or change look without narrative reason.`;

function descricaoGenero(roteiro: CenaRoteiroVideo[]): string {
  return roteiro[0]?.generoVoz === 'masculina'
    ? 'the same adult male Brazilian Portuguese speaking voice in every shot'
    : 'the same adult female Brazilian Portuguese speaking voice in every shot';
}

function linhaCena(cena: CenaRoteiroVideo, rotulo: string): string {
  const extra = cena.promptUsuario?.trim() ? ` Client note: ${cena.promptUsuario.trim()}` : '';
  return `${rotulo}: CAMERA ${cena.enquadramentoCamera}. ACTION: ${cena.acaoVisual}. Line: "${cena.falaAudio.replace(/["']/g, '')}".${extra}`;
}

function montarPromptVideoVeo(roteiro: CenaRoteiroVideo[], tituloCampanha: string, estilo = 'cinematográfico natural'): string {
  const genero = descricaoGenero(roteiro);
  const gancho = roteiro[0];
  const dor = roteiro[1] || roteiro[0];

  return `Animated or live-action (according to the selected style: ${estilo}) vertical 9:16 commercial PART 1 for "${tituloCampanha}". Duration 8 seconds. 720p.

This is ONLY the opening of a longer ad (Google Flow / scene-extension style). Do NOT deliver the WhatsApp/CTA yet. End on a living shot that can continue: same people, same location, camera still moving.

MUST include: adult characters, full environment, interaction and continuous visible subject motion. Use live-action for photographic styles; anime, pixel art or stop-motion must retain their chosen medium. No slideshow, no still image with zoom, no frozen subject.
MUST keep ${genero}. Spoken Brazilian Portuguese. Natural ambient sound.
${TRAVA_ELENCO_VEO}

Beats:
${gancho ? linhaCena(gancho, '0-4s HOOK') : ''}
${dor ? linhaCena(dor, '4-8s PAIN') : ''}

No readable on-screen text, no invented logos, no watermarks.`;
}

function montarPromptExtensaoVeo(
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  indiceExtensao: number
): string {
  const genero = descricaoGenero(roteiro);
  const cenasContinuacao = roteiro.slice(2);
  const cena = cenasContinuacao[Math.min(indiceExtensao, Math.max(cenasContinuacao.length - 1, 0))] || roteiro[roteiro.length - 1];
  const ehFinal = indiceExtensao >= Math.max(cenasContinuacao.length - 1, 0);

  return `SCENE EXTENSION of the existing Veo clip for "${tituloCampanha}". Continue from the LAST SECOND of the input video — same people, wardrobe, location, lighting and ${genero}. Seamless narrative, not a new commercial.
${TRAVA_ELENCO_VEO}
The lead character must look exactly as in the previous clip (hair, face, clothes). No sudden restyle.

Next action:
${cena ? linhaCena(cena, ehFinal ? 'FINAL CTA BEAT' : 'NEXT STORY BEAT') : ''}

${ehFinal
    ? 'This is the ENDING: character looks at camera, finishes the CTA, smiles and waves. Hold a resolved last frame. The ad must feel complete.'
    : 'Do not close the ad yet. End on a shot that can still continue.'}

No readable on-screen text, no invented logos.`;
}

function handleDeArquivoVeo(arquivoVideo: any): HandleVideoVeo {
  const interno = arquivoVideo?.video || arquivoVideo;
  const uri = interno?.uri || arquivoVideo?.uri;
  const handle: HandleVideoVeo = {
    uri,
    name: interno?.name || arquivoVideo?.name,
    mimeType: interno?.mimeType || arquivoVideo?.mimeType || 'video/mp4'
  };
  if (interno?.videoBytes || arquivoVideo?.videoBytes) {
    handle.videoBytes = interno?.videoBytes || arquivoVideo?.videoBytes;
  }
  return handle;
}

function candidatosVideoExtensao(origem: any, handle?: HandleVideoVeo): Array<{ uri?: string; videoBytes?: string }> {
  const uri = origem?.uri || handle?.uri;
  const videoBytes = handle?.videoBytes || origem?.videoBytes;
  // Nao enviar mimeType: o SDK @google/genai mapeia mimeType -> encoding e o Veo responde 400 INVALID_ARGUMENT.
  const lista: Array<{ uri?: string; videoBytes?: string }> = [];
  if (uri) lista.push({ uri });
  if (videoBytes) lista.push({ videoBytes });
  return lista;
}

async function executarGenerateVideos(
  prompt: string,
  notificarProgresso: ((etapa: string) => void) | undefined,
  videoAnterior?: HandleVideoVeo,
  forcarNovo = false
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return { erro: 'Chave Gemini ausente.' };

  const ai = new GoogleGenAI({ apiKey }) as any;
  if (typeof ai.models?.generateVideos !== 'function') {
    return { erro: 'O SDK @google/genai desta versão não expõe generateVideos.' };
  }

  if (forcarNovo) {
    videoSdkParaExtensao = null;
    videoUriParaExtensao = null;
  }
  const estender = !forcarNovo && Boolean(videoAnterior || videoSdkParaExtensao);
  const modelos = estender ? MODELOS_VEO_EXTENSAO : MODELOS_VEO;
  let ultimoErro: unknown = null;

  for (const modelo of modelos) {
    try {
      notificarProgresso?.(estender ? `Estendendo cena com ${modelo}…` : `Enviando prompt para ${modelo}…`);

      const videosLimpos = estender ? candidatosVideoExtensao(videoSdkParaExtensao, videoAnterior) : [];
      const tentativasPayload: Record<string, unknown>[] = estender && videosLimpos.length > 0
        ? videosLimpos.flatMap(videoLimpo => [
            { model: modelo, prompt, video: videoLimpo, config: { numberOfVideos: 1, resolution: '720p' } },
            { model: modelo, source: { prompt, video: videoLimpo }, config: { numberOfVideos: 1, resolution: '720p' } }
          ])
        : [
            {
              model: modelo,
              source: { prompt },
              config: { numberOfVideos: 1, aspectRatio: '9:16', durationSeconds: 8, resolution: '720p' }
            }
          ];

      let operation: any = null;
      let erroPayload: unknown = null;
      for (const payload of tentativasPayload) {
        try {
          const iniciada = await ai.models.generateVideos(payload);
          operation = await aguardarOperacaoVeo(ai, iniciada, notificarProgresso);
          erroPayload = null;
          break;
        } catch (erro) {
          erroPayload = erro;
          operation = null;
        }
      }
      if (!operation) throw erroPayload || new Error('generateVideos recusou o payload de extensão.');

      const gerados = operation.response?.generatedVideos || operation.response?.generateVideoResponse?.generatedSamples;
      const primeiro = gerados?.[0];
      const arquivoVideo = primeiro?.video || primeiro;
      const baixado = await baixarVideoGerado(arquivoVideo, apiKey);
      if (baixado?.url) {
        videoSdkParaExtensao = arquivoVideo;
        videoUriParaExtensao = handleDeArquivoVeo(arquivoVideo).uri || videoUriParaExtensao;
        const handle = handleDeArquivoVeo(arquivoVideo);
        if (baixado.videoBytes) handle.videoBytes = baixado.videoBytes;
        if (handle.uri) videoUriParaExtensao = handle.uri;
        notificarProgresso?.(estender ? 'História estendida.' : 'Vídeo pronto.');
        return { url: baixado.url, videoApi: handle };
      }
      throw new Error('A API concluiu, mas não devolveu o arquivo de vídeo.');
    } catch (erro) {
      ultimoErro = erro;
      const mensagem = mensagemErroVeo(erro);
      notificarProgresso?.(`Falha em ${modelo}: ${mensagem.slice(0, 180)}`);
      console.warn(`Falha ao gerar vídeo com ${modelo}:`, erro);
    }
  }

  return { erro: mensagemErroVeo(ultimoErro) };
}

async function blobParaBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binario = '';
  const fatia = 0x8000;
  for (let i = 0; i < bytes.length; i += fatia) {
    binario += String.fromCharCode(...bytes.subarray(i, i + fatia));
  }
  return btoa(binario);
}

async function baixarVideoGerado(video: any, apiKey: string): Promise<{ url: string; videoBytes?: string } | null> {
  if (video?.videoBytes) {
    if (typeof window !== 'undefined') {
      const binario = Uint8Array.from(atob(video.videoBytes), c => c.charCodeAt(0));
      return { url: URL.createObjectURL(new Blob([binario], { type: 'video/mp4' })), videoBytes: video.videoBytes };
    }
    return { url: `data:video/mp4;base64,${video.videoBytes}`, videoBytes: video.videoBytes };
  }

  const uri: string | undefined = video?.uri || video?.video?.uri;
  if (!uri) return null;

  const noBrowser = typeof window !== 'undefined';
  const url = noBrowser
    ? `/api/veo-download?uri=${encodeURIComponent(uri)}`
    : (uri.includes('key=') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`);

  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`Falha ao baixar o vídeo (${resposta.status})`);
  }
  const blob = await resposta.blob();
  if (blob.size < 1000) {
    throw new Error('O download do MP4 veio vazio ou inválido.');
  }
  const videoBytes = await blobParaBase64(blob);
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return { url: URL.createObjectURL(blob), videoBytes };
  }
  return { url: `data:video/mp4;base64,${videoBytes}`, videoBytes };
}

async function aguardarOperacaoVeo(
  ai: any,
  operation: any,
  notificarProgresso?: (etapa: string) => void
): Promise<any> {
  let tentativas = 0;
  const maxTentativas = 30;
  while (!operation?.done && tentativas < maxTentativas) {
    tentativas += 1;
    notificarProgresso?.(`Renderizando no Veo (${tentativas}/${maxTentativas})…`);
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.get({ operation });
  }
  if (!operation?.done) {
    throw new Error('A geração de vídeo excedeu o tempo de espera.');
  }
  if (operation?.error) {
    throw new Error(operation.error.message || JSON.stringify(operation.error));
  }
  return operation;
}

async function estenderViaPredictLongRunning(
  prompt: string,
  videoUri: string,
  notificarProgresso?: (etapa: string) => void
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return { erro: 'Chave Gemini ausente.' };

  let ultimoErro: unknown = null;

  for (const modelo of MODELOS_VEO_EXTENSAO) {
    try {
      notificarProgresso?.(`Estendendo cena com ${modelo}…`);
      const inicio = await fetch('/api/veo-extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, videoUri, modelo })
      });
      const jsonInicio = await inicio.json();
      if (!inicio.ok || jsonInicio.error) {
        throw new Error(jsonInicio.error?.message || JSON.stringify(jsonInicio.error || jsonInicio).slice(0, 280));
      }
      const nomeOp = jsonInicio.name;
      if (!nomeOp) throw new Error('A API não devolveu o nome da operação de extensão.');

      let tentativas = 0;
      const maxTentativas = 30;
      let status: any = jsonInicio;
      while (!status?.done && tentativas < maxTentativas) {
        tentativas += 1;
        notificarProgresso?.(`Renderizando extensão (${tentativas}/${maxTentativas})…`);
        await new Promise(resolve => setTimeout(resolve, 8000));
        const poll = await fetch(`/api/veo-operation?name=${encodeURIComponent(nomeOp)}`);
        status = await poll.json();
        if (!poll.ok && status.error) {
          throw new Error(status.error.message || JSON.stringify(status.error));
        }
      }
      if (!status?.done) throw new Error('A extensão de vídeo excedeu o tempo de espera.');
      if (status.error) throw new Error(status.error.message || JSON.stringify(status.error));

      const gerados = status.response?.generateVideoResponse?.generatedSamples
        || status.response?.generatedVideos;
      const arquivoVideo = gerados?.[0]?.video || gerados?.[0];
      const baixado = await baixarVideoGerado(arquivoVideo, apiKey);
      if (baixado?.url) {
        videoSdkParaExtensao = arquivoVideo;
        const handle = handleDeArquivoVeo(arquivoVideo);
        if (baixado.videoBytes) handle.videoBytes = baixado.videoBytes;
        if (handle.uri) videoUriParaExtensao = handle.uri;
        notificarProgresso?.('História estendida.');
        return { url: baixado.url, videoApi: handle };
      }
      throw new Error('A API concluiu a extensão, mas não devolveu o arquivo de vídeo.');
    } catch (erro) {
      ultimoErro = erro;
      notificarProgresso?.(`Falha em ${modelo}: ${mensagemErroVeo(erro).slice(0, 180)}`);
      console.warn(`Falha ao estender com ${modelo}:`, erro);
    }
  }

  return { erro: mensagemErroVeo(ultimoErro) };
}

export function ehFalhaVideoVeo(resultado: ResultadoVideoVeo | FalhaVideoVeo): resultado is FalhaVideoVeo {
  return 'erro' in resultado && !('url' in resultado);
}

export async function GERAR_VIDEO_VEO(
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  _imagemReferencia?: string,
  notificarProgresso?: (etapa: string) => void,
  estilo?: string
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  return executarGenerateVideos(
    montarPromptVideoVeo(roteiro, tituloCampanha, estilo),
    notificarProgresso,
    undefined,
    true
  );
}

export async function ESTENDER_VIDEO_VEO(
  videoAnterior: HandleVideoVeo,
  roteiro: CenaRoteiroVideo[],
  tituloCampanha: string,
  indiceExtensao: number,
  notificarProgresso?: (etapa: string) => void
): Promise<ResultadoVideoVeo | FalhaVideoVeo> {
  const uri = videoUriParaExtensao || videoAnterior?.uri || videoSdkParaExtensao?.uri;
  if (!uri) {
    return { erro: 'Não há URI do clipe Veo desta sessão. Clique em Gerar do zero, espere o MP4 e então Continuar história.' };
  }
  return estenderViaPredictLongRunning(
    montarPromptExtensaoVeo(roteiro, tituloCampanha, indiceExtensao),
    uri,
    notificarProgresso
  );
}


