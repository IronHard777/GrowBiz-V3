import { GoogleGenAI } from '@google/genai';
import { obterChaveGemini, temChaveGemini } from './chaveGemini.js';

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
const PLATAFORMAS_VALIDAS = ['Instagram Reels', 'TikTok', 'Instagram Feed', 'WhatsApp Status', 'Google Meu Negócio'];

function normalizarRoteiro(roteiro) {
  const lista = roteiro || [];
  const generoUnico = GENEROS_VALIDOS.includes(lista[0]?.generoVoz) ? lista[0].generoVoz : 'feminina';
  return lista.map((cena, idx) => ({
    ...cena,
    promptUsuario: typeof cena.promptUsuario === 'string' ? cena.promptUsuario : '',
    tomNarracao: TONS_VALIDOS.includes(cena.tomNarracao) ? cena.tomNarracao : TONS_VALIDOS[idx % TONS_VALIDOS.length],
    generoVoz: generoUnico
  }));
}

export function validarEstrategiasGemini(valor) {
  const e = valor;
  const texto = (v) => typeof v === 'string' && v.trim().length > 0;
  return !!e && [e.estrategiaBase?.titulo, e.estrategiaBase?.descricao,
    e.estrategiaOportunidade?.titulo, e.estrategiaOportunidade?.planoAtaqueImediato,
    e.estrategiaOportunidade?.gatilhoTendencia, e.estrategiaComplementar?.titulo,
    e.estrategiaComplementar?.jornadaForaRedes?.googleMeuNegocio,
    e.estrategiaComplementar?.jornadaForaRedes?.whatsappEstrategico,
    e.estrategiaComplementar?.jornadaForaRedes?.deliveryOuPresencial].every(texto)
    && Array.isArray(e.estrategiaBase?.pilaresAtemporais)
    && e.estrategiaBase.pilaresAtemporais.length > 0 && e.estrategiaBase.pilaresAtemporais.every(texto);
}

function clienteAi() {
  const apiKey = obterChaveGemini();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function statusIa() {
  return { configured: temChaveGemini() };
}

export async function gerarCopyPersuasiva(diagnostico, objetivo, anexos) {
  const ai = clienteAi();
  if (!ai) return null;

  try {
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
4. O campo "promptImagem" DEVE ser em INGLÊS comercial focado no produto OU serviço real do setor "${diagnostico.setor}" e DEVE descrever um fundo visual limpo, sem texto incorporado. NUNCA peça ou gere título, CTA, legenda, banner com palavras, logotipo como texto, marca d'água ou qualquer outra escrita na imagem; o aplicativo adiciona o título e a CTA como overlay depois.
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
  "promptImagem": "Professional commercial product photography of ${diagnostico.setor}, studio lighting, 8k resolution, clean text-free background, no typography, no readable writing, no logos, no watermarks, no captions, no banners",
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

    const partes = [{ text: prompt }];
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
      estrategias: validarEstrategiasGemini(parsed.estrategias) ? parsed.estrategias : undefined
    };
  } catch (error) {
    console.warn('Aviso ao chamar API Gemini (fallback ativado):', error);
    return null;
  }
}

export async function gerarImagemImagen3(prompt, aspectRatio = '9:16') {
  const ai = clienteAi();
  if (!ai) return null;
  const ratioPermitido = ['1:1', '4:5', '16:9', '9:16'].includes(aspectRatio) ? aspectRatio : '9:16';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio: ratioPermitido }, httpOptions: { timeout: 90000 } }
    });
    const partes = response.candidates?.[0]?.content?.parts || [];
    const parteImagem = partes.find((p) => p.inlineData?.data);
    if (parteImagem?.inlineData) {
      const mimeType = parteImagem.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${parteImagem.inlineData.data}`;
    }
  } catch (error) {
    console.warn('Aviso ao gerar imagem com Gemini (fallback ativado):', error);
  }
  return null;
}

export async function gerarSensoriamentoMercado(setor, nomeNegocio, escopo, contexto) {
  const ai = clienteAi();
  if (!ai) return null;
  try {
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
    const fontes = (metadata?.groundingChunks || []).flatMap((chunk) => {
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

export async function gerarRoteiroVideoComEstilo(diagnostico, campanha, nomeCategoria, modificadorEstilo) {
  const ai = clienteAi();
  if (!ai) return null;
  try {
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
      config: { httpOptions: { timeout: 60000 }, responseMimeType: 'application/json' }
    });
    const texto = response.text || '';
    const limpo = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(limpo);
    if (!Array.isArray(parsed.roteiroVideo) || parsed.roteiroVideo.length === 0) return null;
    return normalizarRoteiro(parsed.roteiroVideo);
  } catch (error) {
    console.warn('Aviso ao regenerar roteiro de vídeo com estilo via Gemini:', error);
    return null;
  }
}

export async function gerarPropostasCampanha(diagnostico, campanha) {
  const ai = clienteAi();
  if (!ai) return null;
  try {
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
    return parsed.propostas.map((p, idx) => ({
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
    console.warn('Aviso ao gerar propostas de campanha via Gemini (fallback ativado):', error);
    return null;
  }
}

export async function categorizarRespostasOutros(itens) {
  const ai = clienteAi();
  if (!ai || !itens || itens.length === 0) return null;
  try {
    const blocoPerguntas = itens.map(({ pergunta, textoOutros }) => {
      const opcoes = pergunta.opcoes
        .filter((o) => !o.eOutros)
        .map((o) => `- valor="${o.valor}" | X=${o.pontuacaoX} | Y=${o.pontuacaoY} | ${o.rotulo}`)
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
    if (!Array.isArray(parsed.classificacoes) || parsed.classificacoes.length === 0) return null;

    const resultado = {};
    for (const item of parsed.classificacoes) {
      const perguntaId = Number(item.perguntaId);
      const pergunta = itens.find((i) => i.pergunta.id === perguntaId)?.pergunta;
      if (!pergunta) continue;
      const opcoesValidas = pergunta.opcoes.filter((o) => !o.eOutros).map((o) => o.valor);
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

export async function despacharAcao(action, body) {
  switch (action) {
    case 'status':
      return statusIa();
    case 'copy':
      return gerarCopyPersuasiva(body.diagnostico, body.objetivo, body.anexos);
    case 'imagem':
      return { imagem: await gerarImagemImagen3(body.prompt, body.aspectRatio) };
    case 'sensoriamento':
      return gerarSensoriamentoMercado(body.setor, body.nomeNegocio, body.escopo, body.contexto);
    case 'roteiro':
      return { roteiroVideo: await gerarRoteiroVideoComEstilo(body.diagnostico, body.campanha, body.nomeCategoria, body.modificadorEstilo) };
    case 'propostas':
      return { propostas: await gerarPropostasCampanha(body.diagnostico, body.campanha) };
    case 'categorizar':
      return { classificacoes: await categorizarRespostasOutros(body.itens) };
    default:
      return { erro: 'acao desconhecida' };
  }
}
