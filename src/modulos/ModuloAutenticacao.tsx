import React, { useState } from 'react';
import { PerfilUsuario, ModeloOperacional, EscopoGeografico } from '../tipos';
import { OBTER_CAMPO_LOCALIDADE_ESCOPO, OPCOES_ESCOPO_GEOGRAFICO } from '../utilitarios/escopoGeograficoUi';
import { CRIAR_USUARIO_DEMO, SALVAR_SESSAO_USUARIO } from '../servicos/servicoAutenticacao';
import { Mail, Phone, Lock, Building, ArrowRight, ShieldCheck } from 'lucide-react';

interface PropriedadesAutenticacao {
  aoAutenticar: (usuario: PerfilUsuario) => void;
}

export const ModuloAutenticacao: React.FC<PropriedadesAutenticacao> = ({ aoAutenticar }) => {
  const [tipoAba, setTipoAba] = useState<'email' | 'telefone'>('email');
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [nomeEmpresa, setNomeEmpresa] = useState<string>('');
  const [setor, setSetor] = useState<string>('Cafeteria e Varejo');
  const [modeloOperacional, setModeloOperacional] = useState<ModeloOperacional>('Presencial');
  const [escopoGeografico, setEscopoGeografico] = useState<EscopoGeografico>('Local');
  const [cidade, setCidade] = useState<string>('');

  const processarLoginOuCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    const novoUsuario: PerfilUsuario = {
      id: `usr_${Date.now()}`,
      nomeEmpresaOuUsuario: nomeEmpresa || 'Minha Empresa GrowBiz',
      email: email || 'usuario@growbiz.com.br',
      telefone: telefone || '(11) 99999-8888',
      setor: setor || 'Varejo e Serviços',
      modeloOperacional,
      escopoGeografico,
      cidade: cidade.trim() || undefined,
      dataCriacao: new Date().toISOString()
    };
    SALVAR_SESSAO_USUARIO(novoUsuario);
    aoAutenticar(novoUsuario);
  };

  const entrarComAcessoDemo = () => {
    const usuarioDemo = CRIAR_USUARIO_DEMO();
    aoAutenticar(usuarioDemo);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
        
        {/* ELEMENTO DECORATIVO DE FUNDO */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* CABEÇALHO DA TELA DE AUTH */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 text-white font-extrabold text-2xl mb-3 shadow-lg shadow-blue-500/20">
            7
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            GROWBIZ <span className="text-blue-400 font-mono text-xl">V2.2</span>
          </h2>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-1 font-mono">
            LetsGrow • Engenharia de Loop Ativa
          </p>
        </div>

        {/* BOTAO DE ENTRADA RÁPIDA DE DEMONSTRAÇÃO */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/90 border border-blue-500/40 text-center">
          <span className="text-xs font-bold font-mono text-blue-300 uppercase tracking-wide block mb-1">
            ⚡ Modo de Demonstração Instantânea
          </span>
          <p className="text-[11px] text-slate-400 mb-3">
            Acesse imediatamente com perfil de café especial pré-configurado
          </p>
          <button
            onClick={entrarComAcessoDemo}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-500/20 uppercase tracking-wider"
          >
            <span>Acessar SaaS com Perfil Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <span className="relative px-3 bg-slate-900 text-[10px] text-slate-400 font-mono uppercase tracking-widest">ou autentique seu negócio</span>
        </div>

        {/* ABAS DE LOGIN */}
        <div className="flex bg-slate-800 p-1 rounded-lg mb-5 border border-slate-700">
          <button
            onClick={() => setTipoAba('email')}
            className={`flex-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tipoAba === 'email' ? 'bg-slate-700 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail & Senha</span>
          </button>
          <button
            onClick={() => setTipoAba('telefone')}
            className={`flex-1 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tipoAba === 'telefone' ? 'bg-slate-700 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>SMS / Telefone</span>
          </button>
        </div>

        {/* FORMULÁRIO DE CADASTRO/LOGIN */}
        <form onSubmit={processarLoginOuCadastro} className="space-y-4">
          
          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">Nome da Empresa ou Marca</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Ex: Cafeteria & Varejo Silva"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">Setor Principal de Atuação</label>
            <input
              type="text"
              required
              placeholder="Ex: Cafeteria, Gastronomia, Varejo"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {tipoAba === 'email' ? (
            <>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">Número do Celular (com DDD)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Modelo Operacional</label>
              <select
                value={modeloOperacional}
                onChange={(e) => setModeloOperacional(e.target.value as ModeloOperacional)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Presencial">Presencial</option>
                <option value="Online">Online</option>
                <option value="Híbrido">Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Escopo Geográfico</label>
              <select
                value={escopoGeografico}
                onChange={(e) => setEscopoGeografico(e.target.value as EscopoGeografico)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {OPCOES_ESCOPO_GEOGRAFICO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
              </select>
            </div>
            {(() => {
              const campo = OBTER_CAMPO_LOCALIDADE_ESCOPO(escopoGeografico);
              if (!campo.mostrar) return null;
              return (
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">{campo.label}</label>
                <input
                  type="text"
                  required={campo.obrigatorio}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder={campo.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              );
            })()}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 mt-4 uppercase tracking-wider shadow-md shadow-blue-500/20"
          >
            <span>Iniciar Consultoria Estratégica</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] font-mono text-slate-500 flex items-center justify-center space-x-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span>Segurança Firebase Auth & Firestore V2.2 Model</span>
        </div>

      </div>
    </div>
  );
};

