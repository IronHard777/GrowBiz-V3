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
  const quadrante = diagnostico.categoriaModelo?.quadrante ?? (diagnostico.tipoDecisaoCalculado === 'RAPIDA' ? 3 : 4);
  const setor = diagnostico.setor;
  const nome = diagnostico.nomeNegocio;
  const categoria = diagnostico.categoriaModelo?.categoria || 'Modelo em classificação';
  const estrategiaQuadrante = diagnostico.categoriaModelo?.estrategia || diagnostico.justificativaMatriz;

  const planoPorQuadrante: Record<number, string> = {
    1: `Campanha de autoridade para ${nome}: webinar/nutrição de leads e reunião de fechamento para ofertas high-ticket em ${setor}.`,
    2: `Campanha de tráfego direto para página de vendas de ${nome}, com remarketing agressivo e conversão imediata em ${setor}.`,
    3: `Campanha geo-localizada (raio 3–5 km) para ${nome}: Google Meu Negócio, promoção do dia e WhatsApp Business em ${setor}.`,
    4: `Campanha de fundo de funil (Google Search de alta intenção) para ${nome}, prova social local e agendamento direto em ${setor}.`
  };

  return {
    estrategiaBase: {
      titulo: `Hipótese de presença — ${categoria}`,
      pilaresAtemporais: [
        `Posicionamento no quadrante ${quadrante}: ${estrategiaQuadrante}`,
        `Prova Social Consistente: Exibição sistemática de depoimentos reais e casos de sucesso em ${setor}.`,
        `Consistência Multicanal: Alinhamento visual e de tom de voz nos canais do quadrante ${quadrante}.`
      ],
      descricao: `Hipótese local para ${nome} no perfil "${categoria}". Este plano padrão ainda precisa de validação; não foi derivado de um caso comprovado.`
    },
    estrategiaOportunidade: {
      titulo: `Hipótese de campanha (${estrategiaQuadrante})`,
      planoAtaqueImediato: planoPorQuadrante[quadrante],
      gatilhoTendencia: diagnostico.sensoriamento.tendenciaPrincipal
    },
    estrategiaComplementar: {
      titulo: `Hipóteses fora das redes sociais`,
      jornadaForaRedes: {
        googleMeuNegocio: quadrante === 3 || quadrante === 4
          ? `Atualizar Google Maps/Search com fotos e serviços; solicitar avaliações honestas após o atendimento.`
          : `Presença no Google como suporte de autoridade, com prova social e páginas de destino alinhadas ao funil digital.`,
        whatsappEstrategico: quadrante === 1
          ? `Qualificação de leads no WhatsApp com roteiro consultivo e agendamento de reunião de fechamento.`
          : `Funil humanizado no WhatsApp Business com etiquetagem, script de conversão e reativação da base.`,
        deliveryOuPresencial: diagnostico.modeloOperacional === 'Online' || quadrante === 2
          ? `Página de vendas ultra rápida com checkout simplificado e Pixel de conversão ativado.`
          : `Experiência no ponto físico com QR Code para cadastro VIP e oferta de retorno.`
      }
    }
  };
}

export function GERAR_MOCK_CAMPANHA_MODULO_3(diagnostico: DiagnosticoCompleto): MockCampanhaConteudo {
  const quadrante = diagnostico.categoriaModelo?.quadrante ?? (diagnostico.tipoDecisaoCalculado === 'RAPIDA' ? 3 : 4);
  const giroRapido = quadrante === 2 || quadrante === 3;
  const setor = diagnostico.setor;
  const nome = diagnostico.nomeNegocio;
  const categoria = diagnostico.categoriaModelo?.categoria || setor;

  const tituloPorQuadrante: Record<number, string> = {
    1: `Campanha Autoridade High-Ticket: ${categoria}`,
    2: `Campanha Giro Digital: Conversão Imediata em ${setor}`,
    3: `Campanha Local: Oferta da Semana em ${setor}`,
    4: `Campanha Intenção + Agenda: ${nome} em ${setor}`
  };

  const tituloCampanha = tituloPorQuadrante[quadrante];

  const copyPersuasiva = giroRapido
    ? `🔥 Você não precisa mais aceitar o segundo melhor em ${setor}. Se você valoriza qualidade e rapidez, a ${nome} preparou algo especial esta semana!\n\n✨ Conheça nosso atendimento e consulte as opções disponíveis para você.\n\n👇 Toque no botão 'Saiba Mais' e converse com nossa equipe!`
    : `💡 Procurando segurança e resultados comprovados em ${setor}? A maioria dos profissionais comete o erro de focar no sintoma, não na causa raiz.\n\nNa ${nome}, oferecemos atendimento para entender sua necessidade e apresentar as opções adequadas.\n\n📅 Agende seu diagnóstico estratégico exclusivo agora mesmo link na bio.`;

  const hashtagsEstrategicas = [
    `#${setor.replace(/\s+/g, '')}`,
    `#${nome.replace(/\s+/g, '')}`,
    `#CrescimentoDeNegocios`,
    `#Estrategia2026`,
    `#LetsGrow`,
    `#ConhecaNossoTrabalho`
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
      segundoFim: 4,
      acaoVisual: `Gancho: a MESMA protagonista (cabelo e roupa fixos) entra no espaço da ${nome}; plano geral e close no rosto; outras pessoas ao fundo.`,
      falaAudio: `Atenção se você procura a melhor experiência em ${setor} na sua região!`,
      enquadramentoCamera: "Plano Médio Fechado (Vertical 9:16)",
      dicaDirecao: `Mostre energia máxima nos primeiros 3 segundos destacando a marca ${nome}.`,
      tomNarracao: 'empolgante' as const,
      generoVoz: 'feminina' as const
    },
    {
      segundoInicio: 4,
      segundoFim: 8,
      acaoVisual: `Dor: a MESMA protagonista da cena 1 (mesmo cabelo e roupa), close no rosto; corte para o cotidiano; over-the-shoulder.`,
      falaAudio: `Cansado de não encontrar a qualidade e agilidade que a sua empresa realmente merece?`,
      enquadramentoCamera: "Plano Detalhe / B-Roll dinâmico",
      dicaDirecao: "Use expressão empática mostrando que entende a dor do cliente.",
      tomNarracao: 'seria' as const,
      generoVoz: 'feminina' as const
    },
    {
      segundoInicio: 8,
      segundoFim: 16,
      acaoVisual: `Solução: a MESMA protagonista da cena 1 é atendida pela equipe da ${nome}; entrega com as mãos; mesma roupa e cabelo; câmera orbitando.`,
      falaAudio: `Na ${nome}, nós criamos um padrão exclusivo focado em excelência para você ter o melhor resultado sem complicações.`,
      enquadramentoCamera: "Plano Geral da empresa em ação",
      dicaDirecao: "Sorria com confiança mostrando os diferenciais do serviço.",
      tomNarracao: 'energetica' as const,
      generoVoz: 'feminina' as const
    },
    {
      segundoInicio: 16,
      segundoFim: 22,
      acaoVisual: `CTA: a MESMA protagonista olha para a câmera, aponta o celular; equipe acena; corte para o balcão da ${nome}; aparência inalterada.`,
      falaAudio: `Clique no botão aqui embaixo e fale agora mesmo com o nosso time no Zap!`,
      enquadramentoCamera: "Plano Médio com texto sobreposto (CTA)",
      dicaDirecao: "Mantenha o link de contato visível até o encerramento do vídeo.",
      tomNarracao: 'agitada' as const,
      generoVoz: 'feminina' as const
    }
  ];

  return {
    id: `camp_${Date.now()}`,
    tituloCampanha,
    objetivoPrincipal: diagnostico.categoriaModelo?.estrategia || (giroRapido ? 'Giro Rápido e Vendas Imediatas' : 'Autoridade e Atração de Leads Qualificados'),
    copyPersuasiva,
    hashtagsEstrategicas,
    imagemUrlPlaceholder,
    promptImagemIa,
    roteiroVideo,
    canalIdeal: 'Instagram Reels / TikTok / WhatsApp Status',
    chamadaParaAcao: giroRapido ? 'Garantir Oferta Agora' : 'Agendar Diagnóstico Sem Custo'
  };
}

/** Fallback local (sem IA) para a tela de Propostas de Campanha — usado se o Gemini não estiver configurado. */
export function GERAR_PROPOSTAS_CAMPANHA_FALLBACK(diagnostico: DiagnosticoCompleto): PropostaCampanha[] {
  const setor = diagnostico.setor;
  const nome = diagnostico.nomeNegocio;
  const cidade = diagnostico.cidade?.trim();
  const local = cidade ? ` em ${cidade}` : '';
  return [
    {
      id: `prop_${Date.now()}_0`,
      plataforma: 'Instagram Reels',
      titulo: `${nome}: prova social em Reels`,
      descricao: `Depoimentos e antes/depois de clientes de ${setor}${local}, com foco em conversão.`,
      aderenciaPercentual: 92,
      copy: `Você ainda está em dúvida sobre ${setor}?

No ${nome}${local}, quem já passou por aqui conta o resultado de verdade.\n\n👉 Salva este Reels e chama no WhatsApp para garantir seu horário.`,
      hashtags: ['#GrowBiz', `#${setor.replace(/\s+/g, '')}`, '#ProvaSocial', '#Reels'],
      chamadaParaAcao: 'Chamar no WhatsApp agora'
    },
    {
      id: `prop_${Date.now()}_1`,
      plataforma: 'TikTok',
      titulo: `${nome}: bastidores no TikTok`,
      descricao: `Formato vertical curto do dia a dia de ${nome}, tom autêntico.`,
      aderenciaPercentual: 85,
      copy: `Um dia no ${nome} ✨\n\nBastidores reais de ${setor}${local}.\n\nSegue pra ver a rotina e as novidades da semana.`,
      hashtags: ['#GrowBiz', '#TikTok', `#${nome.replace(/\s+/g, '')}`, '#Bastidores'],
      chamadaParaAcao: 'Seguir e comentar “EU QUERO”'
    },
    {
      id: `prop_${Date.now()}_2`,
      plataforma: 'Google Meu Negócio',
      titulo: `${nome}: oferta local no Google`,
      descricao: `Reengaja quem pesquisou ${setor}${local} com oferta objetiva.`,
      aderenciaPercentual: 78,
      copy: `${nome}${local} — oferta da semana para quem busca ${setor} agora.\n\nReserve pelo Google ou WhatsApp e garanta prioridade no atendimento.`,
      hashtags: ['#GrowBiz', '#GoogleMeuNegocio', '#OfertaLocal'],
      chamadaParaAcao: 'Reservar pelo Google'
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

  notificarProgresso?.(temGeminiReal ? 'Diagnóstico classificado. Consultando referências na web…' : 'Diagnóstico classificado. Preparando hipóteses locais…', 20);

  // Tenta enriquecer o Sensoriamento de Mercado com IA real antes de gerar estratégia/campanha,
  // já que "casosDeSucessoAncorados" e "tendenciaPrincipal" alimentam a Estratégia de Oportunidade
  // e o cabeçalho de resultados — o fallback local sempre repetia os mesmos números fixos.
  let diagnosticoEnriquecido = diagnostico;
  if (temGeminiReal) {
    const sensoriamentoIa = await GERAR_SENSORIAMENTO_MERCADO_GEMINI(
      diagnostico.setor,
      diagnostico.nomeNegocio,
      diagnostico.escopoGeografico,
      diagnostico
    );
    if (sensoriamentoIa) {
      diagnosticoEnriquecido = {
        ...diagnostico,
        sensoriamento: { ...diagnostico.sensoriamento, ...sensoriamentoIa }
      };
    }
  }

  notificarProgresso?.('Preparando campanha com o contexto do negócio…', 60);
  let estrategias = GERAR_ESTRATEGIA_TRIPLA(diagnosticoEnriquecido);
  const campanhaMock = GERAR_MOCK_CAMPANHA_MODULO_3(diagnosticoEnriquecido);

  // Tenta enriquecer com IA real do Gemini se a chave estiver configurada
  if (temGeminiReal) {
    const geminiRes = await GERAR_COPY_PERSUASIVA_GEMINI(diagnosticoEnriquecido, campanhaMock.objetivoPrincipal);
    if (geminiRes) {
      if (geminiRes.estrategias) estrategias = geminiRes.estrategias;
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

  notificarProgresso?.('Plano pronto', 100);
  return resultadoCompleto;
}

