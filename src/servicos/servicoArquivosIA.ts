import { AnexoArquivoIA } from './servicoGemini';

/**
 * Tipos de arquivo que o Gemini consegue interpretar diretamente como conteúdo multimodal
 * (imagem e PDF). DOC/DOCX/TXT ficam de fora — o modelo não lê esses formatos como inlineData.
 */
export function ARQUIVO_SUPORTADO_PELA_IA(arquivo: File): boolean {
  return arquivo.type.startsWith('image/') || arquivo.type === 'application/pdf';
}

function lerArquivoComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result as string;
      resolve(resultado.split(',')[1] || '');
    };
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

/**
 * Converte arquivos reais anexados pelo usuário (catálogo, cardápio, fotos de produto) em
 * anexos multimodais prontos para serem enviados ao Gemini junto do prompt de geração.
 */
export async function CONVERTER_ARQUIVOS_PARA_ANEXOS_IA(arquivos: File[]): Promise<AnexoArquivoIA[]> {
  const suportados = arquivos.filter(ARQUIVO_SUPORTADO_PELA_IA);
  return Promise.all(
    suportados.map(async (arquivo) => ({
      nome: arquivo.name,
      mimeType: arquivo.type,
      dadosBase64: await lerArquivoComoBase64(arquivo)
    }))
  );
}
