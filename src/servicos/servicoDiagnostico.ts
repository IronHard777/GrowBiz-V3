import {
  PerguntaEstrategica,
  SensoriamentoMercado,
  DiagnosticoCompleto,
  RespostasFiltroSetePerguntas,
  RespostaPerguntaEstrategica,
  ModeloOperacional,
  EscopoGeografico,
  CategoriaModeloNegocio,
  ClassificacaoRespostaOutros,
  OpcaoPerguntaEstrategica
} from '../tipos';
import { CATEGORIZAR_RESPOSTAS_OUTROS_GEMINI } from './servicoGemini';

export const VALOR_OPCAO_OUTROS = 'outros';

const OPCAO_OUTROS: OpcaoPerguntaEstrategica = {
  rotulo: 'Outros (descreva com suas palavras)',
  valor: VALOR_OPCAO_OUTROS,
  pesoDecisao: 'NEUTRO',
  pontuacaoX: 0,
  pontuacaoY: 0,
  eOutros: true
};

const comOutros = (opcoes: OpcaoPerguntaEstrategica[]): OpcaoPerguntaEstrategica[] => [
  ...opcoes,
  OPCAO_OUTROS
];

/**
 * Perguntas estratégicas do Protocolo de Investigação (Filtro de 7 Perguntas)
 * Pontuações: X = ciclo de venda (-10 giro rápido … +10 consultivo)
 *             Y = escala (-10 local/físico … +10 alta escala digital)
 */
const PERGUNTAS_BASE = (): PerguntaEstrategica[] => [
  {
    id: 1,
    eixo: 'X',
    pergunta: 'Qual é o tempo médio que o seu cliente leva para tomar a decisão de compra?',
    subtexto: 'Decisões no mesmo dia indicam alta velocidade; semanas exigem nutrição de autoridade. Escolha apenas uma opção.',
    selecaoUnica: true,
    opcoes: comOutros([
      { rotulo: 'Imediato ou poucas horas (Ex: impulso, alimentação, varejo)', valor: 'imediato', pesoDecisao: 'RAPIDA', pontuacaoX: -10, pontuacaoY: 0 },
      { rotulo: 'Entre 1 e 7 dias (Ex: serviços rápidos, produtos selecionados)', valor: 'curto', pesoDecisao: 'NEUTRO', pontuacaoX: 0, pontuacaoY: 0 },
      { rotulo: 'Semanas ou meses (Ex: contratos, advocacia, consultoria)', valor: 'longo', pesoDecisao: 'ELABORADA', pontuacaoX: 10, pontuacaoY: 0 }
    ])
  },
  {
    id: 2,
    eixo: 'X',
    pergunta: 'Qual é a principal dor latente ou desejo imediato que seu público busca resolver?',
    subtexto: 'Ajuda a ancorar a comunicação em necessidades urgentes ou construção de status. Você pode marcar mais de uma opção.',
    opcoes: comOutros([
      { rotulo: 'Conveniência, rapidez e desejo imediato', valor: 'desejo_imediato', pesoDecisao: 'RAPIDA', pontuacaoX: -10, pontuacaoY: 0 },
      { rotulo: 'Economia direta e custo-benefício competitivo', valor: 'custo_beneficio', pesoDecisao: 'NEUTRO', pontuacaoX: -5, pontuacaoY: 0 },
      { rotulo: 'Segurança jurídica, técnica ou solução de um problema crítico', valor: 'seguranca_critica', pesoDecisao: 'ELABORADA', pontuacaoX: 10, pontuacaoY: 0 }
    ])
  },
  {
    id: 3,
    eixo: 'X',
    pergunta: 'Qual é o ticket médio da sua principal oferta atual?',
    subtexto: 'Tickets mais baixos favorecem campanhas diretas de giro rápido. Escolha apenas uma opção (a principal oferta).',
    selecaoUnica: true,
    opcoes: comOutros([
      { rotulo: 'Até R$ 150,00 (Giro rápido)', valor: 'ticket_baixo', pesoDecisao: 'RAPIDA', pontuacaoX: -10, pontuacaoY: 0 },
      { rotulo: 'Entre R$ 150,00 e R$ 1.500,00 (Médio impacto)', valor: 'ticket_medio', pesoDecisao: 'NEUTRO', pontuacaoX: 0, pontuacaoY: 0 },
      { rotulo: 'Acima de R$ 1.500,00 (Alto valor agregado)', valor: 'ticket_alto', pesoDecisao: 'ELABORADA', pontuacaoX: 10, pontuacaoY: 0 }
    ])
  },
  {
    id: 4,
    eixo: 'Y',
    pergunta: 'Como o seu cliente descobre a sua marca hoje com mais frequência?',
    subtexto: 'Sensoriamento dos canais de atração atuais. Você pode marcar mais de um canal.',
    opcoes: comOutros([
      { rotulo: 'Tráfego de passagem física / Google Meu Negócio / Mapa Local', valor: 'local_mapa', pesoDecisao: 'RAPIDA', pontuacaoX: 0, pontuacaoY: -10 },
      { rotulo: 'Indicação de clientes e networking direto', valor: 'indicacao', pesoDecisao: 'NEUTRO', pontuacaoX: 0, pontuacaoY: 0 },
      { rotulo: 'Redes Sociais, Anúncios Online e Pesquisa Google', valor: 'digital', pesoDecisao: 'ELABORADA', pontuacaoX: 0, pontuacaoY: 10 }
    ])
  },
  {
    id: 5,
    eixo: 'Y',
    pergunta: 'Qual o nível de diferenciação do seu produto/serviço frente aos concorrentes locais?',
    subtexto: 'Avaliação do posicionamento de marca. Você pode marcar mais de uma opção.',
    opcoes: comOutros([
      { rotulo: 'Preço agressivo com atendimento ágil', valor: 'agil', pesoDecisao: 'RAPIDA', pontuacaoX: 0, pontuacaoY: -5 },
      { rotulo: 'Produto/serviço consolidado de alta demanda diária', valor: 'commoditizado_alta_demanda', pesoDecisao: 'NEUTRO', pontuacaoX: 0, pontuacaoY: 0 },
      { rotulo: 'Especializado com metodologia própria ou atendimento exclusivo', valor: 'especializado', pesoDecisao: 'ELABORADA', pontuacaoX: 0, pontuacaoY: 10 }
    ])
  },
  {
    id: 6,
    eixo: 'Y',
    pergunta: 'Qual é a capacidade de atendimento do seu negócio no cenário atual?',
    subtexto: 'Evita gargalos em campanhas de alta escala. Escolha apenas uma opção.',
    selecaoUnica: true,
    opcoes: comOutros([
      { rotulo: 'Limitado - Atendimento artesanal ou agenda preenchida', valor: 'agenda_limitada', pesoDecisao: 'ELABORADA', pontuacaoX: 0, pontuacaoY: -10 },
      { rotulo: 'Moderado - Consigo absorver até 30% a 50% de aumento', valor: 'medio_gargalo', pesoDecisao: 'NEUTRO', pontuacaoX: 0, pontuacaoY: 0 },
      { rotulo: 'Escalável - Consigo atender 5x mais clientes imediatamente', valor: 'alta_escala', pesoDecisao: 'RAPIDA', pontuacaoX: 0, pontuacaoY: 10 }
    ])
  },
  {
    id: 7,
    eixo: 'X',
    pergunta: 'Qual o objetivo estratégico prioritário para os próximos 30 dias?',
    subtexto: 'Define a meta principal da campanha e dos roteiros. Você pode marcar mais de um objetivo.',
    opcoes: comOutros([
      { rotulo: 'Girar estoque rápido ou lotar a agenda da semana', valor: 'giro_rapido', pesoDecisao: 'RAPIDA', pontuacaoX: -10, pontuacaoY: 0 },
      { rotulo: 'Reativar clientes antigos via WhatsApp e ofertas diretas', valor: 'reativacao', pesoDecisao: 'NEUTRO', pontuacaoX: -5, pontuacaoY: 0 },
      { rotulo: 'Construir autoridade de mercado e atrair clientes de alto valor', valor: 'autoridade', pesoDecisao: 'ELABORADA', pontuacaoX: 10, pontuacaoY: 0 }
    ])
  }
];

export function OBTER_SETE_PERGUNTAS_ESTRATEGICAS(setor: string): PerguntaEstrategica[] {
  const perguntas = PERGUNTAS_BASE();
  const texto = normalizarTexto(setor);
  const salao = /salao|cabeleir|cabelereir|barbear|hair/.test(texto);
  const servico = salao || /servic|consult|advoc|clinic|estetic|oficina|educacao|contab/.test(texto);
  const gastronomia = /restaurante|cafeteria|padaria|gastronomia|pizzaria/.test(texto);
  const oferta = salao ? 'atendimento de cabelo' : servico ? 'serviço' : gastronomia ? 'pedido' : 'produto';
  perguntas[0].pergunta = `Quanto tempo o cliente leva para decidir pelo ${oferta} em ${setor}?`;
  perguntas[0].opcoes[0].rotulo = salao ? 'No mesmo dia, para corte, escova ou manutenção' : 'No mesmo dia ou em poucas horas';
  perguntas[0].opcoes[1].rotulo = salao ? 'Até uma semana, comparando horários e profissionais' : 'Entre 1 e 7 dias, comparando opções';
  perguntas[0].opcoes[2].rotulo = salao ? 'Semanas, para uma transformação ou tratamento planejado' : 'Semanas ou meses, após avaliação detalhada';
  perguntas[1].pergunta = `O que seu cliente mais busca ao escolher seu ${oferta}?`;
  if (salao) {
    perguntas[1].opcoes[0].rotulo = 'Cuidar do visual com praticidade e horário disponível';
    perguntas[1].opcoes[1].rotulo = 'Manter o cabelo bem cuidado com preço acessível';
    perguntas[1].opcoes[2].rotulo = 'Confiar em um especialista para coloração ou transformação';
  }
  perguntas[2].pergunta = `Qual é o valor médio pago por ${oferta}?`;
  perguntas[4].pergunta = `Qual é o principal diferencial de ${setor} no seu negócio?`;
  perguntas[4].opcoes[1].rotulo = servico ? 'Qualidade consistente e clientes que retornam' : 'Qualidade e disponibilidade dos produtos mais procurados';
  perguntas[5].pergunta = servico ? 'Quantos novos atendimentos sua equipe consegue absorver?' : 'Quanto sua operação consegue crescer sem perder qualidade?';
  perguntas[6].opcoes[0].rotulo = servico ? 'Preencher os horários disponíveis da semana' : gastronomia ? 'Aumentar os pedidos da semana' : 'Girar o estoque e promover um produto da semana';
  perguntas[6].subtexto = `Defina a prioridade. Em Outros, indique o ${oferta} que quer promover e eventuais condições reais.`;
  return perguntas;
}

export function OBTER_RESPOSTA_PERGUNTA(
  respostas: RespostasFiltroSetePerguntas,
  perguntaId: number
): RespostaPerguntaEstrategica {
  return respostas[perguntaId] || { valores: [] };
}

export function PERGUNTA_ESTA_RESPONDIDA(resposta: RespostaPerguntaEstrategica | undefined): boolean {
  if (!resposta || resposta.valores.length === 0) return false;
  if (resposta.valores.includes(VALOR_OPCAO_OUTROS) && !resposta.textoOutros?.trim()) {
    return false;
  }
  return true;
}

export function FILTRO_COMPLETO(respostas: RespostasFiltroSetePerguntas): boolean {
  return [1, 2, 3, 4, 5, 6, 7].every(id => PERGUNTA_ESTA_RESPONDIDA(respostas[id]));
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, n) => acc + n, 0) / valores.length;
}

function pontuacaoDaPergunta(
  pergunta: PerguntaEstrategica,
  resposta: RespostaPerguntaEstrategica | undefined
): { x: number; y: number } {
  if (!resposta || resposta.valores.length === 0) return { x: 0, y: 0 };

  const pontos = resposta.valores.map(valor => {
    if (valor === VALOR_OPCAO_OUTROS) {
      return {
        x: resposta.classificacaoOutros?.pontuacaoX ?? 0,
        y: resposta.classificacaoOutros?.pontuacaoY ?? 0
      };
    }
    const opcao = pergunta.opcoes.find(o => o.valor === valor);
    return { x: opcao?.pontuacaoX ?? 0, y: opcao?.pontuacaoY ?? 0 };
  });

  return { x: media(pontos.map(p => p.x)), y: media(pontos.map(p => p.y)) };
}

export function CALCULAR_CATEGORIA_MODELO_NEGOCIO(
  respostas: RespostasFiltroSetePerguntas,
  setor = ''
): CategoriaModeloNegocio {
  const perguntas = OBTER_SETE_PERGUNTAS_ESTRATEGICAS(setor);
  const porId = new Map(perguntas.map(p => [p.id, p]));

  const q = (id: number) => pontuacaoDaPergunta(porId.get(id)!, respostas[id]);

  const pontuacaoX = q(1).x + q(2).x + q(3).x + q(7).x;
  const pontuacaoY = q(4).y + q(5).y + q(6).y;

  const tipoDecisao: CategoriaModeloNegocio['tipoDecisao'] = pontuacaoX > 0 ? 'ELABORADA' : 'RAPIDA';

  if (pontuacaoX > 0 && pontuacaoY > 0) {
    return {
      categoria: 'High-Ticket Escalável / B2B',
      quadrante: 1,
      estrategia: 'Funil de Autoridade e Venda Consultiva',
      perfil: 'Serviços de alto valor, B2B, infoprodutos premium, SaaS enterprise.',
      pontuacaoX,
      pontuacaoY,
      tipoDecisao,
      justificativa: `Quadrante 1 (PX ${pontuacaoX.toFixed(1)}, PY ${pontuacaoY.toFixed(1)}): ciclo consultivo com alta escala. Foco em funil de autoridade, webinars, nutrição de leads, inbound e reuniões de fechamento.`
    };
  }

  if (pontuacaoX <= 0 && pontuacaoY > 0) {
    return {
      categoria: 'Giro Rápido Digital / E-commerce',
      quadrante: 2,
      estrategia: 'Tráfego Direto e Conversão Imediata',
      perfil: 'E-commerce, produtos de baixo ticket, infoprodutos de entrada, campanhas diretas.',
      pontuacaoX,
      pontuacaoY,
      tipoDecisao,
      justificativa: `Quadrante 2 (PX ${pontuacaoX.toFixed(1)}, PY ${pontuacaoY.toFixed(1)}): giro rápido com escala digital. Foco em tráfego pago para página de vendas, remarketing agressivo e conversão imediata.`
    };
  }

  if (pontuacaoX <= 0 && pontuacaoY <= 0) {
    return {
      categoria: 'Varejo Local / Negócio de Bairro',
      quadrante: 3,
      estrategia: 'Atração Geo-localizada e Ofertas Diretas',
      perfil: 'Restaurantes, lojas locais, salões de beleza, serviços rápidos de bairro.',
      pontuacaoX,
      pontuacaoY,
      tipoDecisao,
      justificativa: `Quadrante 3 (PX ${pontuacaoX.toFixed(1)}, PY ${pontuacaoY.toFixed(1)}): negócio local de giro rápido. Foco em Google Meu Negócio, tráfego geo-localizado (3–5 km), promoções do dia e WhatsApp Business.`
    };
  }

  return {
    categoria: 'Serviço Especializado Local',
    quadrante: 4,
    estrategia: 'Google Search (Intenção) e Agendamento',
    perfil: 'Escritórios locais, clínicas especializadas, consultorias de agenda.',
    pontuacaoX,
    pontuacaoY,
    tipoDecisao,
    justificativa: `Quadrante 4 (PX ${pontuacaoX.toFixed(1)}, PY ${pontuacaoY.toFixed(1)}): serviço consultivo de alcance local. Foco em Google Search de alta intenção, prova social local e agendamento direto.`
  };
}

/** Mantido para compatibilidade: a matriz agora é o quadrante PX/PY. */
export function DETERMINAR_MATRIZ_DECISAO(
  setor: string,
  respostas: RespostasFiltroSetePerguntas
): { tipo: CategoriaModeloNegocio['tipoDecisao']; justificativa: string } {
  const categoria = CALCULAR_CATEGORIA_MODELO_NEGOCIO(respostas, setor);
  return { tipo: categoria.tipoDecisao, justificativa: categoria.justificativa };
}

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fallback local: aproxima o texto de "Outros" à opção pré-definida mais próxima.
 */
export function CATEGORIZAR_RESPOSTA_OUTROS_HEURISTICA(
  pergunta: PerguntaEstrategica,
  textoOutros: string
): ClassificacaoRespostaOutros {
  const texto = normalizarTexto(textoOutros);
  const opcoesFixas = pergunta.opcoes.filter(o => !o.eOutros);

  let melhor = opcoesFixas[1] || opcoesFixas[0];
  let melhorScore = -1;

  for (const opcao of opcoesFixas) {
    const tokens = normalizarTexto(opcao.rotulo).split(' ').filter(t => t.length > 3);
    const hits = tokens.filter(t => texto.includes(t)).length;
    const bonusValor = texto.includes(opcao.valor.replace(/_/g, ' ')) ? 2 : 0;
    const score = hits + bonusValor;
    if (score > melhorScore) {
      melhorScore = score;
      melhor = opcao;
    }
  }

  const eixo = pergunta.eixo;
  return {
    pontuacaoX: eixo === 'X' ? melhor.pontuacaoX : 0,
    pontuacaoY: eixo === 'Y' ? melhor.pontuacaoY : 0,
    valorMaisProximo: melhor.valor,
    justificativa: `Texto livre aproximado da opção "${melhor.rotulo}" (classificação heurística).`
  };
}

export function LISTAR_PERGUNTAS_COM_OUTROS(
  respostas: RespostasFiltroSetePerguntas,
  setor: string
): { pergunta: PerguntaEstrategica; textoOutros: string }[] {
  const perguntas = OBTER_SETE_PERGUNTAS_ESTRATEGICAS(setor);
  return perguntas
    .map(pergunta => {
      const resposta = respostas[pergunta.id];
      if (!resposta?.valores.includes(VALOR_OPCAO_OUTROS)) return null;
      const textoOutros = resposta.textoOutros?.trim() || '';
      if (!textoOutros) return null;
      return { pergunta, textoOutros };
    })
    .filter((item): item is { pergunta: PerguntaEstrategica; textoOutros: string } => item !== null);
}

export function APLICAR_CLASSIFICACOES_OUTROS(
  respostas: RespostasFiltroSetePerguntas,
  classificacoes: Record<number, ClassificacaoRespostaOutros>
): RespostasFiltroSetePerguntas {
  const atualizadas: RespostasFiltroSetePerguntas = { ...respostas };
  for (const [idStr, classificacao] of Object.entries(classificacoes)) {
    const id = Number(idStr);
    const atual = atualizadas[id] || { valores: [] };
    atualizadas[id] = { ...atual, classificacaoOutros: classificacao };
  }
  return atualizadas;
}

export async function CLASSIFICAR_RESPOSTAS_OUTROS(
  respostas: RespostasFiltroSetePerguntas,
  setor: string
): Promise<RespostasFiltroSetePerguntas> {
  const itens = LISTAR_PERGUNTAS_COM_OUTROS(respostas, setor);
  if (itens.length === 0) return respostas;

  const viaIa = await CATEGORIZAR_RESPOSTAS_OUTROS_GEMINI(itens);
  const classificacoes: Record<number, ClassificacaoRespostaOutros> = {};

  for (const item of itens) {
    classificacoes[item.pergunta.id] =
      viaIa?.[item.pergunta.id] || CATEGORIZAR_RESPOSTA_OUTROS_HEURISTICA(item.pergunta, item.textoOutros);
  }

  return APLICAR_CLASSIFICACOES_OUTROS(respostas, classificacoes);
}

/**
 * Gerador de Sensoriamento de Mercado Local e Casos de Sucesso
 */
export function GERAR_SENSORIAMENTO_MERCADO(
  setor: string,
  escopo: EscopoGeografico
): SensoriamentoMercado {
  return {
    concorrentesLocaisMapeados: 0,
    statusPesquisa: 'indisponivel',
    fontes: [],
    tendenciaPrincipal: `Hipótese para testar em ${setor}: destacar o diferencial e facilitar o contato.`,
    volumeBuscaRelativo: 'Volume de buscas não consultado.',
    casosDeSucessoAncorados: []
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
  const categoriaModelo = CALCULAR_CATEGORIA_MODELO_NEGOCIO(respostasFiltro, setor);
  const sensoriamento = GERAR_SENSORIAMENTO_MERCADO(setor, escopoGeografico);

  return {
    id: `diag_${Date.now()}`,
    usuarioId: `user_${Math.random().toString(36).substring(2, 9)}`,
    nomeNegocio: nomeNegocio || `Empresa ${setor}`,
    setor,
    modeloOperacional,
    escopoGeografico,
    tipoDecisaoCalculado: categoriaModelo.tipoDecisao,
    justificativaMatriz: categoriaModelo.justificativa,
    categoriaModelo,
    respostasFiltro,
    sensoriamento,
    dataCriacao: new Date().toISOString()
  };
}
