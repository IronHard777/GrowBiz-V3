/**
 * GrowBiz V2.2 - Definições de Tipos em Português (Brasil)
 */

export type ModeloOperacional = 'Presencial' | 'Online' | 'Híbrido';
export type EscopoGeografico = 'Local' | 'Regional' | 'Nacional' | 'Global';
export type TipoMatrizDecisao = 'RAPIDA' | 'ELABORADA';

export interface PerfilUsuario {
  id: string;
  nomeEmpresaOuUsuario: string;
  email: string;
  telefone?: string;
  setor: string;
  modeloOperacional: ModeloOperacional;
  escopoGeografico: EscopoGeografico;
  dataCriacao: string;
}

export interface PerguntaEstrategica {
  id: number;
  pergunta: string;
  subtexto: string;
  opcoes: {
    rotulo: string;
    valor: string;
    pesoDecisao: 'RAPIDA' | 'ELABORADA' | 'NEUTRO';
  }[];
}

export interface RespostasFiltroSetePerguntas {
  [perguntaId: number]: string;
}

export interface SensoriamentoMercado {
  concorrentesLocaisMapeados: number;
  tendenciaPrincipal: string;
  volumeBuscaRelativo: string;
  casosDeSucessoAncorados: string[];
}

export interface DiagnosticoCompleto {
  id: string;
  usuarioId: string;
  nomeNegocio: string;
  setor: string;
  modeloOperacional: ModeloOperacional;
  escopoGeografico: EscopoGeografico;
  tipoDecisaoCalculado: TipoMatrizDecisao;
  justificativaMatriz: string;
  respostasFiltro: RespostasFiltroSetePerguntas;
  sensoriamento: SensoriamentoMercado;
  dataCriacao: string;
}

export interface EstrategiaCrescimento {
  estrategiaBase: {
    titulo: string;
    pilaresAtemporais: string[];
    descricao: string;
  };
  estrategiaOportunidade: {
    titulo: string;
    planoAtaqueImediato: string;
    gatilhoTendencia: string;
  };
  estrategiaComplementar: {
    titulo: string;
    jornadaForaRedes: {
      googleMeuNegocio: string;
      whatsappEstrategico: string;
      deliveryOuPresencial: string;
    };
  };
}

export type TomNarracao = 'calma' | 'agitada' | 'seria' | 'empolgante' | 'energetica';
export type GeneroVoz = 'masculina' | 'feminina';

export interface CenaRoteiroVideo {
  segundoInicio: number;
  segundoFim: number;
  acaoVisual: string;
  falaAudio: string;
  enquadramentoCamera: string;
  dicaDirecao: string;
  tomNarracao: TomNarracao;
  generoVoz: GeneroVoz;
}

export interface MockCampanhaConteudo {
  id: string;
  tituloCampanha: string;
  objetivoPrincipal: string;
  copyPersuasiva: string;
  hashtagsEstrategicas: string[];
  imagemUrlPlaceholder: string;
  promptImagemIa: string;
  roteiroVideo: CenaRoteiroVideo[];
  canalIdeal: string;
  chamadaParaAcao: string;
}

export interface KPIsPerformance {
  taxaCliqueCTR: number; // ex: 4.8%
  taxaConversao: number; // ex: 12.5%
  retornoSobreInvestimentoROI: string; // ex: "3.4x"
  custoPorAdquisicaoCPA: string; // ex: "R$ 14,20"
}

export interface AlertaPivotagem {
  ativo: boolean;
  mensagem: string;
  tendenciaAtual: string;
  acaoRecomendada: string;
}

export interface ResultadoCompletoConsultoria {
  diagnostico: DiagnosticoCompleto;
  estrategias: EstrategiaCrescimento;
  campanhaMock: MockCampanhaConteudo;
  kpisSimulados: KPIsPerformance;
  alertaPivotagem: AlertaPivotagem;
}

export interface PropostaCampanha {
  id: string;
  plataforma: CanalPublicacao;
  titulo: string;
  descricao: string;
  aderenciaPercentual: number;
}

export type StatusEventoCalendario = 'agendado' | 'publicado' | 'rascunho';
export type CanalPublicacao = 'Instagram Reels' | 'TikTok' | 'Instagram Feed' | 'WhatsApp Status' | 'Google Meu Negócio';

export interface EventoCalendarioConteudo {
  id: string;
  diagnosticoId: string;
  titulo: string;
  dataHorario: string; // ISO String ou YYYY-MM-DD THH:mm
  canal: CanalPublicacao;
  status: StatusEventoCalendario;
  copy: string;
  imagemUrl?: string;
  hashtags: string[];
  criadoEm: string;
}

