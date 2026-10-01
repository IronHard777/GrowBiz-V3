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
import { ModuloEscolhaTier } from './modulos/ModuloEscolhaTier';
import { IdTierPlano } from './tipos/tierPlano';

type ModuloId = 'autenticacao' | 'diagnostico' | 'carregamento' | 'escolha-tier' | 'resultados';

export default function App() {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('autenticacao');
  const [tierSelecionado, setTierSelecionado] = useState<IdTierPlano | null>(null);
  
  // Estado de processamento da IA
  const [textoCarregamento, setTextoCarregamento] = useState<string>('');
  const [percentualCarregamento, setPercentualCarregamento] = useState<number>(0);
  
  // Resultado gerado
  const [resultadoConsultoria, setResultadoConsultoria] = useState<ResultadoCompletoConsultoria | null>(null);

  // Carregar sessão ao iniciar → escolha de tier antes do diagnóstico
  useEffect(() => {
    const usuarioSalvo = OBTER_USUARIO_LOGADO();
    if (usuarioSalvo) {
      setUsuario(usuarioSalvo);
      setModuloAtivo('escolha-tier');
    }
  }, []);

  const aoAutenticarUsuario = (usuarioLogado: PerfilUsuario) => {
    setUsuario(usuarioLogado);
    setModuloAtivo('escolha-tier');
  };

  const aoSairDaConta = () => {
    ENCERRAR_SESSAO();
    setUsuario(null);
    setResultadoConsultoria(null);
    setTierSelecionado(null);
    setModuloAtivo('autenticacao');
  };

  const iniciarDiagnosticoComIA = async (diagnostico: DiagnosticoCompleto) => {
    if (!tierSelecionado) {
      setModuloAtivo('escolha-tier');
      return;
    }

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
    setResultadoConsultoria(null);
    // Mantém o plano: Novo Filtro volta às 7 perguntas; sem tier → escolha-tier
    setModuloAtivo(tierSelecionado ? 'diagnostico' : 'escolha-tier');
  };

  const aoEscolherTier = (id: IdTierPlano) => {
    setTierSelecionado(id);
    // Já tem resultado (Trocar plano): volta aos resultados com o novo tier, sem re-rodar IA
    // Ainda sem diagnóstico: segue para as 7 perguntas
    if (resultadoConsultoria) {
      setModuloAtivo('resultados');
    } else {
      setModuloAtivo('diagnostico');
    }
  };

  const aoTrocarTier = () => {
    setModuloAtivo('escolha-tier');
  };

  const aoNavegarModulo = (mod: ModuloId) => {
    if (mod === 'autenticacao' || mod === 'escolha-tier') {
      setModuloAtivo(mod);
      return;
    }
    // Guard: diagnóstico / carregamento / resultados exigem tier
    if (!tierSelecionado) {
      setModuloAtivo('escolha-tier');
      return;
    }
    if (mod === 'resultados' && !resultadoConsultoria) {
      setModuloAtivo('diagnostico');
      return;
    }
    if (mod === 'carregamento') {
      // Não navegar manualmente para o loading
      setModuloAtivo(resultadoConsultoria ? 'resultados' : 'diagnostico');
      return;
    }
    setModuloAtivo(mod);
  };

  return (
    <div className="gb-bg-app min-h-screen text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      
      {/* CABEÇALHO SAAS */}
      <CabecalhoSaaS
        usuario={usuario}
        moduloAtivo={moduloAtivo}
        tierSelecionado={tierSelecionado}
        temResultado={!!resultadoConsultoria}
        aoNavegarPara={aoNavegarModulo}
        aoSair={aoSairDaConta}
        aoReiniciarDiagnostico={aoReiniciarDiagnostico}
        aoTrocarTier={aoTrocarTier}
      />

      {/* CONTEÚDO PRINCIPAL DO MÓDULO */}
      <main className="pb-16">
        {moduloAtivo === 'autenticacao' && (
          <ModuloAutenticacao aoAutenticar={aoAutenticarUsuario} />
        )}

        {moduloAtivo === 'escolha-tier' && usuario && (
          <ModuloEscolhaTier
            aoEscolher={aoEscolherTier}
            tierAtual={tierSelecionado}
            jaTemResultado={!!resultadoConsultoria}
          />
        )}

        {moduloAtivo === 'diagnostico' && usuario && tierSelecionado && (
          <ModuloDiagnostico
            usuario={usuario}
            tier={tierSelecionado}
            aoConcluirDiagnostico={iniciarDiagnosticoComIA}
            aoTrocarTier={aoTrocarTier}
          />
        )}

        {moduloAtivo === 'carregamento' && (
          <ModuloCarregamentoIA etapaTexto={textoCarregamento} percentual={percentualCarregamento} />
        )}

        {moduloAtivo === 'resultados' && resultadoConsultoria && tierSelecionado && (
          <ModuloResultadosMocks
            resultado={resultadoConsultoria}
            tier={tierSelecionado}
            aoRefazerDiagnostico={aoReiniciarDiagnostico}
            aoTrocarTier={aoTrocarTier}
          />
        )}
      </main>

      {/* RODAPÉ DISCRETO */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Plataforma SaaS "7777" (LetsGrow) · Produto: GrowBiz V2.2</span>
          <span>Consultor Estratégico Omnichannel Proativo 24/7 · Clean Code PT-BR</span>
        </div>
      </footer>

    </div>
  );
}
