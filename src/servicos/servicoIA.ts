import {
  DiagnosticoCompleto,
  EstrategiaCrescimento,
  MockCampanhaConteudo,
  KPIsPerformance,
  AlertaPivotagem,
  ResultadoCompletoConsultoria,
  PropostaCampanha
} from '../tipos';
import { IDENTIFICAR_CATEGORIA_VISUAL, OBTER_DEFINICAO_CATEGORIA_VISUAL } from './servicoCategoriasVisuais';

/**
 * Serviço de Inteligência Artificial e Gerador de Mocks Visuais de Sucesso (GrowBiz V2.2)
 */

export function GERAR_ESTRATEGIA_TRIPLA(diagnostico: DiagnosticoCompleto): EstrategiaCrescimento {
  const eDecisaoRapida = diagnostico.tipoDecisaoCalculado === 'RAPIDA';
  const setor = diagnostico.setor;
  const nome = diagnostico.nomeNegocio;

  return {
    estrategiaBase: {
      titulo: `Pilares Atemporais de Posicionamento para ${setor}`,
      pilaresAtemporais: [
        `Proposição de Valor Clara: Otimização da mensagem central focada na principal dor de ${setor}.`,
        `Prova Social Consistente: Exibição sistemática de depoimentos reais e casos de sucesso.`,
        `Consistência Multicanal: Alinhamento visual e de tom de voz no Instagram, Google e WhatsApp.`
      ],
      descricao: `Estratégia sólida de marca (Branding) projetada para manter ${nome} como referência permanente no mercado de ${setor}, independente das oscilações de algoritmos.`
    },
    estrategiaOportunidade: {
      titulo: `Plano de Ataque Imediato (Aproveitamento de Tendência)`,
      planoAtaqueImediato: eDecisaoRapida
        ? `Campanha 'Oportunidade Impossível de Ignorar': Oferta relâmpago de alta velocidade para o produto/serviço destaque com gatilho de escassez (válido por 48h).`
        : `Campanha 'Diagnóstico Estratégico em 3 Passos': Anúncio focado na dor latente de clientes em busca de segurança em ${setor}, oferecendo consulta sem compromisso.`,
      gatilhoTendencia: diagnostico.sensoriamento.tendenciaPrincipal
    },
    estrategiaComplementar: {
      titulo: `Jornada Omnichannel Fora das Redes Sociais`,
      jornadaForaRedes: {
        googleMeuNegocio: `Otimização do perfil no Google Maps com fotos em alta definição, catálogo atualizado e automação para solicitar avaliações 5 estrelas após o atendimento.`,
        whatsappEstrategico: `Funil de atendimento humanizado no WhatsApp Business com etiquetagem de leads, script de alta conversão e mensagens proativas de reativação a cada 15 dias.`,
        deliveryOuPresencial: diagnostico.modeloOperacional === 'Online'
          ? `Página de vendas ultra rápida com checkout simplificado e Pixel de conversão ativado.`
          : `Experiência do cliente impecável no ponto físico, com QR Code para cadastro VIP no balcão e oferta do próximo retorno.`
      }
    }
  };
}

export function GERAR_MOCK_CAMPANHA_MODULO_3(diagnostico: DiagnosticoCompleto): MockCampanhaConteudo {
  const eDecisaoRapida = diagnostico.tipoDecisaoCalculado === 'RAPIDA';
  const setor = diagnostico.setor;
  const nome = diagnostico.nomeNegocio;

  const tituloCampanha = eDecisaoRapida
    ? `Campanha Giro Rápido: O Destaque da Semana em ${setor}`
    : `Campanha Autoridade Suprema: A Solução Definitiva para ${setor}`;

  const copyPersuasiva = eDecisaoRapida
    ? `🔥 Você não precisa mais aceitar o segundo melhor em ${setor}. Se você valoriza qualidade e rapidez, a ${nome} preparou algo especial esta semana!\n\n✨ Ganhe atendimento prioritário e garanta condições exclusivas para as primeiras 20 pessoas hoje mesmo.\n\n👇 Toque no botão 'Saiba Mais' e garanta o seu antes que encerre!`
    : `💡 Procurando segurança e resultados comprovados em ${setor}? A maioria dos profissionais comete o erro de focar no sintoma, não na causa raiz.\n\nNa ${nome}, aplicamos uma metodologia comprovada por dezenas de clientes para resolver este problema definitivamente.\n\n📅 Agende seu diagnóstico estratégico exclusivo agora mesmo link na bio.`;

  const hashtagsEstrategicas = [
    `#${setor.replace(/\s+/g, '')}`,
    `#${nome.replace(/\s+/g, '')}`,
    `#CrescimentoDeNegocios`,
    `#Estrategia2026`,
    `#LetsGrow`,
    `#SucessoGarantido`
  ];

  // Categorização visual centralizada (mesma fonte usada pela imagem estática, pelo fallback de
  // geração de imagem e pelo player de vídeo — evita buckets divergentes entre componentes)
  const categoriaVisual = IDENTIFICAR_CATEGORIA_VISUAL(setor, nome);
  const definicaoVisual = OBTER_DEFINICAO_CATEGORIA_VISUAL(categoriaVisual);
  const promptImagemIa = definicaoVisual.promptInglesImagem;
  const imagemUrlPlaceholder = definicaoVisual.imagemCuradaUrl;

  // Roteiro dinâmico e customizado por setor de negócio
  const roteiroVideo = [
    {
      segundoInicio: 0,
      segundoFim: 3,
      acaoVisual: `Gancho Visual (0-3s): Apresentação de destaque com o produto/serviço da ${nome} em movimento dinâmico.`,
      falaAudio: `Atenção se você procura a melhor experiência em ${setor} na sua região!`,
      enquadramentoCamera: "Plano Médio Fechado (Vertical 9:16)",
      dicaDirecao: `Mostre energia máxima nos primeiros 3 segundos destacando a marca ${nome}.`,
      tomNarracao: 'empolgante' as const,
      generoVoz: 'feminina' as const
    },
    {
      segundoInicio: 4,
      segundoFim: 8,
      acaoVisual: `Problema/Dor Latente (4-8s): B-Roll rápido mostrando o grande desafio de clientes ao contratar ${setor}.`,
      falaAudio: `Cansado de não encontrar a qualidade e agilidade que a sua empresa realmente merece?`,
      enquadramentoCamera: "Plano Detalhe / B-Roll dinâmico",
      dicaDirecao: "Use expressão empática mostrando que entende a dor do cliente.",
      tomNarracao: 'seria' as const,
      generoVoz: 'masculina' as const
    },
    {
      segundoInicio: 9,
      segundoFim: 15,
      acaoVisual: `Diferencial Exclusivo (9-15s): Cenas em câmera lenta da equipe da ${nome} entregando o resultado final.`,
      falaAudio: `Na ${nome}, nós criamos um padrão exclusivo focado em excelência para você ter o melhor resultado sem complicações.`,
      enquadramentoCamera: "Plano Geral da empresa em ação",
      dicaDirecao: "Sorria com confiança mostrando os diferenciais do serviço.",
      tomNarracao: 'energetica' as const,
      generoVoz: 'feminina' as const
    },
    {
      segundoInicio: 16,
      segundoFim: 22,
      acaoVisual: `Chamada para Ação / CTA Final (16-22s): Indicar o botão de contato na tela.`,
      falaAudio: `Clique no botão aqui embaixo e fale agora mesmo com o nosso time no Zap!`,
      enquadramentoCamera: "Plano Médio com texto sobreposto (CTA)",
      dicaDirecao: "Mantenha o link de contato visível até o encerramento do vídeo.",
      tomNarracao: 'agitada' as const,
      generoVoz: 'masculina' as const
    }
  ];

  return {
    id: `camp_${Date.now()}`,
    tituloCampanha,
    objetivoPrincipal: eDecisaoRapida ? 'Giro Rápido e Vendas Imediatas' : 'Autoridade e Atração de Leads Qualificados',
    copyPersuasiva,
    hashtagsEstrategicas,
    imagemUrlPlaceholder,
    promptImagemIa,
    roteiroVideo,
    canalIdeal: 'Instagram Reels / TikTok / WhatsApp Status',
    chamadaParaAcao: eDecisaoRapida ? 'Garantir Oferta Agora' : 'Agendar Diagnóstico Sem Custo'
  };
}

/** Fallback local (sem IA) para a tela de Propostas de Campanha — usado se o Gemini não estiver configurado. */
export function GERAR_PROPOSTAS_CAMPANHA_FALLBACK(diagnostico: DiagnosticoCompleto): PropostaCampanha[] {
  const setor = diagnostico.setor;
  return [
    {
      id: `prop_${Date.now()}_0`,
      plataforma: 'Instagram Reels',
      titulo: 'Carrossel — Prova Social',
      descricao: `Depoimentos de clientes reais de ${setor} combinados com antes/depois, foco total em conversão.`,
      aderenciaPercentual: 92
    },
    {
      id: `prop_${Date.now()}_1`,
      plataforma: 'TikTok',
      titulo: 'Vídeo — Bastidores',
      descricao: `Formato vertical curto mostrando o dia a dia de ${diagnostico.nomeNegocio}, tom autêntico e descontraído.`,
      aderenciaPercentual: 85
    },
    {
      id: `prop_${Date.now()}_2`,
      plataforma: 'Google Meu Negócio',
      titulo: 'Anúncio — Remarketing Local',
      descricao: `Reengaja clientes que já pesquisaram por ${setor} na região com uma oferta segmentada.`,
      aderenciaPercentual: 78
    }
  ];
}

export function GERAR_PERFORMANCE_E_ALERTA(diagnostico: DiagnosticoCompleto): {
  kpis: KPIsPerformance;
  alerta: AlertaPivotagem;
} {
  return {
    kpis: {
      taxaCliqueCTR: 5.4,
      taxaConversao: 14.2,
      retornoSobreInvestimentoROI: "4.2x",
      custoPorAdquisicaoCPA: "R$ 12,80"
    },
    alerta: {
      ativo: true,
      mensagem: "Sensoriamento de Tendências identificou ligeiro decaimento na efetividade do anúncio genérico no final de semana.",
      tendenciaAtual: "Busca por ofertas no formato Roteiro em Vídeo com prova social cresceu +29%.",
      acaoRecomendada: "Pivotar orçamento da imagem estática para impulsionar o Roteiro de Vídeo com foco no WhatsApp."
    }
  };
}

import {
  GERAR_COPY_PERSUASIVA_GEMINI,
  GERAR_SENSORIAMENTO_MERCADO_GEMINI,
  TEM_CHAVE_GEMINI_CONFIGURADA
} from './servicoGemini';
import {
  SALVAR_RESULTADO_CONSULTORIA_PERSISTENCIA
} from './servicoPersistencia';

/**
 * Função Mestra que executa o pipeline completo de Inteligência Artificial do GrowBiz V2.2
 */
export async function SIMULAR_PROCESSAMENTO_COMPLETO_IA(
  diagnostico: DiagnosticoCompleto,
  notificarProgresso?: (etapa: string, percentual: number) => void
): Promise<ResultadoCompletoConsultoria> {
  const temGeminiReal = TEM_CHAVE_GEMINI_CONFIGURADA();

  const etapas = [
    { nome: "Processando respostas do Filtro de 7 Perguntas...", pct: 15 },
    { nome: "Iniciando Sensoriamento de Mercado Local e Concorrentes...", pct: 35 },
    { nome: "Aplicando Matriz de Decisão (Decisão Rápida vs. Elaborada)...", pct: 55 },
    { nome: temGeminiReal ? "Consultando API do Google Gemini (gemini-2.5-flash)..." : "Ancorando estratégias em Casos de Sucesso comprovados...", pct: 75 },
    { nome: "Gerando Mocks de Criativos: Imagem, Copy e Roteiro de Vídeo...", pct: 90 },
    { nome: "Estratégia Tripla e Dashboard de Performance Prontos!", pct: 100 }
  ];

  for (const step of etapas) {
    if (notificarProgresso) {
      notificarProgresso(step.nome, step.pct);
    }
    // Delay dinâmico para simular o processamento da IA
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Tenta enriquecer o Sensoriamento de Mercado com IA real antes de gerar estratégia/campanha,
  // já que "casosDeSucessoAncorados" e "tendenciaPrincipal" alimentam a Estratégia de Oportunidade
  // e o cabeçalho de resultados — o fallback local sempre repetia os mesmos números fixos.
  let diagnosticoEnriquecido = diagnostico;
  if (temGeminiReal) {
    const sensoriamentoIa = await GERAR_SENSORIAMENTO_MERCADO_GEMINI(
      diagnostico.setor,
      diagnostico.nomeNegocio,
      diagnostico.escopoGeografico
    );
    if (sensoriamentoIa) {
      diagnosticoEnriquecido = {
        ...diagnostico,
        sensoriamento: { ...diagnostico.sensoriamento, ...sensoriamentoIa }
      };
    }
  }

  const estrategias = GERAR_ESTRATEGIA_TRIPLA(diagnosticoEnriquecido);
  const campanhaMock = GERAR_MOCK_CAMPANHA_MODULO_3(diagnosticoEnriquecido);

  // Tenta enriquecer com IA real do Gemini se a chave estiver configurada
  if (temGeminiReal) {
    const geminiRes = await GERAR_COPY_PERSUASIVA_GEMINI(diagnosticoEnriquecido, campanhaMock.objetivoPrincipal);
    if (geminiRes) {
      campanhaMock.copyPersuasiva = geminiRes.copy;
      campanhaMock.hashtagsEstrategicas = geminiRes.hashtags;
      campanhaMock.promptImagemIa = geminiRes.promptImagem;
      if (geminiRes.roteiroVideo && geminiRes.roteiroVideo.length > 0) {
        campanhaMock.roteiroVideo = geminiRes.roteiroVideo;
      }
    }
  }

  const { kpis, alerta } = GERAR_PERFORMANCE_E_ALERTA(diagnosticoEnriquecido);

  const resultadoCompleto: ResultadoCompletoConsultoria = {
    diagnostico: diagnosticoEnriquecido,
    estrategias,
    campanhaMock,
    kpisSimulados: kpis,
    alertaPivotagem: alerta
  };

  // Salva no repositório de persistência do blueprint
  SALVAR_RESULTADO_CONSULTORIA_PERSISTENCIA(resultadoCompleto);

  return resultadoCompleto;
}

