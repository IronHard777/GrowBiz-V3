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

// Miniaturas por estilo (SVG único). Não reutiliza a foto da campanha.

function miniaturaSvg(id: string, corA: string, corB: string, desenho: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${corA}"/><stop offset="100%" stop-color="${corB}"/></linearGradient></defs><rect width="160" height="160" fill="url(#g${id})"/>${desenho}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const MINIATURAS: Record<string, string> = {
  'img-estudio': miniaturaSvg('est', '#1e293b', '#64748b', '<rect x="48" y="70" width="64" height="50" rx="6" fill="#f8fafc"/><circle cx="50" cy="40" r="14" fill="#fde68a" opacity="0.9"/><circle cx="110" cy="38" r="10" fill="#e2e8f0"/>'),
  'img-lifestyle': miniaturaSvg('life', '#14532d', '#4ade80', '<circle cx="70" cy="72" r="22" fill="#bbf7d0"/><circle cx="70" cy="48" r="12" fill="#ecfdf5"/><rect x="95" y="88" width="28" height="36" rx="6" fill="#86efac"/>'),
  'img-editorial': miniaturaSvg('edi', '#111827', '#f43f5e', '<rect x="38" y="28" width="84" height="104" rx="4" fill="#fff1f2"/><rect x="50" y="44" width="60" height="40" fill="#9f1239"/><rect x="50" y="92" width="44" height="8" fill="#e11d48"/>'),
  'img-preto-e-branco': miniaturaSvg('pb', '#09090b', '#a1a1aa', '<rect x="20" y="20" width="50" height="120" fill="#fafafa"/><rect x="70" y="20" width="30" height="120" fill="#737373"/><rect x="100" y="20" width="40" height="120" fill="#171717"/>'),
  'img-cores-vibrantes': miniaturaSvg('vib', '#6d28d9', '#f97316', '<circle cx="50" cy="55" r="28" fill="#22d3ee"/><circle cx="110" cy="50" r="22" fill="#facc15"/><circle cx="80" cy="110" r="30" fill="#fb7185"/>'),
  'img-artesanal': miniaturaSvg('art', '#7c2d12', '#d6b08a', '<ellipse cx="80" cy="95" rx="40" ry="28" fill="#b45309"/><rect x="55" y="40" width="50" height="50" rx="8" fill="#fed7aa"/><path d="M55 65h50" stroke="#9a3412" stroke-width="3"/>'),
  'img-minimalista': miniaturaSvg('min', '#f8fafc', '#cbd5e1', '<circle cx="80" cy="80" r="18" fill="#0f172a"/>'),
  'vid-exibicao-produto': miniaturaSvg('vex', '#0f172a', '#38bdf8', '<rect x="55" y="40" width="50" height="80" rx="10" fill="#e0f2fe"/><circle cx="80" cy="80" r="14" fill="#0284c7"/>'),
  'vid-revelacao-marca': miniaturaSvg('vre', '#020617', '#fbbf24', '<polygon points="80,24 92,68 140,68 100,96 114,140 80,112 46,140 60,96 20,68 68,68" fill="#facc15"/>'),
  'vid-depoimento-analise': miniaturaSvg('vde', '#1e3a5f', '#93c5fd', '<rect x="36" y="36" width="88" height="64" rx="8" fill="#dbeafe"/><circle cx="58" cy="64" r="12" fill="#1d4ed8"/><rect x="76" y="54" width="36" height="8" fill="#1e40af"/><rect x="76" y="68" width="28" height="6" fill="#60a5fa"/>'),
  'vid-equipe-atendimento': miniaturaSvg('veq', '#134e4a', '#5eead4', '<circle cx="55" cy="70" r="16" fill="#ccfbf1"/><circle cx="90" cy="62" r="16" fill="#99f6e4"/><circle cx="120" cy="74" r="14" fill="#5eead4"/><rect x="40" y="100" width="90" height="18" rx="9" fill="#115e59"/>'),
  'vid-tutorial': miniaturaSvg('vtu', '#1e293b', '#38bdf8', '<rect x="30" y="40" width="100" height="70" rx="6" fill="#e2e8f0"/><polygon points="70,58 70,92 100,75" fill="#0284c7"/><rect x="40" y="120" width="20" height="8" fill="#38bdf8"/><rect x="68" y="120" width="20" height="8" fill="#64748b"/><rect x="96" y="120" width="20" height="8" fill="#64748b"/>'),
  'vid-sazonal-promocao': miniaturaSvg('vsa', '#7f1d1d', '#fb923c', '<polygon points="80,22 88,55 122,55 94,76 104,110 80,90 56,110 66,76 38,55 72,55" fill="#fde68a"/><rect x="48" y="118" width="64" height="14" rx="7" fill="#f97316"/>'),
  'vid-cinematografico': miniaturaSvg('vci', '#0b0f19', '#334155', '<rect x="18" y="48" width="124" height="64" rx="4" fill="#111827"/><rect x="28" y="58" width="104" height="44" fill="#1e293b"/><circle cx="80" cy="80" r="10" fill="#f8fafc" opacity="0.35"/><rect x="18" y="42" width="12" height="76" fill="#020617"/><rect x="130" y="42" width="12" height="76" fill="#020617"/>'),
  'vid-dinamico': miniaturaSvg('vdi', '#4c1d95', '#22d3ee', '<polygon points="30,110 70,40 78,40 50,110" fill="#a5f3fc"/><polygon points="70,110 118,28 130,28 90,110" fill="#c4b5fd"/><polygon points="100,110 145,55 155,55 118,110" fill="#67e8f9"/>'),
  'vid-anime': miniaturaSvg('van', '#831843', '#fb7185', '<circle cx="80" cy="70" r="32" fill="#fecdd3"/><ellipse cx="68" cy="68" rx="8" ry="12" fill="#0f172a"/><ellipse cx="94" cy="68" rx="8" ry="12" fill="#0f172a"/><path d="M60 92q20 16 40 0" stroke="#9f1239" stroke-width="4" fill="none"/>'),
  'vid-pixel-art': miniaturaSvg('vpx', '#14532d', '#86efac', '<rect x="40" y="40" width="20" height="20" fill="#4ade80"/><rect x="60" y="40" width="20" height="20" fill="#166534"/><rect x="80" y="40" width="20" height="20" fill="#4ade80"/><rect x="40" y="60" width="20" height="20" fill="#166534"/><rect x="60" y="60" width="20" height="20" fill="#bbf7d0"/><rect x="80" y="60" width="20" height="20" fill="#166534"/><rect x="60" y="80" width="20" height="20" fill="#4ade80"/><rect x="80" y="100" width="20" height="20" fill="#22c55e"/>'),
  'vid-clipe-anos-80': miniaturaSvg('v80', '#3b0764', '#22d3ee', '<rect x="20" y="100" width="120" height="8" fill="#f0abfc"/><rect x="20" y="114" width="120" height="8" fill="#22d3ee"/><polygon points="80,24 140,100 20,100" fill="#c026d3" opacity="0.85"/>'),
  'vid-stop-motion': miniaturaSvg('vst', '#78350f', '#fde68a', '<circle cx="80" cy="58" r="20" fill="#fbbf24"/><rect x="62" y="78" width="36" height="40" rx="10" fill="#d97706"/><circle cx="70" cy="54" r="4" fill="#78350f"/><circle cx="90" cy="54" r="4" fill="#78350f"/>')
};

function resolverThumbnail(slug: string): string {
  return MINIATURAS[slug] || miniaturaSvg(slug.replace(/[^a-z]/g, '').slice(0, 8), '#1e293b', '#334155', '');
}

export const CATEGORIAS_ESTILO_IMAGEM: CategoriaEstilo[] = [
  {
    id: 'estudio',
    nome: 'Estúdio',
    grupo: 'negocio',
    modificadorPrompt: 'studio product photography, clean neutral background, professional studio lighting, sharp focus on the product',
    thumbnailUrl: resolverThumbnail('img-estudio')
  },
  {
    id: 'lifestyle',
    nome: 'Lifestyle',
    grupo: 'negocio',
    modificadorPrompt: 'lifestyle photography, product in real use, natural environment, people interacting naturally, candid feel',
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
    modificadorPrompt: 'minimalist composition, generous negative space, clean simple background, product-focused',
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
