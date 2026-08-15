import { useEffect, useState } from 'react';
import { MockCampanhaConteudo } from '../tipos';
import { GERAR_IMAGEM_IMAGEN3 } from '../servicos/servicoGemini';
import { IDENTIFICAR_CATEGORIA_VISUAL, OBTER_DEFINICAO_CATEGORIA_VISUAL } from '../servicos/servicoCategoriasVisuais';
import { CategoriaEstilo } from '../servicos/servicoCategoriasEstilo';

/**
 * Resolve a imagem visual da campanha (real via Imagen 3, ou curada por categoria como fallback)
 * em um único lugar. Antes, CardCampanhaMock e VisualizadorRoteiroVideo resolviam suas próprias
 * imagens de forma independente — o player de vídeo nunca via a imagem real gerada pela IA,
 * apenas um banco de fotos fixo próprio com só 2 categorias.
 */
export function useImagemCampanhaIA(campanha: MockCampanhaConteudo) {
  const [imagemUrl, setImagemUrl] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modo, setModo] = useState<'ia' | 'curada'>('ia');
  const [semente, setSemente] = useState<number>(() => Math.floor(Math.random() * 10000));
  const [estiloSelecionado, setEstiloSelecionado] = useState<CategoriaEstilo | null>(null);

  const categoria = IDENTIFICAR_CATEGORIA_VISUAL(campanha.promptImagemIa, campanha.tituloCampanha);
  const definicaoCategoria = OBTER_DEFINICAO_CATEGORIA_VISUAL(categoria);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);

    const promptBase = campanha.promptImagemIa || campanha.tituloCampanha;
    const promptComEstilo = estiloSelecionado ? `${promptBase}, ${estiloSelecionado.modificadorPrompt}` : promptBase;

    if (modo === 'ia') {
      GERAR_IMAGEM_IMAGEN3(promptComEstilo).then(imgBase64 => {
        if (!ativo) return;
        if (imgBase64) {
          setImagemUrl(imgBase64);
        } else {
          // Fallback para Pollinations com as palavras-chave da categoria identificada (+ estilo, se houver)
          const palavrasChave = estiloSelecionado
            ? `${definicaoCategoria.palavrasChaveImagemIa}, ${estiloSelecionado.modificadorPrompt}`
            : definicaoCategoria.palavrasChaveImagemIa;
          const query = encodeURIComponent(`${palavrasChave}, seed ${semente}`);
          setImagemUrl(`https://image.pollinations.ai/prompt/${query}?width=1000&height=1000&seed=${semente}&nologo=true`);
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
  }, [campanha.promptImagemIa, campanha.tituloCampanha, semente, modo, estiloSelecionado]);

  const regenerar = () => setSemente(Math.floor(Math.random() * 10000));

  const aoErroImagem = () => {
    setImagemUrl(definicaoCategoria.imagemCuradaUrl);
    setCarregando(false);
  };

  const selecionarEstilo = (novoEstilo: CategoriaEstilo) => {
    setEstiloSelecionado(prev => (prev?.id === novoEstilo.id ? null : novoEstilo));
  };

  return {
    imagemUrl,
    carregando,
    modo,
    setModo,
    regenerar,
    aoErroImagem,
    aoCarregarImagem: () => setCarregando(false),
    estiloSelecionado,
    selecionarEstilo
  };
}
