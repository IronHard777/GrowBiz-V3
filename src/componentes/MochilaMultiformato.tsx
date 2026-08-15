import React, { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, FileUp, Sparkles, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DiagnosticoCompleto, CenaRoteiroVideo } from '../tipos';
import { GERAR_COPY_PERSUASIVA_GEMINI, TEM_CHAVE_GEMINI_CONFIGURADA } from '../servicos/servicoGemini';
import { CONVERTER_ARQUIVOS_PARA_ANEXOS_IA, ARQUIVO_SUPORTADO_PELA_IA } from '../servicos/servicoArquivosIA';

interface AtualizacaoCampanhaPersonalizada {
  copyPersuasiva: string;
  hashtagsEstrategicas: string[];
  promptImagemIa: string;
  roteiroVideo: CenaRoteiroVideo[];
}

interface PropriedadesMochila {
  diagnostico: DiagnosticoCompleto;
  objetivoPrincipal: string;
  aoPersonalizarCampanha: (atualizacoes: AtualizacaoCampanhaPersonalizada) => void;
}

export const MochilaMultiformato: React.FC<PropriedadesMochila> = ({ diagnostico, objetivoPrincipal, aoPersonalizarCampanha }) => {
  const [arquivosAnexados, setArquivosAnexados] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState<boolean>(false);
  const [processando, setProcessando] = useState<boolean>(false);
  const [status, setStatus] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const temChaveGemini = TEM_CHAVE_GEMINI_CONFIGURADA();

  const processarArquivos = (listaArquivos: FileList | null) => {
    if (!listaArquivos) return;
    setArquivosAnexados(prev => [...prev, ...Array.from(listaArquivos)]);
    setStatus(null);
  };

  const removerArquivo = (index: number) => {
    setArquivosAnexados(prev => prev.filter((_, i) => i !== index));
  };

  const personalizarCampanhaComIA = async () => {
    const arquivosSuportados = arquivosAnexados.filter(ARQUIVO_SUPORTADO_PELA_IA);
    if (arquivosSuportados.length === 0) {
      setStatus({ tipo: 'erro', texto: 'Nenhum arquivo suportado pela IA foi anexado. Use imagens (JPG, PNG) ou PDF.' });
      return;
    }

    setProcessando(true);
    setStatus(null);
    try {
      const anexos = await CONVERTER_ARQUIVOS_PARA_ANEXOS_IA(arquivosSuportados);
      const resultado = await GERAR_COPY_PERSUASIVA_GEMINI(diagnostico, objetivoPrincipal, anexos);

      if (resultado) {
        aoPersonalizarCampanha({
          copyPersuasiva: resultado.copy,
          hashtagsEstrategicas: resultado.hashtags,
          promptImagemIa: resultado.promptImagem,
          roteiroVideo: resultado.roteiroVideo
        });
        setStatus({ tipo: 'sucesso', texto: `Campanha personalizada com base em ${arquivosSuportados.length} arquivo(s) real(is)!` });
      } else {
        setStatus({ tipo: 'erro', texto: 'A IA não retornou um resultado válido. Tente novamente em instantes.' });
      }
    } catch (erro) {
      console.warn('Erro ao personalizar campanha com arquivos anexados:', erro);
      setStatus({ tipo: 'erro', texto: 'Falha ao processar os arquivos anexados.' });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-6 text-slate-100">
      <div className="flex items-center space-x-2 mb-3">
        <FileUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-bold text-white">Input Multiformato (Módulo 3)</h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
          Opcional
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Anexe catálogos, cardápios em PDF ou fotos do seu produto para que a IA personalize as campanhas e cópias com base no seu material real.
      </p>

      {!temChaveGemini && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Chave do Gemini não configurada — os arquivos anexados não poderão ser analisados pela IA nesta sessão.</span>
        </div>
      )}

      {/* ÁREA DE DRAG AND DROP / SELEÇÃO MANUAL */}
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          processarArquivos(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          arrastando
            ? 'border-emerald-400 bg-emerald-500/10 scale-[0.99]'
            : 'border-slate-700/80 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80'
        }`}
      >
        <input
          type="file"
          id="input-arquivo-multiformato"
          multiple
          accept=".pdf,image/*,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => processarArquivos(e.target.files)}
        />
        <label htmlFor="input-arquivo-multiformato" className="cursor-pointer flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
          <span className="text-xs font-semibold text-slate-200">
            Arraste e solte arquivos aqui, ou <span className="text-emerald-400 underline">clique para selecionar</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            A IA lê imagens e PDFs (Até 20MB cada). DOC/DOCX/TXT ficam apenas anexados como referência.
          </span>
        </label>
      </div>

      {/* LISTA DE ARQUIVOS ANEXADOS */}
      {arquivosAnexados.length > 0 && (
        <div className="mt-4 space-y-2">
          <span className="text-xs font-medium text-slate-300">Arquivos anexados:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {arquivosAnexados.map((arquivo, idx) => {
              const suportado = ARQUIVO_SUPORTADO_PELA_IA(arquivo);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {arquivo.type.includes('pdf') ? (
                      <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                    <span className="truncate text-slate-200 font-medium">{arquivo.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({(arquivo.size / 1024).toFixed(1)} KB)</span>
                    {!suportado && (
                      <span className="text-[9px] text-amber-400 font-mono uppercase flex-shrink-0">Não lido pela IA</span>
                    )}
                  </div>
                  <button
                    onClick={() => removerArquivo(idx)}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={personalizarCampanhaComIA}
            disabled={processando || !temChaveGemini}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{processando ? 'Analisando material real com IA...' : 'Personalizar Campanha com Material Anexado'}</span>
          </button>

          {status && (
            <div className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
              status.tipo === 'sucesso'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}>
              {status.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{status.texto}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
