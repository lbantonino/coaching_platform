// components/brand/CooryLogo.tsx
// Logo Coory — ne pas redessiner : ces deux tracés sont la source officielle.
import type { CSSProperties } from 'react';

const LEFT = 'M126.69 0H60A60 60 0 0 0 60 120H95.31L103.68 88H60A28 28 0 0 1 60 32H118.32Z';
const RIGHT = 'M144.69 0H180A60 60 0 0 1 180 120H113.31L121.68 88H180A28 28 0 0 0 180 32H136.32Z';

type Tone = 'light' | 'dark' | 'violet' | 'mono';
// light  = fond clair  (C noir, O violet)
// dark   = fond sombre (C blanc cassé, O violet)
// violet = fond violet (C blanc, O noir)
// mono   = une seule couleur (currentColor)

const TONES: Record<Tone, { ink: string; accent: string; text: string }> = {
  light:  { ink: '#17151D', accent: '#8B5CF6', text: '#17151D' },
  dark:   { ink: '#F4F4F2', accent: '#8B5CF6', text: '#F4F4F2' },
  violet: { ink: '#FFFFFF', accent: '#17151D', text: '#FFFFFF' },
  mono:   { ink: 'currentColor', accent: 'currentColor', text: 'currentColor' },
};

export function CooryMark({ height = 24, tone = 'light', className, style }: { height?: number; tone?: Tone; className?: string; style?: CSSProperties }) {
  const t = TONES[tone];
  return (
    <svg viewBox="0 0 240 120" width={height * 2} height={height} className={className} style={{ flex: 'none', ...style }} aria-hidden="true">
      <path fill={t.ink} d={LEFT} />
      <path fill={t.accent} d={RIGHT} />
    </svg>
  );
}

// Logo horizontal : icône + COORY. height = hauteur de l'icône.
// Proportions officielles : texte = height × 0,58 · écart = height × 0,39.
export function CooryLogo({ height = 28, tone = 'light', layout = 'horizontal', className }: { height?: number; tone?: Tone; layout?: 'horizontal' | 'stacked'; className?: string }) {
  const t = TONES[tone];
  const stacked = layout === 'stacked';
  return (
    <span role="img" aria-label="Coory" className={className}
      style={{ display: 'inline-flex', flexDirection: stacked ? 'column' : 'row', alignItems: 'center', gap: stacked ? height * 0.24 : height * 0.39, lineHeight: 1 }}>
      <CooryMark height={height} tone={tone} />
      <span style={{ fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif', fontWeight: 800, fontSize: stacked ? height * 0.64 : height * 1.16, letterSpacing: '0.01em', color: t.text, whiteSpace: 'nowrap' }}>
        COORY
      </span>
    </span>
  );
}
