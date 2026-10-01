/**
 * Isolated media presets picker - pending integration with the existing
 * media generation flow (image/video). Do not assume it is wired into App yet.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Clapperboard,
  Image as ImageIcon,
  Minimize2,
  Paintbrush,
  Palette,
  RectangleHorizontal,
  RectangleVertical,
  Sparkles,
  Square,
  Video,
} from 'lucide-react';

export type PresetSelection = {
  type: 'image' | 'video';
  ratio: '1:1' | '4:5' | '16:9' | '9:16';
  style: 'realistic' | 'illustrated' | 'minimal' | 'bold' | 'cinematic';
};

type MediaPresetsProps = {
  value: PresetSelection;
  onChange: (value: PresetSelection) => void;
  /** Quando false (ex.: enxuto_imagens), oculta a opcao Video. Default true. */
  permitirVideo?: boolean;
};

type Option<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Stable Unsplash crop URL matching the preset meaning. */
  thumbSrc: string;
};

const TYPE_OPTIONS: Option<PresetSelection['type']>[] = [
  {
    id: 'image',
    label: 'Imagem',
    icon: ImageIcon,
    thumbSrc:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    thumbSrc:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=640&h=640&q=80',
  },
];

const RATIO_OPTIONS: Option<PresetSelection['ratio']>[] = [
  {
    id: '1:1',
    label: '1:1',
    icon: Square,
    thumbSrc:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: '4:5',
    label: '4:5',
    icon: RectangleVertical,
    thumbSrc:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=512&h=640&q=80',
  },
  {
    id: '16:9',
    label: '16:9',
    icon: RectangleHorizontal,
    thumbSrc:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&h=360&q=80',
  },
  {
    id: '9:16',
    label: '9:16',
    icon: RectangleVertical,
    thumbSrc:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=360&h=640&q=80',
  },
];

const STYLE_OPTIONS: Option<PresetSelection['style']>[] = [
  {
    id: 'realistic',
    label: 'Realista',
    icon: Sparkles,
    thumbSrc:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: 'illustrated',
    label: 'Ilustrado',
    icon: Paintbrush,
    thumbSrc:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    icon: Minimize2,
    thumbSrc:
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: 'bold',
    label: 'Bold',
    icon: Palette,
    thumbSrc:
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=640&h=640&q=80',
  },
  {
    id: 'cinematic',
    label: 'Cinematico',
    icon: Clapperboard,
    thumbSrc:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=640&h=360&q=80',
  },
];

function OptionCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>;
  selected: boolean;
  onSelect: (id: T) => void;
}): ReactNode {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      className={[
        'group flex flex-col gap-2 overflow-hidden rounded-xl border p-2 text-left text-sm font-medium transition-all duration-300 ease-out',
        'hover:border-white/25 active:border-white/25',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70',
        selected
          ? 'border-sky-400/70 bg-sky-500/10 text-sky-100 ring-2 ring-sky-400/40 shadow-sm shadow-sky-500/10'
          : 'border-white/10 bg-zinc-900/40 text-zinc-300',
      ].join(' ')}
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-zinc-800">
        <img
          src={option.thumbSrc}
          alt=""
          loading="lazy"
          decoding="async"
          className={[
            'h-full w-full object-cover transition-all duration-300 ease-out will-change-transform',
            'group-hover:scale-[1.08] group-hover:brightness-110 group-hover:blur-[0.6px]',
            'group-focus-visible:scale-[1.08] group-focus-visible:brightness-110 group-focus-visible:blur-[0.6px]',
            'group-active:scale-[1.08] group-active:brightness-110 group-active:blur-[0.6px]',
          ].join(' ')}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-2 pb-1.5 pt-6">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            {option.label}
          </span>
        </span>
      </span>
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</div>
    </section>
  );
}

export function MediaPresets({ value, onChange, permitirVideo = true }: MediaPresetsProps) {
  const tiposVisiveis = permitirVideo
    ? TYPE_OPTIONS
    : TYPE_OPTIONS.filter((option) => option.id === 'image');

  return (
    <div className="w-full max-w-xl space-y-5 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-zinc-100 shadow-lg shadow-black/20 backdrop-blur-sm sm:p-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">Presets de midia</h2>
        <p className="text-sm text-zinc-400">
          {permitirVideo
            ? 'Escolha tipo, proporcao e estilo antes de gerar.'
            : 'Escolha proporcao e estilo antes de gerar a imagem.'}
        </p>
      </header>

      <Section title="Tipo">
        {tiposVisiveis.map((option) => (
          <div key={option.id}>
            <OptionCard
              option={option}
              selected={value.type === option.id}
              onSelect={(type) => onChange({ ...value, type })}
            />
          </div>
        ))}
      </Section>

      <Section title="Proporcao">
        {RATIO_OPTIONS.map((option) => (
          <div key={option.id}>
            <OptionCard
              option={option}
              selected={value.ratio === option.id}
              onSelect={(ratio) => onChange({ ...value, ratio })}
            />
          </div>
        ))}
      </Section>

      <Section title="Estilo">
        {STYLE_OPTIONS.map((option) => (
          <div key={option.id}>
            <OptionCard
              option={option}
              selected={value.style === option.id}
              onSelect={(style) => onChange({ ...value, style })}
            />
          </div>
        ))}
      </Section>
    </div>
  );
}


export const STYLE_PROMPT_EN: Record<PresetSelection['style'], string> = {
  realistic: 'photorealistic commercial photography, natural lighting',
  illustrated: 'illustrated digital artwork, stylized graphics',
  minimal: 'minimal clean design, sparse composition, soft palette',
  bold: 'bold high-contrast graphic style, strong colors',
  cinematic: 'cinematic film still, dramatic lighting, shallow depth of field',
};

/** Appends ratio/style/type instructions for Gemini image or Veo prompts. */
export function appendPresetToPrompt(base: string, preset: PresetSelection): string {
  const trimmed = (base || '').trim();
  const bloco = [
    'MEDIA PRESET (apply strictly):',
    `- Aspect ratio: ${preset.ratio}`,
    `- Visual style: ${STYLE_PROMPT_EN[preset.style]}`,
    `- Output media type preference: ${preset.type}`,
  ].join('\n');
  return trimmed ? `${trimmed}\n\n${bloco}` : bloco;
}

export function rotuloEstiloPreset(preset: PresetSelection): string {
  return `${STYLE_PROMPT_EN[preset.style]} | aspect ${preset.ratio}`;
}

export default MediaPresets;
