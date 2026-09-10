import { MONTAR_PROMPT_VISUAL } from '../servicos/servicoContextoVisual';
import { useEffect, useState } from 'react';
import { MockCampanhaConteudo, DiagnosticoCompleto } from '../tipos';
import { GERAR_IMAGEM_IMAGEN3 } from '../servicos/servicoGemini';
import { IDENTIFICAR_CATEGORIA_VISUAL, OBTER_DEFINICAO_CATEGORIA_VISUAL } from '../servicos/servicoCategoriasVisuais';
import { CategoriaEstilo } from '../servicos/servicoCategoriasEstilo';

/**
 * Resolve a imagem visual da campanha (real via Imagen 3, ou curada por categoria como fallback)
 * em um único lugar. Antes, CardCampanhaMock e VisualizadorRoteiroVideo resolviam suas próprias
 * imagens de forma independente — o player de vídeo nunca via a imagem real gerada pela IA,
 * apenas um banco de fotos fixo próprio com só 2 categorias.
 */
export function useImagemCampanhaIA(campanha: MockCampanhaConteudo, diagnostico: DiagnosticoCompleto) {
  const [erro, setErro] = useState<string | null>(null);
  const [imagemUrl, setImagemUrl] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modo, setModo] = useState<'ia' | 'curada'>('curada');
  const [semente, setSemente] = useState<number>(() => Math.floor(Math.random() * 10000));
  const [estiloSelecionado, setEstiloSelecionado] = useState<CategoriaEstilo | null>(null);

  const categoria = IDENTIFICAR_CATEGORIA_VISUAL(diagnostico.setor, diagnostico.nomeNegocio);
  const definicaoCategoria = OBTER_DEFINICAO_CATEGORIA_VISUAL(categoria);
  const promptAplicado = MONTAR_PROMPT_VISUAL(diagnostico, campanha, estiloSelecionado?.modificadorPrompt);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    if (modo === 'ia') setErro(null);

    if (modo === 'ia') {
      GERAR_IMAGEM_IMAGEN3(promptAplicado).then(imgBase64 => {
        if (!ativo) return;
        if (imgBase64) {
          setImagemUrl(imgBase64);
        } else {
          setImagemUrl(definicaoCategoria.imagemCuradaUrl);
          setModo('curada');
          setErro('A IA não retornou uma imagem. Exibindo uma foto de referência do setor.');
        }
        setCarregando(false);
      });
    } else {
      setImagemUrl(definicaoCategoria.imagemCuradaUrl);
      setCarregando(false);
    }

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptAplicado, semente, modo, definicaoCategoria.imagemCuradaUrl]);

  const regenerar = () => setSemente(Math.floor(Math.random() * 10000));

  const aoErroImagem = () => {
    setImagemUrl(definicaoCategoria.imagemCuradaUrl);
    setErro('Não foi possível carregar a imagem. Tente gerar uma nova versão.');
    setModo('curada');
    setCarregando(false);
  };

  const selecionarEstilo = (novoEstilo: CategoriaEstilo) => {
    setEstiloSelecionado(prev => (prev?.id === novoEstilo.id ? null : novoEstilo));
    setModo('ia');
  };

  return {
    imagemUrl,
    promptAplicado,
    erro,
    carregando,
    modo,
    setModo,
    regenerar,
    aoErroImagem,
    aoCarregarImagem: () => undefined,
    estiloSelecionado,
    selecionarEstilo
  };
}
