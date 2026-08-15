import {
  PerguntaEstrategica,
  TipoMatrizDecisao,
  SensoriamentoMercado,
  DiagnosticoCompleto,
  RespostasFiltroSetePerguntas,
  ModeloOperacional,
  EscopoGeografico
} from '../tipos';

/**
 * Perguntas estratégicas do Protocolo de Investigação (Filtro de 7 Perguntas)
 */
export const OBTER_SETE_PERGUNTAS_ESTRATEGICAS = (setor: string): PerguntaEstrategica[] => [
  {
    id: 1,
    pergunta: "Qual é o tempo médio que o seu cliente leva para tomar a decisão de compra?",
    subtexto: "Decisões no mesmo dia indicam alta velocidade; semanas exigem nutrição de autoridade.",
    opcoes: [
      { rotulo: "Imediato ou poucas horas (Ex: impulso, alimentação, varejo)", valor: "imediato", pesoDecisao: "RAPIDA" },
      { rotulo: "Entre 1 e 7 dias (Ex: serviços rápidos, produtos selecionados)", valor: "curto", pesoDecisao: "NEUTRO" },
      { rotulo: "Semanas ou meses (Ex: contratos, advocacia, consultoria)", valor: "longo", pesoDecisao: "ELABORADA" }
    ]
  },
  {
    id: 2,
    pergunta: "Qual é a principal dor latente ou desejo imediato que seu público busca resolver?",
    subtexto: "Ajuda a ancorar a comunicação em necessidades urgentes ou construção de status.",
    opcoes: [
      { rotulo: "Conveniência, rapidez e desejo imediato", valor: "desejo_imediato", pesoDecisao: "RAPIDA" },
      { rotulo: "Segurança jurídica, técnica ou solução de um problema crítico", valor: "seguranca_critica", pesoDecisao: "ELABORADA" },
      { rotulo: "Economia direta e custo-benefício competitivo", valor: "custo_beneficio", pesoDecisao: "NEUTRO" }
    ]
  },
  {
    id: 3,
    pergunta: "Qual é o ticket médio da sua principal oferta atual?",
    subtexto: "Tickets mais baixos favorecem campanhas diretas de giro rápido.",
    opcoes: [
      { rotulo: "Até R$ 150,00 (Giro rápido)", valor: "ticket_baixo", pesoDecisao: "RAPIDA" },
      { rotulo: "Entre R$ 150,00 e R$ 1.500,00 (Médio impacto)", valor: "ticket_medio", pesoDecisao: "NEUTRO" },
      { rotulo: "Acima de R$ 1.500,00 (Alto valor agregado)", valor: "ticket_alto", pesoDecisao: "ELABORADA" }
    ]
  },
  {
    id: 4,
    pergunta: "Como o seu cliente descobre a sua marca hoje com mais frequência?",
    subtexto: "Sensoriamento dos canais de atração atuais.",
    opcoes: [
      { rotulo: "Tráfego de passagem física / Google Meu Negócio / Mapa Local", valor: "local_mapa", pesoDecisao: "RAPIDA" },
      { rotulo: "Indicação de clientes e networking direto", valor: "indicacao", pesoDecisao: "ELABORADA" },
      { rotulo: "Redes Sociais, Anúncios Online e Pesquisa Google", valor: "digital", pesoDecisao: "NEUTRO" }
    ]
  },
  {
    id: 5,
    pergunta: "Qual o nível de diferenciação do seu produto/serviço frente aos concorrentes locais?",
    subtexto: "Avaliação do posicionamento de marca.",
    opcoes: [
      { rotulo: "Produto/serviço consolidado de alta demanda diária", valor: "commoditizado_alta_demanda", pesoDecisao: "RAPIDA" },
      { rotulo: "Especializado com metodologia própria ou atendimento exclusivo", valor: "especializado", pesoDecisao: "ELABORADA" },
      { rotulo: "Preço agressivo com atendimento ágil", valor: "agil", pesoDecisao: "RAPIDA" }
    ]
  },
  {
    id: 6,
    pergunta: "Qual é a capacidade de atendimento do seu negócio no cenário atual?",
    subtexto: "Evita gargalos em campanhas de alta escala.",
    opcoes: [
      { rotulo: "Escalável - Consigo atender 5x mais clientes imediatamente", valor: "alta_escala", pesoDecisao: "RAPIDA" },
      { rotulo: "Moderado - Consigo absorver até 30% a 50% de aumento", valor: "medio_gargalo", pesoDecisao: "NEUTRO" },
      { rotulo: "Limitado - Atendimento artesanal ou agenda preenchida", valor: "agenda_limitada", pesoDecisao: "ELABORADA" }
    ]
  },
  {
    id: 7,
    pergunta: "Qual o objetivo estratégico prioritário para os próximos 30 dias?",
    subtexto: "Define a meta principal da campanha e dos roteiros.",
    opcoes: [
      { rotulo: "Girar estoque rápido ou lotar a agenda da semana", valor: "giro_rapido", pesoDecisao: "RAPIDA" },
      { rotulo: "Construir autoridade de mercado e atrair clientes de alto valor", valor: "autoridade", pesoDecisao: "ELABORADA" },
      { rotulo: "Reativar clientes antigos via WhatsApp e ofertas diretas", valor: "reativacao", pesoDecisao: "NEUTRO" }
    ]
  }
];

/**
 * Mapeamento automático da Matriz de Decisão com base no setor e respostas
 */
export function DETERMINAR_MATRIZ_DECISAO(
  setor: string,
  respostas: RespostasFiltroSetePerguntas
): { tipo: TipoMatrizDecisao; justificativa: string } {
  const setorMinusculo = setor.toLowerCase();
  
  // Setores tipicamente de Decisão Rápida
  const setoresRapidos = ['cafeteria', 'restaurante', 'varejo', 'roupas', 'delivery', 'barbearia', 'salão', 'lanchonete', 'padaria', 'pizzaria', 'estética'];
  
  // Setores tipicamente de Decisão Elaborada
  const setoresElaborados = ['advocacia', 'advogado', 'consultoria', 'imobiliária', 'arquitetura', 'engenharia', 'médico', 'odonto', 'contabilidade', 'b2b'];

  let pontosRapida = 0;
  let pontosElaborada = 0;

  if (setoresRapidos.some(s => setorMinusculo.includes(s))) {
    pontosRapida += 3;
  } else if (setoresElaborados.some(s => setorMinusculo.includes(s))) {
    pontosElaborada += 3;
  }

  // Avaliação das respostas do filtro de 7 perguntas
  const perguntas = OBTER_SETE_PERGUNTAS_ESTRATEGICAS(setor);
  perguntas.forEach(p => {
    const respValor = respostas[p.id];
    const opcaoSelecionada = p.opcoes.find(o => o.valor === respValor);
    if (opcaoSelecionada) {
      if (opcaoSelecionada.pesoDecisao === 'RAPIDA') pontosRapida += 2;
      if (opcaoSelecionada.pesoDecisao === 'ELABORADA') pontosElaborada += 2;
    }
  });

  if (pontosRapida >= pontosElaborada) {
    return {
      tipo: 'RAPIDA',
      justificativa: `Setor "${setor}" possui dinâmica de giro rápido. A IA direcionou foco em produto destaque, impulso e conversão acelerada com ancoragem em ofertas visuais imediatas.`
    };
  } else {
    return {
      tipo: 'ELABORADA',
      justificativa: `Setor "${setor}" demanda jornada de decisão elaborada. A IA estruturou equilíbrio estratégico entre construção de autoridade (confiança) e solução de dores latentes.`
    };
  }
}

/**
 * Gerador de Sensoriamento de Mercado Local e Casos de Sucesso
 */
export function GERAR_SENSORIAMENTO_MERCADO(
  setor: string,
  escopo: EscopoGeografico
): SensoriamentoMercado {
  return {
    concorrentesLocaisMapeados: Math.floor(Math.random() * 18) + 12,
    tendenciaPrincipal: `Aumento de 42% na busca por soluções diretas e atendimento ágil em ${setor}`,
    volumeBuscaRelativo: `Alta demanda (+38% vs. mês anterior em pesquisas locais)`,
    casosDeSucessoAncorados: [
      `Caso #104: Aumento de 310% na taxa de conversão com campanhas focadas na dor latente em ${setor}.`,
      `Caso #88: Redução de 45% no custo por cliente via prova social e anúncios de alta urgência visual.`,
      `Caso #212: Estruturação de jornada no WhatsApp gerando reativação de 28% da base inativa.`
    ]
  };
}

/**
 * Criar objeto de diagnóstico completo a partir dos dados do usuário
 */
export function CRIAR_DIAGNOSTICO_COMPLETO(
  nomeNegocio: string,
  setor: string,
  modeloOperacional: ModeloOperacional,
  escopoGeografico: EscopoGeografico,
  respostasFiltro: RespostasFiltroSetePerguntas
): DiagnosticoCompleto {
  const { tipo, justificativa } = DETERMINAR_MATRIZ_DECISAO(setor, respostasFiltro);
  const sensoriamento = GERAR_SENSORIAMENTO_MERCADO(setor, escopoGeografico);

  return {
    id: `diag_${Date.now()}`,
    usuarioId: `user_${Math.random().toString(36).substring(2, 9)}`,
    nomeNegocio: nomeNegocio || `Empresa ${setor}`,
    setor,
    modeloOperacional,
    escopoGeografico,
    tipoDecisaoCalculado: tipo,
    justificativaMatriz: justificativa,
    respostasFiltro,
    sensoriamento,
    dataCriacao: new Date().toISOString()
  };
}
