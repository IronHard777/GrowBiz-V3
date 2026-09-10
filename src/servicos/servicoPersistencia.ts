import {
  PerfilUsuario,
  DiagnosticoCompleto,
  EstrategiaCrescimento,
  MockCampanhaConteudo,
  KPIsPerformance,
  ResultadoCompletoConsultoria,
  EventoCalendarioConteudo
} from '../tipos';

/**
 * Serviço de Persistência alinhado com o firebase-blueprint.json (GrowBiz V2.2)
 * Coleções: usuarios, diagnosticos, estrategias, campanhas, performances, eventos_calendario
 */

const PREFIXO = 'growbiz_v2_';

const CHAVES = {
  USUARIOS: `${PREFIXO}usuarios`,
  DIAGNOSTICOS: `${PREFIXO}diagnosticos`,
  ESTRATEGIAS: `${PREFIXO}estrategias`,
  CAMPANHAS: `${PREFIXO}campanhas`,
  PERFORMANCES: `${PREFIXO}performances`,
  EVENTOS_CALENDARIO: `${PREFIXO}eventos_calendario`,
  RESULTADO_ATUAL: `${PREFIXO}resultado_consultoria_atual`
};

function lerColecao<T>(chave: string): T[] {
  try {
    const json = localStorage.getItem(chave);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error(`Erro ao ler coleção ${chave}:`, e);
    return [];
  }
}

function salvarColecao<T>(chave: string, itens: T[]): void {
  try {
    localStorage.setItem(chave, JSON.stringify(itens));
  } catch (e) {
    console.error(`Erro ao salvar coleção ${chave}:`, e);
  }
}

// =====================================
// PERSISTÊNCIA DE USUÁRIOS (PERFIL)
// =====================================
export function SALVAR_PERFIL_USUARIO_PERSISTENCIA(usuario: PerfilUsuario): void {
  const usuarios = lerColecao<PerfilUsuario>(CHAVES.USUARIOS);
  const idx = usuarios.findIndex(u => u.id === usuario.id || u.email === usuario.email);
  if (idx >= 0) {
    usuarios[idx] = usuario;
  } else {
    usuarios.push(usuario);
  }
  salvarColecao(CHAVES.USUARIOS, usuarios);
}

// =====================================
// PERSISTÊNCIA DE DIAGNÓSTICO
// =====================================
export function SALVAR_DIAGNOSTICO_PERSISTENCIA(diagnostico: DiagnosticoCompleto): void {
  const diagnosticos = lerColecao<DiagnosticoCompleto>(CHAVES.DIAGNOSTICOS);
  const idx = diagnosticos.findIndex(d => d.id === diagnostico.id);
  if (idx >= 0) {
    diagnosticos[idx] = diagnostico;
  } else {
    diagnosticos.push(diagnostico);
  }
  salvarColecao(CHAVES.DIAGNOSTICOS, diagnosticos);
}

// =====================================
// PERSISTÊNCIA DE RESULTADO COMPLETO
// =====================================
export function SALVAR_RESULTADO_CONSULTORIA_PERSISTENCIA(resultado: ResultadoCompletoConsultoria): void {
  try {
    localStorage.setItem(CHAVES.RESULTADO_ATUAL, JSON.stringify(resultado));
    SALVAR_DIAGNOSTICO_PERSISTENCIA(resultado.diagnostico);
    
    // Salvar estratégia na coleção
    const estrategias = lerColecao<any>(CHAVES.ESTRATEGIAS);
    estrategias.push({
      id: `est_${Date.now()}`,
      diagnosticoId: resultado.diagnostico.id,
      ...resultado.estrategias,
      criadoEm: new Date().toISOString()
    });
    salvarColecao(CHAVES.ESTRATEGIAS, estrategias);

    // Salvar campanha na coleção
    const campanhas = lerColecao<MockCampanhaConteudo>(CHAVES.CAMPANHAS);
    campanhas.push(resultado.campanhaMock);
    salvarColecao(CHAVES.CAMPANHAS, campanhas);

    // Gerar evento inicial de calendário baseado na campanha mock
    CRIAR_EVENTO_CALENDARIO({
      id: `evt_auto_${Date.now()}`,
      diagnosticoId: resultado.diagnostico.id,
      titulo: resultado.campanhaMock.tituloCampanha,
      dataHorario: new Date(Date.now() + 86400000).toISOString(), // Amanhã, com fuso preservado
      canal: (resultado.campanhaMock.canalIdeal.includes('Reels') ? 'Instagram Reels' : 'Instagram Feed') as any,
      status: 'rascunho',
      copy: resultado.campanhaMock.copyPersuasiva,
      imagemUrl: resultado.campanhaMock.imagemUrlPlaceholder,
      hashtags: resultado.campanhaMock.hashtagsEstrategicas,
      criadoEm: new Date().toISOString()
    });

  } catch (e) {
    console.error("Erro ao salvar resultado de consultoria:", e);
  }
}

export function OBTER_RESULTADO_CONSULTORIA_PERSISTIDO(): ResultadoCompletoConsultoria | null {
  try {
    const json = localStorage.getItem(CHAVES.RESULTADO_ATUAL);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
}

// =====================================
// PERSISTÊNCIA DO CALENDÁRIO DE CONTEÚDO (MÓDULO 3)
// =====================================
export function OBTER_EVENTOS_CALENDARIO(): EventoCalendarioConteudo[] {
  const eventos = lerColecao<EventoCalendarioConteudo>(CHAVES.EVENTOS_CALENDARIO);
  if (eventos.length === 0) {
    // Eventos padrão iniciais para demonstração rica
    const eventosPadrao: EventoCalendarioConteudo[] = [
      {
        id: 'evt_101',
        diagnosticoId: 'diag_demo',
        titulo: 'Lançamento do Café Destaque da Semana',
        dataHorario: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        canal: 'Instagram Reels',
        status: 'agendado',
        copy: '🔥 O aroma que transforma o seu dia com grão especial artesanal.',
        imagemUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80',
        hashtags: ['#CafeEspecial', '#GiroRapido', '#LetsGrow'],
        criadoEm: new Date().toISOString()
      },
      {
        id: 'evt_102',
        diagnosticoId: 'diag_demo',
        titulo: 'Dica de Mestre: Como Escolher o Melhor Grão',
        dataHorario: new Date(Date.now() + 172800000).toISOString().slice(0, 16),
        canal: 'TikTok',
        status: 'agendado',
        copy: '💡 3 segredos que você não sabia sobre a torra perfeita.',
        imagemUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
        hashtags: ['#DicasDeCafe', '#TikTokBrasil', '#GrowBiz'],
        criadoEm: new Date().toISOString()
      },
      {
        id: 'evt_103',
        diagnosticoId: 'diag_demo',
        titulo: 'Oferta Especial de Fim de Semana (Reativação WhatsApp)',
        dataHorario: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
        canal: 'WhatsApp Status',
        status: 'publicado',
        copy: '📲 Garanta 15% OFF apresentando este print no balcão hoje!',
        hashtags: ['#OfertaVIP', '#WhatsApp'],
        criadoEm: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    salvarColecao(CHAVES.EVENTOS_CALENDARIO, eventosPadrao);
    return eventosPadrao;
  }
  return eventos;
}

export function CRIAR_EVENTO_CALENDARIO(evento: EventoCalendarioConteudo): void {
  const eventos = OBTER_EVENTOS_CALENDARIO();
  eventos.push(evento);
  salvarColecao(CHAVES.EVENTOS_CALENDARIO, eventos);
}

export function ATUALIZAR_EVENTO_CALENDARIO(evento: EventoCalendarioConteudo): void {
  const eventos = OBTER_EVENTOS_CALENDARIO();
  const idx = eventos.findIndex(e => e.id === evento.id);
  if (idx >= 0) {
    eventos[idx] = evento;
    salvarColecao(CHAVES.EVENTOS_CALENDARIO, eventos);
  }
}

export function EXCLUIR_EVENTO_CALENDARIO(id: string): void {
  const eventos = OBTER_EVENTOS_CALENDARIO().filter(e => e.id !== id);
  salvarColecao(CHAVES.EVENTOS_CALENDARIO, eventos);
}
