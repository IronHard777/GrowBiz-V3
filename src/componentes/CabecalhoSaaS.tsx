import React from 'react';
import { PerfilUsuario } from '../tipos';
import { Sparkles, LogOut, RefreshCw, Clapperboard, Compass } from 'lucide-react';

interface PropriedadesCabecalho {
  usuario: PerfilUsuario | null;
  moduloAtivo: 'autenticacao' | 'diagnostico' | 'carregamento' | 'resultados';
  aoNavegarPara: (modulo: 'autenticacao' | 'diagnostico' | 'carregamento' | 'resultados') => void;
  aoSair: () => void;
  aoReiniciarDiagnostico: () => void;
}

export const CabecalhoSaaS: React.FC<PropriedadesCabecalho> = ({
  usuario,
  moduloAtivo,
  aoNavegarPara,
  aoSair,
  aoReiniciarDiagnostico
}) => {
  return (
    <header className="text-white sticky top-0 z-50 backdrop-blur-md bg-[#0b0f1a]/85 border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Geometric Balance Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-extrabold text-xl text-white shadow-md shadow-blue-500/20">
            7
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                GROWBIZ <span className="text-blue-400 font-mono text-sm ml-1">V2.2</span>
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              LETSGROW <span className="text-slate-600">|</span> LOOP ENGINEERING
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DOS MÓDULOS */}
        {usuario && moduloAtivo !== 'autenticacao' && (
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => aoNavegarPara('diagnostico')}
              className={`gb-tab flex items-center space-x-2 ${moduloAtivo === 'diagnostico' ? 'gb-tab-active' : ''}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Módulo 1: Diagnóstico</span>
            </button>

            <button
              onClick={() => aoNavegarPara('resultados')}
              disabled={moduloAtivo === 'diagnostico'}
              className={`gb-tab flex items-center space-x-2 ${moduloAtivo === 'resultados' ? 'gb-tab-active' : ''}`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Módulos 2, 3 & 4: Resultados</span>
            </button>
          </nav>
        )}

        {/* STATUS ONLINE & PERFIL */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-md border border-slate-700 text-[11px] font-mono">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-slate-300 font-bold uppercase tracking-wider">SISTEMA ONLINE</span>
          </div>

          {usuario ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white">{usuario.nomeEmpresaOuUsuario}</span>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{usuario.setor || 'Setor Mapeado'}</span>
              </div>
              <button
                onClick={aoReiniciarDiagnostico}
                title="Novo Diagnóstico IA"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="hidden xl:inline text-[11px] font-mono uppercase">Novo Filtro</span>
              </button>
              <button
                onClick={aoSair}
                title="Sair da Conta"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">MODO CONVIDADO</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

