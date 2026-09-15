import { MONTAR_PROMPT_VISUAL } from '../servicos/servicoContextoVisual';
import { useEffect, useState } from 'react';
import { MockCampanhaConteudo, DiagnosticoCompleto } from '../tipos';
import { GERAR_IMAGEM_IMAGEN3 } from '../servicos/servicoGemini';
import { IDENTIFICAR_CATEGORIA_VISUAL, OBTER_DEFINICAO_CATEGORIA_VISUAL } from '../servicos/servicoCategoriasVisuais';
import { CategoriaEstilo } from '../servicos/servicoCategoriasEstilo';

/**
 * Resolve a imagem visual da campanha.
 * Após o diagnóstico o quadro começa vazio — sem Unsplash automático.
 * Só carrega imagem ao gerar com IA (ou ao escolher explicitamente "Foto Setor").
 */
export function useImagemCampanhaIA(campanha: MockCampanhaConteudo, diagnostico: DiagnosticoCompleto) {
  const [erro, setErro] = useState<string | null>(null);
  const [imagemUrl, setImagemUrl] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(false);
  const [modo, setModo] = useState<'ia' | 'curada'>('ia');
  const [semente, setSemente] = useState<number>(() => Math.floor(Math.random() * 10000));
  const [pedidoGeracao, setPedidoGeracao] = useState<number>(0);
  const [estiloSelecionado, setEstiloSelecionado] = useState<CategoriaEstilo | null>(null);

  const categoria = IDENTIFICAR_CATEGORIA_VISUAL(diagnostico.setor, diagnostico.nomeNegocio);
  const definicaoCategoria = OBTER_DEFINICAO_CATEGORIA_VISUAL(categoria);
  const promptAplicado = MONTAR_PROMPT_VISUAL(diagnostico, campanha, estiloSelecionado?.modificadorPrompt);

  useEffect(() => {
    let ativo = true;

    if (modo === 'curada') {
      setCarregando(false);
      setImagemUrl(definicaoCategoria.imagemCuradaUrl);
      return () => {
        ativo = false;
      };
    }

    // Modo IA: sem pedido ainda → quadro vazio
    if (pedidoGeracao === 0) {
      setCarregando(false);
      setImagemUrl('');
      return () => {
        ativo = false;
      };
    }

    setCarregando(true);
    setErro(null);

    GERAR_IMAGEM_IMAGEN3(promptAplicado).then(imgBase64 => {
      if (!ativo) return;
      if (imgBase64) {
        setImagemUrl(imgBase64);
      } else {
        setImagemUrl('');
        setErro('A IA não retornou uma imagem. Tente gerar novamente.');
      }
      setCarregando(false);
    });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptAplicado, semente, modo, pedidoGeracao, definicaoCategoria.imagemCuradaUrl]);

  const regenerar = () => {
    setModo('ia');
    setPedidoGeracao(n => n + 1);
    setSemente(Math.floor(Math.random() * 10000));
  };

  const aoErroImagem = () => {
    setImagemUrl('');
    setErro('Não foi possível carregar a imagem. Tente gerar uma nova versão.');
    setCarregando(false);
  };

  const selecionarEstilo = (novoEstilo: CategoriaEstilo) => {
    setEstiloSelecionado(prev => (prev?.id === novoEstilo.id ? null : novoEstilo));
    setModo('ia');
    setPedidoGeracao(n => n + 1);
    setSemente(Math.floor(Math.random() * 10000));
  };

  const setModoComPedido = (novo: 'ia' | 'curada') => {
    setModo(novo);
    if (novo === 'ia' && pedidoGeracao === 0) {
      // Usuário escolheu IA Generativa explicitamente → dispara geração
      setPedidoGeracao(1);
      setSemente(Math.floor(Math.random() * 10000));
    }
  };

  return {
    imagemUrl,
    promptAplicado,
    erro,
    carregando,
    modo,
    setModo: setModoComPedido,
    regenerar,
    aoErroImagem,
    aoCarregarImagem: () => undefined,
    estiloSelecionado,
    selecionarEstilo
  };
}
