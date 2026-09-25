import { GERAR_LEMBRETE_ICS } from '../servicos/servicoAgenda';
import React, { useState, useEffect } from 'react';
import { EventoCalendarioConteudo, CanalPublicacao, StatusEventoCalendario } from '../tipos';
import {
  OBTER_EVENTOS_CALENDARIO,
  CRIAR_EVENTO_CALENDARIO,
  ATUALIZAR_EVENTO_CALENDARIO,
  EXCLUIR_EVENTO_CALENDARIO
} from '../servicos/servicoPersistencia';
import {
  OBTER_SESSAO_INSTAGRAM,
  CONECTAR_INSTAGRAM_OAUTH,
  LIMPAR_SESSAO_INSTAGRAM,
  PUBLICAR_NO_INSTAGRAM,
  VERIFICAR_META_CONFIGURADO,
  CANAL_INSTAGRAM,
  TIPO_MIDIA_DO_CANAL,
  SessaoInstagram
} from '../servicos/servicoInstagram';
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Instagram
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
  { status: 'agendado', titulo: 'Agendadas manualmente', corPonto: 'bg-blue-400' },
  { status: 'publicado', titulo: 'Publicadas', corPonto: 'bg-green-400' }
];

const dataLocal = (data: Date) => new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const DESTINOS: Record<CanalPublicacao, string> = {
  'Instagram Reels': 'https://www.instagram.com/', 'Instagram Feed': 'https://www.instagram.com/',
  'TikTok': 'https://www.tiktok.com/upload', 'WhatsApp Status': 'https://web.whatsapp.com/',
  'Google Meu Negócio': 'https://business.google.com/'
};
const PROXIMO_STATUS: Record<StatusEventoCalendario, StatusEventoCalendario | null> = {
  rascunho: 'agendado',
  agendado: 'publicado',
  publicado: null
};

export const CalendarioConteudo: React.FC<PropriedadesCalendario> = ({ diagnosticoId, sinalDeAtualizacao }) => {
  const [eventos, setEventos] = useState<EventoCalendarioConteudo[]>([]);
  const [sessaoIg, setSessaoIg] = useState<SessaoInstagram | null>(() => OBTER_SESSAO_INSTAGRAM());
  const [metaConfigurado, setMetaConfigurado] = useState<boolean>(false);
  const [publicandoId, setPublicandoId] = useState<string | null>(null);
  const [msgIg, setMsgIg] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [eventoParaEditar, setEventoParaEditar] = useState<EventoCalendarioConteudo | null>(null);

  const [agora, setAgora] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setAgora(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const baixarLembrete = (evento: EventoCalendarioConteudo) => {
    const url = URL.createObjectURL(new Blob([GERAR_LEMBRETE_ICS(evento)], {type: 'text/calendar;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'lembrete-postagem.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const [semana, setSemana] = useState(0);
  const inicio = new Date(); inicio.setHours(0,0,0,0); inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7 + semana * 7);
  const fim = new Date(inicio); fim.setDate(fim.getDate() + 7);
  const eventosSemana = eventos.filter(e => new Date(e.dataHorario) >= inicio && new Date(e.dataHorario) < fim);
  // Campos do formulário
  const [titulo, setTitulo] = useState<string>('');
  const [dataHorario, setDataHorario] = useState<string>(dataLocal(new Date()));
  const [canal, setCanal] = useState<CanalPublicacao>('Instagram Reels');
  const [status, setStatus] = useState<StatusEventoCalendario>('rascunho');
  const [copy, setCopy] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('#GrowBiz #Estrategia2026');
  const [imagemUrl, setImagemUrl] = useState<string>('');

  const recarregarEventos = () => {
    const lista = OBTER_EVENTOS_CALENDARIO();
    setEventos(lista.filter(e => e.diagnosticoId === diagnosticoId).sort((a, b) => new Date(a.dataHorario).getTime() - new Date(b.dataHorario).getTime()));
  };

  useEffect(() => {
    recarregarEventos();
  }, [sinalDeAtualizacao, diagnosticoId]);

  const abrirModalNovo = () => {
    setEventoParaEditar(null);
    setTitulo('');
    setDataHorario(dataLocal(new Date(Date.now() + 86400000)));
    setCanal('Instagram Reels');
    setStatus('rascunho');
    setCopy('');
    setHashtags('#GrowBiz #Vendas #LetsGrow');
    setImagemUrl('');
    setModalAberto(true);
  };

  const abrirModalEditar = (evt: EventoCalendarioConteudo) => {
    setEventoParaEditar(evt);
    setTitulo(evt.titulo);
    setDataHorario(dataLocal(new Date(evt.dataHorario)));
    setCanal(evt.canal);
    setStatus(evt.status);
    setCopy(evt.copy);
    setHashtags(evt.hashtags.join(' '));
    setImagemUrl(evt.imagemUrl || '');
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
        imagemUrl: imagemUrl.trim() || undefined,
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
        imagemUrl: imagemUrl.trim() || undefined,
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

  useEffect(() => {
    VERIFICAR_META_CONFIGURADO().then(r => setMetaConfigurado(r.configurado)).catch(() => setMetaConfigurado(false));
  }, []);

  const conectarInstagram = async () => {
    setMsgIg(null);
    try {
      if (!metaConfigurado) {
        setMsgIg('Configure META_APP_ID, META_APP_SECRET e META_REDIRECT_URI no Vercel (veja docs/INSTAGRAM.md).');
        return;
      }
      const sessao = await CONECTAR_INSTAGRAM_OAUTH();
      setSessaoIg(sessao);
      setMsgIg('Conectado: @' + (sessao.igUsername || sessao.pageName || 'Instagram'));
    } catch (e) {
      setMsgIg(e instanceof Error ? e.message : 'Falha ao conectar Instagram.');
    }
  };

  const desconectarInstagram = () => {
    LIMPAR_SESSAO_INSTAGRAM();
    setSessaoIg(null);
    setMsgIg('Conta Instagram desconectada.');
  };

  const publicarNoInstagram = async (evt: EventoCalendarioConteudo) => {
    setMsgIg(null);
    if (!CANAL_INSTAGRAM(evt.canal)) return;
    const mediaUrl = (evt.imagemUrl || '').trim();
    if (!/^https:\/\//i.test(mediaUrl)) {
      setMsgIg('Para publicar, edite o card e cole uma URL HTTPS publica da imagem/video (exigencia da Meta).');
      return;
    }
    const mediaType = TIPO_MIDIA_DO_CANAL(evt.canal);
    const pareceImagem = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(mediaUrl);
    const pareceVideo = /\.(mp4|mov|m4v|webm)(\?|$)/i.test(mediaUrl);
    if (mediaType === 'REELS' && (!pareceVideo || (pareceImagem && !pareceVideo))) {
      setMsgIg('Este card e Instagram Reels: cole uma URL HTTPS publica de video (.mp4/.mov). Para imagem, troque o canal para Instagram Feed.');
      return;
    }
    setPublicandoId(evt.id);
    setMsgIg(mediaType === 'REELS' ? 'Publicando Reel… isso pode levar 1–2 min.' : 'Publicando no Instagram…');
    try {
      if (!OBTER_SESSAO_INSTAGRAM()) {
        const sessao = await CONECTAR_INSTAGRAM_OAUTH();
        setSessaoIg(sessao);
      }
      const hashtagTxt = (evt.hashtags || []).map(h => (h.startsWith('#') ? h : '#' + h)).join(' ');
      const caption = [evt.copy, hashtagTxt].filter(Boolean).join('\n\n');
      await PUBLICAR_NO_INSTAGRAM({
        caption,
        mediaUrl,
        mediaType,
        onProgress: (msg) => setMsgIg(msg)
      });
      ATUALIZAR_EVENTO_CALENDARIO({ ...evt, status: 'publicado' });
      recarregarEventos();
      setMsgIg('Publicado no Instagram com sucesso.');
    } catch (e) {
      setMsgIg(e instanceof Error ? e.message : 'Falha ao publicar no Instagram.');
    } finally {
      setPublicandoId(null);
    }
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
            Organize, prepare e publique nos seus canais.
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          className="gb-btn flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Card</span>
        </button>
          <div className="flex items-center gap-2 flex-wrap">
            {sessaoIg ? (
              <>
                <span className="text-[11px] text-emerald-300 font-mono">@{sessaoIg.igUsername || sessaoIg.pageName || "IG"}</span>
                <button type="button" onClick={desconectarInstagram} className="text-[11px] text-slate-400 underline">Desconectar</button>
              </>
            ) : (
              <button type="button" onClick={conectarInstagram} className="gb-btn-ghost flex items-center gap-1.5 !px-3 !py-1.5 text-[11px]">
                <Instagram className="w-3.5 h-3.5" />
                <span>Conectar Instagram</span>
              </button>
            )}
          </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button type="button" className="gb-btn-ghost flex items-center gap-1" onClick={() => setSemana(s => s - 1)}>
          <ChevronLeft className="w-4 h-4" /><span>Semana anterior</span>
        </button>
        <span>{inicio.toLocaleDateString('pt-BR')} a {new Date(fim.getTime() - 1).toLocaleDateString('pt-BR')}</span>
        <button type="button" className="gb-btn-ghost" onClick={() => setSemana(0)}>Hoje</button>
        <button type="button" className="gb-btn-ghost flex items-center gap-1" onClick={() => setSemana(s => s + 1)}>
          <span>Próxima semana</span><ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div data-gb-week-strip className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const dia = new Date(inicio);
          dia.setDate(inicio.getDate() + i);
          const hoje = new Date();
          const ehHoje = dia.toDateString() === hoje.toDateString();
          const label = dia.toLocaleDateString('pt-BR', { weekday: 'short' });
          return (
            <div
              key={i}
              className={`rounded-xl border px-2 py-2 text-center ${ehHoje ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-slate-900/40'}`}
            >
              <div className="text-[10px] font-mono uppercase text-slate-400">{label}</div>
              <div className="text-sm font-bold text-white">{dia.getDate()}</div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">Agendamento manual: abrir o canal não publica o conteúdo. Confirme a postagem na rede social antes de marcar como publicada.</p>
      {msgIg && (
        <p className="text-xs font-mono mb-3 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-200">{msgIg}</p>
      )}
      <p className="text-xs text-slate-400">Use “Lembrete” para importar no seu calendário um alerta 30 minutos antes da postagem, inclusive com o app fechado.</p>
      {eventosSemana.some(e => e.status !== 'publicado' && new Date(e.dataHorario).getTime() < agora + 3600000) && <p role="status" className="text-amber-300 text-sm">Há postagens pendentes ou previstas para a próxima hora. Confira as datas abaixo.</p>}
      {/* QUADRO KANBAN DE 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUNAS.map((coluna) => {
          const eventosDaColuna = eventosSemana.filter(e => e.status === coluna.status);
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
                    <div key={evt.id} className={`gb-card p-4 border-t-2 ${evt.status === 'publicado' ? 'border-t-emerald-400' : new Date(evt.dataHorario) < new Date() ? 'border-t-amber-400' : 'border-t-blue-400'}`}>
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

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200 mb-3">
                        <Clock className="w-3 h-3" />
                        <span>{dataFormatada}</span>
                      </div>

                      <button type="button" onClick={() => baixarLembrete(evt)} className="text-xs text-blue-300 underline mb-3 mr-4">Lembrete</button>
                      <a href={DESTINOS[evt.canal]} target="_blank" rel="noopener noreferrer" className="text-blue-300 text-xs underline block mb-3">Abrir {evt.canal} ↗</a>
                      {CANAL_INSTAGRAM(evt.canal) && evt.status !== 'publicado' && (
                        <button
                          type="button"
                          onClick={() => publicarNoInstagram(evt)}
                          disabled={publicandoId === evt.id}
                          className="mb-3 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[11px] font-mono font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          <span>{publicandoId === evt.id ? 'Publicando...' : 'Publicar no Instagram'}</span>
                        </button>
                      )}
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
                            <span>{proximo === 'publicado' ? 'Confirmar publicação' : 'Agendar manualmente'}</span>
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
            <label className="block text-xs font-mono text-slate-400 mb-1 mt-3">URL publica da midia (HTTPS) — obrigatoria para publicar no Instagram</label>
            <input
              type="url"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
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
