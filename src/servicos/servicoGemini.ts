import { GoogleGenAI } from '@google/genai';
import { DiagnosticoCompleto, EscopoGeografico, CenaRoteiroVideo, MockCampanhaConteudo, PropostaCampanha } from '../tipos';

const REGRA_TOM_E_VOZ = `As cenas DEVEM variar de tom de narração e gênero de voz entre si (não repita o mesmo tom/gênero em todas as cenas), escolhendo para cada cena:
- "tomNarracao": um entre "calma", "agitada", "seria", "empolgante", "energetica" — coerente com o conteúdo daquela cena específica (ex: abertura pode ser "empolgante", a dor/problema pode ser "seria" ou "calma", a solução pode ser "energetica", o CTA pode ser "agitada").
- "generoVoz": um entre "masculina", "feminina" — pode variar entre cenas para dar dinamismo, ou manter consistência se fizer mais sentido para a narrativa.`;

const TONS_VALIDOS = ['calma', 'agitada', 'seria', 'empolgante', 'energetica'];
const GENEROS_VALIDOS = ['masculina', 'feminina'];

/** Garante que toda cena tenha tomNarracao/generoVoz válidos, mesmo se o Gemini omitir algum campo. */
function normalizarRoteiro(roteiro: any[]): CenaRoteiroVideo[] {
  return (roteiro || []).map((cena, idx) => ({
    ...cena,
    tomNarracao: TONS_VALIDOS.includes(cena.tomNarracao) ? cena.tomNarracao : TONS_VALIDOS[idx % TONS_VALIDOS.length],
    generoVoz: GENEROS_VALIDOS.includes(cena.generoVoz) ? cena.generoVoz : GENEROS_VALIDOS[idx % GENEROS_VALIDOS.length]
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
- Objetivo da Campanha: ${objetivo}

REGRAS RÍGIDAS DE GERAÇÃO:
1. O Roteiro de vídeo deve conter 4 cenas (0-3s Gancho, 4-8s Dor, 9-15s Solução, 16-22s CTA).
2. As falas ("falaAudio") DEVEM SER TOTALMENTE ESPECÍFICAS para o negócio "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}". NUNCA use modelos prontos ou genéricos!
3. Na última cena (CTA), escreva "Zap" ou "Whats" em vez de "WhatsApp" para que a pronúncia de áudio nativa soe perfeita em português.
4. O campo "promptImagem" DEVE ser em INGLÊS comercial focado em produtos do setor "${diagnostico.setor}".
5. ${REGRA_TOM_E_VOZ}${anexos && anexos.length > 0 ? `
6. Você recebeu ${anexos.length} arquivo(s) real(is) anexado(s) pelo cliente (catálogo, cardápio ou fotos do produto/local). ANALISE o conteúdo desses arquivos e use detalhes CONCRETOS observados neles (produtos específicos, preços, nomes, estilo visual, ambiente real) na copy, nas hashtags e principalmente no campo "promptImagem" — em vez de generalizações sobre o setor "${diagnostico.setor}". Priorize sempre o que você vê nos arquivos reais sobre suposições genéricas do setor.` : ''}

Retorne um JSON válido com o seguinte formato exato (sem marcadores de código markdown):
{
  "copy": "Texto persuasivo em português brasileiro com emojis e CTA claro",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "promptImagem": "Professional commercial product photography of ${diagnostico.setor}, studio lighting, 8k resolution",
  "roteiroVideo": [
    {
      "segundoInicio": 0,
      "segundoFim": 3,
      "acaoVisual": "Descrição visual do gancho de 0 a 3s para ${diagnostico.setor}",
      "falaAudio": "Fala marcante de abertura sobre ${diagnostico.setor}",
      "enquadramentoCamera": "Plano Médio Fechado (Vertical 9:16)",
      "dicaDirecao": "Fale com entusiasmo máximo",
      "tomNarracao": "empolgante",
      "generoVoz": "feminina"
    },
    {
      "segundoInicio": 4,
      "segundoFim": 8,
      "acaoVisual": "Descrição da dor de clientes em ${diagnostico.setor}",
      "falaAudio": "Pergunta sobre a dor em ${diagnostico.setor}",
      "enquadramentoCamera": "Plano Detalhe dinâmico",
      "dicaDirecao": "Expressão séria e empática",
      "tomNarracao": "seria",
      "generoVoz": "masculina"
    },
    {
      "segundoInicio": 9,
      "segundoFim": 15,
      "acaoVisual": "Diferencial da empresa ${diagnostico.nomeNegocio}",
      "falaAudio": "Apresentação da solução da ${diagnostico.nomeNegocio}",
      "enquadramentoCamera": "Plano Geral da ação",
      "dicaDirecao": "Sorria com confiança",
      "tomNarracao": "energetica",
      "generoVoz": "feminina"
    },
    {
      "segundoInicio": 16,
      "segundoFim": 22,
      "acaoVisual": "Chamada para ação no Whats",
      "falaAudio": "Clique no botão e fale no Zap com a equipe da ${diagnostico.nomeNegocio}",
      "enquadramentoCamera": "Plano Médio com CTA",
      "dicaDirecao": "Mantenha o botão em destaque",
      "tomNarracao": "agitada",
      "generoVoz": "masculina"
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
      roteiroVideo: normalizarRoteiro(parsed.roteiroVideo)
    };
  } catch (error) {
    console.warn("Aviso ao chamar API Gemini (fallback ativado):", error);
    return null;
  }
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
      config: { imageConfig: { aspectRatio: '9:16' } } as any
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
  escopo: EscopoGeografico
): Promise<{
  tendenciaPrincipal: string;
  volumeBuscaRelativo: string;
  casosDeSucessoAncorados: string[];
} | null> {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um analista de mercado e tendências digitais para o aplicativo GrowBiz V2.2.
Gere um sensoriamento de mercado 100% ESPECÍFICO para o negócio "${nomeNegocio}", setor "${setor}", abrangência geográfica "${escopo}".

REGRAS RÍGIDAS:
1. NUNCA use números ou casos genéricos e repetitivos — cada geração deve trazer percentuais e cenários plausíveis, mas DISTINTOS, coerentes com o setor e a abrangência informados.
2. Os "casos de sucesso" devem soar reais e específicos ao setor "${setor}" (linguagem, métricas e formato de campanha coerentes com esse tipo de negócio), sem citar a marca "${nomeNegocio}" diretamente (são casos de outros negócios do mesmo setor).

Retorne APENAS um JSON válido (sem marcadores de código markdown) no formato exato:
{
  "tendenciaPrincipal": "Frase curta sobre uma tendência de mercado atual específica para ${setor}",
  "volumeBuscaRelativo": "Frase curta sobre volume de busca/demanda local, com percentual plausível",
  "casosDeSucessoAncorados": ["Caso específico 1 para ${setor}", "Caso específico 2 para ${setor}", "Caso específico 3 para ${setor}"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);

    if (!parsed.tendenciaPrincipal || !Array.isArray(parsed.casosDeSucessoAncorados)) {
      return null;
    }

    return {
      tendenciaPrincipal: parsed.tendenciaPrincipal,
      volumeBuscaRelativo: parsed.volumeBuscaRelativo,
      casosDeSucessoAncorados: parsed.casosDeSucessoAncorados
    };
  } catch (error) {
    console.warn("Aviso ao gerar sensoriamento de mercado via Gemini (fallback ativado):", error);
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
1. O roteiro deve conter exatamente 4 cenas (0-3s, 4-8s, 9-15s, 16-22s).
2. As falas ("falaAudio") DEVEM SER TOTALMENTE ESPECÍFICAS para "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}" — nunca genéricas.
3. Na última cena (CTA), escreva "Zap" ou "Whats" em vez de "WhatsApp" para a pronúncia de áudio nativa soar perfeita em português.
4. Aplique o estilo solicitado principalmente em "acaoVisual", "enquadramentoCamera" e "dicaDirecao" — mas sem perder a mensagem comercial do negócio.
5. ${REGRA_TOM_E_VOZ} Escolha tons coerentes com o estilo "${nomeCategoria}" (ex: um estilo "Cinematográfico" tende a "seria"/"calma"; um estilo "Dinâmico" ou "Anime" tende a "energetica"/"empolgante").

Retorne APENAS um JSON válido (sem marcadores de código markdown) no formato exato:
{
  "roteiroVideo": [
    { "segundoInicio": 0, "segundoFim": 3, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "empolgante", "generoVoz": "feminina" },
    { "segundoInicio": 4, "segundoFim": 8, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "seria", "generoVoz": "masculina" },
    { "segundoInicio": 9, "segundoFim": 15, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "energetica", "generoVoz": "feminina" },
    { "segundoInicio": 16, "segundoFim": 22, "acaoVisual": "...", "falaAudio": "...", "enquadramentoCamera": "...", "dicaDirecao": "...", "tomNarracao": "agitada", "generoVoz": "masculina" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
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
- Campanha-base já validada: ${campanha.tituloCampanha} (objetivo: ${campanha.objetivoPrincipal})

REGRAS RÍGIDAS:
1. Cada proposta usa uma plataforma diferente, escolhida entre: "Instagram Reels", "TikTok", "Instagram Feed", "WhatsApp Status", "Google Meu Negócio".
2. "titulo" deve ser curto (até 6 palavras) e específico ao formato (ex: "Carrossel — Prova Social", "Vídeo — Bastidores").
3. "descricao" deve ser 1-2 frases explicando a estratégia criativa, específica para "${diagnostico.nomeNegocio}" do setor "${diagnostico.setor}".
4. "aderenciaPercentual" é um número entre 60 e 98, DIFERENTE em cada proposta, refletindo o quanto essa proposta combina com o perfil do negócio.

Retorne APENAS um JSON válido (sem marcadores de código markdown) no formato exato:
{
  "propostas": [
    { "plataforma": "Instagram Reels", "titulo": "...", "descricao": "...", "aderenciaPercentual": 92 },
    { "plataforma": "TikTok", "titulo": "...", "descricao": "...", "aderenciaPercentual": 85 },
    { "plataforma": "Google Meu Negócio", "titulo": "...", "descricao": "...", "aderenciaPercentual": 78 }
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
      id: `prop_${Date.now()}_${idx}`,
      plataforma: PLATAFORMAS_VALIDAS.includes(p.plataforma) ? p.plataforma : 'Instagram Reels',
      titulo: p.titulo || 'Proposta de Campanha',
      descricao: p.descricao || '',
      aderenciaPercentual: typeof p.aderenciaPercentual === 'number' ? p.aderenciaPercentual : 75
    }));
  } catch (error) {
    console.warn("Aviso ao gerar propostas de campanha via Gemini (fallback ativado):", error);
    return null;
  }
}
