/**
 * Categorias de estilo que o cliente pode escolher para regerar a imagem do mockup e o
 * roteiro de vídeo da campanha — inspirado na galeria de "modelos" de estilo do Gemini App,
 * adaptado para o contexto de anúncio/marketing de negócio local.
 */

export interface CategoriaEstilo {
  id: string;
  nome: string;
  grupo: 'negocio' | 'estetico';
  /** Instrução injetada no prompt de geração (imagem em inglês, vídeo em PT-BR). */
  modificadorPrompt: string;
  /** URL resolvida pelo Vite (import.meta.glob) da miniatura pré-gerada por IA para este estilo. */
  thumbnailUrl: string;
  /**
   * Apenas categorias de VÍDEO: descritor em inglês injetado no prompt de imagem para que a
   * prévia visual do player (VisualizadorRoteiroVideo) também mude de estilo — sem isso, o
   * roteiro (texto) mudava mas a imagem do player continuava sempre a mesma.
   */
  modificadorImagemIngles?: string;
}

const MINIATURAS = import.meta.glob('../assets/categorias/*-v2.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
function resolverThumbnail(slug: string): string {
  return MINIATURAS[`../assets/categorias/${slug}-v2.webp`];
}

export const CATEGORIAS_ESTILO_IMAGEM: CategoriaEstilo[] = [
  {
    id: 'estudio',
    nome: 'Estúdio',
    grupo: 'negocio',
    modificadorPrompt: 'professional studio lighting, clean neutral background, sharp focus on the business subject',
    thumbnailUrl: resolverThumbnail('img-estudio')
  },
  {
    id: 'lifestyle',
    nome: 'Lifestyle',
    grupo: 'negocio',
    modificadorPrompt: 'lifestyle photography, actual product or service in real use, natural environment, people interacting naturally, candid feel',
    thumbnailUrl: resolverThumbnail('img-lifestyle')
  },
  {
    id: 'editorial',
    nome: 'Editorial',
    grupo: 'negocio',
    modificadorPrompt: 'high-fashion editorial photography style, dramatic composition, premium magazine advertisement quality',
    thumbnailUrl: resolverThumbnail('img-editorial')
  },
  {
    id: 'preto-e-branco',
    nome: 'Preto & Branco',
    grupo: 'negocio',
    modificadorPrompt: 'black and white photography, high contrast, classic and timeless mood, dramatic shadows',
    thumbnailUrl: resolverThumbnail('img-preto-e-branco')
  },
  {
    id: 'cores-vibrantes',
    nome: 'Cores Vibrantes',
    grupo: 'negocio',
    modificadorPrompt: 'vibrant saturated colors, bold pop energy, eye-catching commercial photography',
    thumbnailUrl: resolverThumbnail('img-cores-vibrantes')
  },
  {
    id: 'artesanal',
    nome: 'Artesanal',
    grupo: 'negocio',
    modificadorPrompt: 'handmade artisanal feel, warm natural textures, rustic authentic craftsmanship photography',
    thumbnailUrl: resolverThumbnail('img-artesanal')
  },
  {
    id: 'minimalista',
    nome: 'Minimalista',
    grupo: 'negocio',
    modificadorPrompt: 'minimalist composition, generous negative space, clean simple background, focused on the business subject',
    thumbnailUrl: resolverThumbnail('img-minimalista')
  }
];

export const CATEGORIAS_ESTILO_VIDEO: CategoriaEstilo[] = [
  {
    id: 'exibicao-produto',
    nome: 'Exibição de Produto',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Exibição de Produto': o produto é o protagonista absoluto em todas as cenas, com tomadas de detalhe, câmera lenta e o cenário real do negócio ao fundo.",
    thumbnailUrl: resolverThumbnail('vid-exibicao-produto'),
    modificadorImagemIngles: 'extreme close-up product photography, shallow depth of field, glossy commercial video look'
  },
  {
    id: 'revelacao-marca',
    nome: 'Revelação de Marca',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Revelação de Marca': abertura cinematográfica que constrói expectativa e revela o nome/logo do negócio de forma marcante já na primeira cena.",
    thumbnailUrl: resolverThumbnail('vid-revelacao-marca'),
    modificadorImagemIngles: 'dramatic reveal emerging from shadow into a spotlight, cinematic brand reveal lighting'
  },
  {
    id: 'depoimento-analise',
    nome: 'Depoimento/Análise',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Depoimento/Análise': falas em primeira pessoa, tom de cliente real avaliando o produto/serviço, destacando diferenciais como se fossem anotações na tela.",
    thumbnailUrl: resolverThumbnail('vid-depoimento-analise'),
    modificadorImagemIngles: 'authentic candid smartphone testimonial video photography, warm real-life setting'
  },
  {
    id: 'equipe-atendimento',
    nome: 'Equipe & Atendimento',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Equipe & Atendimento': mostra a equipe do negócio recepcionando e atendendo com profissionalismo, transmitindo confiança e cordialidade.",
    thumbnailUrl: resolverThumbnail('vid-equipe-atendimento'),
    modificadorImagemIngles: 'friendly staff service moment, warm hospitality video photography'
  },
  {
    id: 'tutorial',
    nome: 'Tutorial',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Tutorial': estrutura passo a passo explicando como usar o produto ou como funciona o serviço, tom didático e claro.",
    thumbnailUrl: resolverThumbnail('vid-tutorial'),
    modificadorImagemIngles: 'clean instructional overhead framing, tutorial demonstration video photography'
  },
  {
    id: 'sazonal-promocao',
    nome: 'Sazonal/Promoção',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Sazonal/Promoção': amarrado a uma data ou ocasião especial (fim de semana, feriado, aniversário da loja), com senso de urgência e celebração.",
    thumbnailUrl: resolverThumbnail('vid-sazonal-promocao'),
    modificadorImagemIngles: 'festive seasonal decoration, celebratory warm promotional lighting'
  },
  {
    id: 'cinematografico',
    nome: 'Cinematográfico',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Cinematográfico': tom dramático e premium, cortes mais lentos e contemplativos, iluminação de cinema.",
    thumbnailUrl: resolverThumbnail('vid-cinematografico'),
    modificadorImagemIngles: 'cinematic film noir lighting, premium dramatic slow-motion video photography'
  },
  {
    id: 'dinamico',
    nome: 'Dinâmico',
    grupo: 'negocio',
    modificadorPrompt: "Roteiro no estilo 'Dinâmico': cortes rápidos e ritmo acelerado, estilo de vídeo viral/trend de redes sociais, alta energia do início ao fim.",
    thumbnailUrl: resolverThumbnail('vid-dinamico'),
    modificadorImagemIngles: 'dynamic motion blur, energetic vibrant fast-paced video photography'
  },
  {
    id: 'anime',
    nome: 'Anime',
    grupo: 'estetico',
    modificadorPrompt: "Roteiro com direção visual estilo anime japonês, cores vívidas e expressivas, dinamismo de quadrinho animado — mantenha a mensagem comercial clara por trás da estética.",
    thumbnailUrl: resolverThumbnail('vid-anime'),
    modificadorImagemIngles: 'Japanese anime style illustration, vibrant expressive colors, dynamic manga energy'
  },
  {
    id: 'pixel-art',
    nome: 'Pixel Art / 8-Bits',
    grupo: 'estetico',
    modificadorPrompt: "Roteiro com direção visual estilo videogame retrô em pixel art / 8-bits, nostálgico e divertido — mantenha a mensagem comercial clara por trás da estética.",
    thumbnailUrl: resolverThumbnail('vid-pixel-art'),
    modificadorImagemIngles: 'retro 8-bit pixel art video game style illustration, nostalgic arcade aesthetic'
  },
  {
    id: 'clipe-anos-80',
    nome: 'Clipe Anos 80',
    grupo: 'estetico',
    modificadorPrompt: "Roteiro com direção visual estilo clipe musical dos anos 80, neon, luzes vibrantes, energia retrô — mantenha a mensagem comercial clara por trás da estética.",
    thumbnailUrl: resolverThumbnail('vid-clipe-anos-80'),
    modificadorImagemIngles: '1980s music video style, neon lights, retro synthwave aesthetic, vibrant magenta and cyan colors'
  },
  {
    id: 'stop-motion',
    nome: 'Stop-Motion Artesanal',
    grupo: 'estetico',
    modificadorPrompt: "Roteiro com direção visual estilo stop-motion/massinha ou origami artesanal, textura tátil e charme feito à mão — mantenha a mensagem comercial clara por trás da estética.",
    thumbnailUrl: resolverThumbnail('vid-stop-motion'),
    modificadorImagemIngles: 'stop-motion claymation style, handcrafted clay and felt textures, tactile charm'
  }
];
