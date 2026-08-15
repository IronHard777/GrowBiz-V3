/**
 * Fonte única de categorização visual por setor (imagem estática, fallback de IA e player de vídeo).
 * Antes desta consolidação, CardCampanhaMock, VisualizadorRoteiroVideo e servicoIA mantinham
 * três listas de setores divergentes (9, 2 e 9 categorias respectivamente) — o que fazia o
 * player de vídeo cair quase sempre no bucket genérico mesmo quando a imagem estática já
 * tinha uma categoria específica identificada.
 */

export type CategoriaVisual =
  | 'cafeteria'
  | 'juridico'
  | 'moda'
  | 'estetica'
  | 'gastronomia'
  | 'jogos'
  | 'pet'
  | 'automotivo'
  | 'consultoriaB2B'
  | 'generico';

interface DefinicaoCategoriaVisual {
  chaves: string[];
  promptInglesImagem: string;
  palavrasChaveImagemIa: string;
  imagemCuradaUrl: string;
}

const IMAGEM_CURADA_GENERICA = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80';

const CATEGORIAS: Record<CategoriaVisual, DefinicaoCategoriaVisual> = {
  cafeteria: {
    chaves: ['café', 'cafeteria', 'varejo', 'lanchonete', 'padaria'],
    promptInglesImagem: 'Delicious gourmet espresso coffee cup with rich crema, coffee beans, cozy specialty cafe ambiance, professional commercial photography, 8k',
    palavrasChaveImagemIa: 'delicious gourmet espresso coffee cup, coffee beans, cozy modern coffee shop ambiance, professional barista specialty cafe commercial photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80'
  },
  juridico: {
    chaves: ['advoc', 'direito', 'jurídic', 'juridic'],
    promptInglesImagem: 'Professional modern law firm office, legal counsel signing agreement, executive corporate interior, high trust photography, 8k',
    palavrasChaveImagemIa: 'professional lawyer office, legal agreement document signing, modern corporate law firm interior, high trust photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80'
  },
  moda: {
    chaves: ['roupa', 'moda', 'boutique', 'vestuário', 'vestuario'],
    promptInglesImagem: 'Stylish luxury fashion boutique apparel display, modern clothes retail store interior, commercial product photography, 8k',
    palavrasChaveImagemIa: 'stylish fashion boutique apparel clothes display, modern clothing retail store commercial photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80'
  },
  estetica: {
    chaves: ['estétic', 'estetic', 'salão', 'salao', 'beleza', 'barbearia'],
    promptInglesImagem: 'Modern luxury spa aesthetics salon, professional skincare treatment, relaxing wellness ambiance photography, 8k',
    palavrasChaveImagemIa: 'luxury spa beauty salon treatment, modern aesthetics studio, relaxing wellness commercial photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80'
  },
  gastronomia: {
    chaves: ['restaurante', 'comida', 'pizzaria', 'gastronomia'],
    promptInglesImagem: 'Gourmet delicious dish presentation by professional chef, luxury restaurant dining ambiance, mouth-watering food photography, 8k',
    palavrasChaveImagemIa: 'gourmet restaurant plating, delicious chef dish, elegant dining ambiance food commercial photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80'
  },
  jogos: {
    chaves: ['jogo', 'gamer', 'games', 'eletrônic', 'eletronic'],
    promptInglesImagem: 'Modern video game store interior, neon RGB gaming setup, video game controllers, gaming lounge commercial photography, 8k',
    palavrasChaveImagemIa: 'modern video game store interior, neon RGB gaming setup, video game controllers, gaming lounge commercial photography',
    imagemCuradaUrl: IMAGEM_CURADA_GENERICA
  },
  pet: {
    chaves: ['pet', 'veteriná', 'veterina', 'cachorro'],
    promptInglesImagem: 'Cute happy golden retriever dog receiving grooming, modern clean pet shop store commercial photography, 8k',
    palavrasChaveImagemIa: 'cute happy golden retriever dog grooming, modern clean pet shop store commercial photography',
    imagemCuradaUrl: IMAGEM_CURADA_GENERICA
  },
  automotivo: {
    chaves: ['oficina', 'mecanic', 'carro', 'auto'],
    promptInglesImagem: 'Clean modern auto repair shop garage, luxury car service maintenance commercial photography, 8k',
    palavrasChaveImagemIa: 'clean modern auto repair shop garage, luxury car service maintenance commercial photography',
    imagemCuradaUrl: IMAGEM_CURADA_GENERICA
  },
  consultoriaB2B: {
    chaves: ['consultor', 'b2b', 'contabil', 'contábil', 'imobiliária', 'imobiliaria', 'arquitetura', 'engenharia'],
    promptInglesImagem: 'Professional modern corporate office consulting meeting, executive business handshake, high trust B2B commercial photography, 8k',
    palavrasChaveImagemIa: 'professional modern corporate office consulting meeting, executive business handshake, B2B commercial photography',
    imagemCuradaUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80'
  },
  generico: {
    chaves: [],
    promptInglesImagem: 'Vibrant commercial store product presentation, aesthetic composition, professional photography, 8k',
    palavrasChaveImagemIa: 'vibrant retail store interior product display commercial photography 8k',
    imagemCuradaUrl: IMAGEM_CURADA_GENERICA
  }
};

/**
 * Identifica a categoria visual a partir de qualquer combinação de textos livres
 * (setor, título da campanha, prompt de imagem etc.) — usada de forma consistente
 * pela imagem estática, pelo player de vídeo e pelo fallback de geração de imagem.
 */
export function IDENTIFICAR_CATEGORIA_VISUAL(...textos: string[]): CategoriaVisual {
  const textoCompleto = textos.join(' ').toLowerCase();
  for (const [categoria, definicao] of Object.entries(CATEGORIAS) as [CategoriaVisual, DefinicaoCategoriaVisual][]) {
    if (definicao.chaves.some(chave => textoCompleto.includes(chave))) {
      return categoria;
    }
  }
  return 'generico';
}

export function OBTER_DEFINICAO_CATEGORIA_VISUAL(categoria: CategoriaVisual): DefinicaoCategoriaVisual {
  return CATEGORIAS[categoria];
}
