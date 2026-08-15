import React, { useState, useEffect } from 'react';
import { PerfilUsuario, DiagnosticoCompleto, ResultadoCompletoConsultoria } from './tipos';
import { OBTER_USUARIO_LOGADO, ENCERRAR_SESSAO, CRIAR_USUARIO_DEMO } from './servicos/servicoAutenticacao';
import { SIMULAR_PROCESSAMENTO_COMPLETO_IA, GERAR_ESTRATEGIA_TRIPLA, GERAR_MOCK_CAMPANHA_MODULO_3, GERAR_PERFORMANCE_E_ALERTA } from './servicos/servicoIA';
import { CRIAR_DIAGNOSTICO_COMPLETO } from './servicos/servicoDiagnostico';

import { CabecalhoSaaS } from './componentes/CabecalhoSaaS';
import { ModuloAutenticacao } from './modulos/ModuloAutenticacao';
import { ModuloDiagnostico } from './modulos/ModuloDiagnostico';
import { ModuloCarregamentoIA } from './modulos/ModuloCarregamentoIA';
import { ModuloResultadosMocks } from './modulos/ModuloResultadosMocks';

export default function App() {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<'autenticacao' | 'diagnostico' | 'carregamento' | 'resultados'>('autenticacao');
  
  // Estado de processamento da IA
  const [textoCarregamento, setTextoCarregamento] = useState<string>('');
  const [percentualCarregamento, setPercentualCarregamento] = useState<number>(0);
  
  // Resultado gerado
  const [resultadoConsultoria, setResultadoConsultoria] = useState<ResultadoCompletoConsultoria | null>(null);

  // Carregar sessão ao iniciar
  useEffect(() => {
    const usuarioSalvo = OBTER_USUARIO_LOGADO();
    if (usuarioSalvo) {
      setUsuario(usuarioSalvo);
      setModuloAtivo('diagnostico');
    }
  }, []);

  const aoAutenticarUsuario = (usuarioLogado: PerfilUsuario) => {
    setUsuario(usuarioLogado);
    setModuloAtivo('diagnostico');
  };

  const aoSairDaConta = () => {
    ENCERRAR_SESSAO();
    setUsuario(null);
    setResultadoConsultoria(null);
    setModuloAtivo('autenticacao');
  };

  const iniciarDiagnosticoComIA = async (diagnostico: DiagnosticoCompleto) => {
    setModuloAtivo('carregamento');
    setPercentualCarregamento(5);
    setTextoCarregamento('Iniciando análise com AI Core...');

    try {
      const resultadoFinal = await SIMULAR_PROCESSAMENTO_COMPLETO_IA(
        diagnostico,
        (etapa, percentual) => {
          setTextoCarregamento(etapa);
          setPercentualCarregamento(percentual);
        }
      );

      setResultadoConsultoria(resultadoFinal);
      setModuloAtivo('resultados');
    } catch (e) {
      console.error("Erro no processamento da IA:", e);
      // Fallback seguro
      const eTripla = GERAR_ESTRATEGIA_TRIPLA(diagnostico);
      const cMock = GERAR_MOCK_CAMPANHA_MODULO_3(diagnostico);
      const { kpis, alerta } = GERAR_PERFORMANCE_E_ALERTA(diagnostico);

      setResultadoConsultoria({
        diagnostico,
        estrategias: eTripla,
        campanhaMock: cMock,
        kpisSimulados: kpis,
        alertaPivotagem: alerta
      });
      setModuloAtivo('resultados');
    }
  };

  const aoReiniciarDiagnostico = () => {
    setModuloAtivo('diagnostico');
  };

  return (
    <div className="gb-bg-app min-h-screen text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      
      {/* CABEÇALHO SAAS */}
      <CabecalhoSaaS
        usuario={usuario}
        moduloAtivo={moduloAtivo}
        aoNavegarPara={(mod) => setModuloAtivo(mod)}
        aoSair={aoSairDaConta}
        aoReiniciarDiagnostico={aoReiniciarDiagnostico}
      />

      {/* CONTEÚDO PRINCIPAL DO MÓDULO */}
      <main className="pb-16">
        {moduloAtivo === 'autenticacao' && (
          <ModuloAutenticacao aoAutenticar={aoAutenticarUsuario} />
        )}

        {moduloAtivo === 'diagnostico' && usuario && (
          <ModuloDiagnostico usuario={usuario} aoConcluirDiagnostico={iniciarDiagnosticoComIA} />
        )}

        {moduloAtivo === 'carregamento' && (
          <ModuloCarregamentoIA etapaTexto={textoCarregamento} percentual={percentualCarregamento} />
        )}

        {moduloAtivo === 'resultados' && resultadoConsultoria && (
          <ModuloResultadosMocks
            resultado={resultadoConsultoria}
            aoRefazerDiagnostico={aoReiniciarDiagnostico}
          />
        )}
      </main>

      {/* RODAPÉ DISCRETO */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Plataforma SaaS "7777" (LetsGrow) • Produto: GrowBiz V2.2</span>
          <span>Consultor Estratégico Omnichannel Proativo 24/7 • Clean Code PT-BR</span>
        </div>
      </footer>

    </div>
  );
}
