import React, { useState, useEffect } from 'react';
import { EventoCalendarioConteudo, CanalPublicacao, StatusEventoCalendario } from '../tipos';
import {
  OBTER_EVENTOS_CALENDARIO,
  CRIAR_EVENTO_CALENDARIO,
  ATUALIZAR_EVENTO_CALENDARIO,
  EXCLUIR_EVENTO_CALENDARIO
} from '../servicos/servicoPersistencia';
import {
  LayoutGrid,
  Plus,
  Clock,
  Trash2,
  Edit,
  Video,
  X,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PropriedadesCalendario {
  diagnosticoId: string;
  /** Incrementar este valor força o Kanban a recarregar os eventos (ex: após "Adicionar ao Kanban" nas Propostas). */
  sinalDeAtualizacao?: number;
}

interface ColunaKanban {
  status: StatusEventoCalendario;
  titulo: string;
  corPonto: string;
}

const COLUNAS: ColunaKanban[] = [
  { status: 'rascunho', titulo: 'Planejadas', corPonto: 'bg-slate-400' },
  { status: 'agendado', titulo: 'Em Andamento', corPonto: 'bg-blue-400' },
  { status: 'publicado', titulo: 'Concluídas', corPonto: 'bg-green-400' }
];

const PROXIMO_STATUS: Record<StatusEventoCalendario, StatusEventoCalendario | null> = {
  rascunho: 'agendado',
  agendado: 'publicado',
  publicado: null
};

export const CalendarioConteudo: React.FC<PropriedadesCalendario> = ({ diagnosticoId, sinalDeAtualizacao }) => {
  const [eventos, setEventos] = useState<EventoCalendarioConteudo[]>([]);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [eventoParaEditar, setEventoParaEditar] = useState<EventoCalendarioConteudo | null>(null);

  // Campos do formulário
  const [titulo, setTitulo] = useState<string>('');
  const [dataHorario, setDataHorario] = useState<string>(new Date().toISOString().slice(0, 16));
  const [canal, setCanal] = useState<CanalPublicacao>('Instagram Reels');
  const [status, setStatus] = useState<StatusEventoCalendario>('rascunho');
  const [copy, setCopy] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('#GrowBiz #Estrategia2026');

  const recarregarEventos = () => {
    const lista = OBTER_EVENTOS_CALENDARIO();
    setEventos(lista);
  };

  useEffect(() => {
    recarregarEventos();
  }, [sinalDeAtualizacao]);

  const abrirModalNovo = () => {
    setEventoParaEditar(null);
    setTitulo('');
    setDataHorario(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    setCanal('Instagram Reels');
    setStatus('rascunho');
    setCopy('');
    setHashtags('#GrowBiz #Vendas #LetsGrow');
    setModalAberto(true);
  };

  const abrirModalEditar = (evt: EventoCalendarioConteudo) => {
    setEventoParaEditar(evt);
    setTitulo(evt.titulo);
    setDataHorario(evt.dataHorario);
    setCanal(evt.canal);
    setStatus(evt.status);
    setCopy(evt.copy);
    setHashtags(evt.hashtags.join(' '));
    setModalAberto(true);
  };

  const salvarEventoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = hashtags.split(' ').map(t => t.trim()).filter(t => t.length > 0);

    if (eventoParaEditar) {
      ATUALIZAR_EVENTO_CALENDARIO({
        ...eventoParaEditar,
        titulo,
        dataHorario,
        canal,
        status,
        copy,
        hashtags: tagsArray
      });
    } else {
      CRIAR_EVENTO_CALENDARIO({
        id: `evt_${Date.now()}`,
        diagnosticoId,
        titulo,
        dataHorario,
        canal,
        status,
        copy,
        hashtags: tagsArray,
        criadoEm: new Date().toISOString()
      });
    }

    setModalAberto(false);
    recarregarEventos();
  };

  const removerEvento = (id: string) => {
    if (confirm("Deseja realmente excluir este card do Kanban?")) {
      EXCLUIR_EVENTO_CALENDARIO(id);
      recarregarEventos();
    }
  };

  const avancarEtapa = (evt: EventoCalendarioConteudo) => {
    const proximo = PROXIMO_STATUS[evt.status];
    if (!proximo) return;
    ATUALIZAR_EVENTO_CALENDARIO({ ...evt, status: proximo });
    recarregarEventos();
  };

  return (
    <div className="gb-panel p-6 text-white space-y-6">

      {/* CABEÇALHO DO KANBAN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Kanban de Acompanhamento
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Planejadas → Em Andamento → Concluídas
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          className="gb-btn flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Card</span>
        </button>
      </div>

      {/* QUADRO KANBAN DE 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUNAS.map((coluna) => {
          const eventosDaColuna = eventos.filter(e => e.status === coluna.status);
          return (
            <div key={coluna.status}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${coluna.corPonto}`} />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                  {coluna.titulo} ({eventosDaColuna.length})
                </h4>
              </div>

              <div className="space-y-3 min-h-[80px]">
                {eventosDaColuna.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-slate-500 font-mono border border-dashed border-white/10 rounded-xl">
                    Nenhum card aqui
                  </div>
                )}

                {eventosDaColuna.map((evt) => {
                  const dataFormatada = new Date(evt.dataHorario).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  });
                  const proximo = PROXIMO_STATUS[evt.status];

                  return (
                    <div key={evt.id} className="gb-card p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="gb-badge-plat flex items-center gap-1">
                          {evt.canal.includes('Reels') || evt.canal.includes('TikTok') ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <Share2 className="w-3 h-3" />
                          )}
                          {evt.canal}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-white mb-1 line-clamp-1">{evt.titulo}</h5>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{evt.copy}</p>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mb-3">
                        <Clock className="w-3 h-3" />
                        <span>{dataFormatada}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => abrirModalEditar(evt)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removerEvento(evt.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {proximo && (
                          <button
                            onClick={() => avancarEtapa(evt)}
                            className="gb-btn-ghost flex items-center gap-1 !px-2.5 !py-1 text-[10px]"
                            title={`Mover para ${COLUNAS.find(c => c.status === proximo)?.titulo}`}
                          >
                            <span>Avançar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CARD */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="gb-panel max-w-lg w-full p-6 shadow-2xl space-y-4 bg-[#0f1522]">

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                {eventoParaEditar ? 'Editar Card' : 'Novo Card do Kanban'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarEventoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Título da Campanha / Post</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Anúncio Combo de Terça"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Data e Horário</label>
                  <input
                    type="datetime-local"
                    required
                    value={dataHorario}
                    onChange={(e) => setDataHorario(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Canal de Publicação</label>
                  <select
                    value={canal}
                    onChange={(e) => setCanal(e.target.value as CanalPublicacao)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Feed">Instagram Feed</option>
                    <option value="WhatsApp Status">WhatsApp Status</option>
                    <option value="Google Meu Negócio">Google Meu Negócio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Coluna do Kanban</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusEventoCalendario)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {COLUNAS.map(c => <option key={c.status} value={c.status}>{c.titulo}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Copy / Legenda da Publicação</label>
                <textarea
                  rows={3}
                  required
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  placeholder="Escreva ou cole a legenda persuasiva do post..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">Hashtags (separadas por espaço)</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#Setor #Oferta #LetsGrow"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="gb-btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="gb-btn"
                >
                  {eventoParaEditar ? 'Salvar Alterações' : 'Confirmar'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
