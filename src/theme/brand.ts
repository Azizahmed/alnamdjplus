export const brandTokens = {
  primary: '#123A3F',
  primaryHover: '#0B2B30',
  primaryLight: '#2A6970',
  accent: '#0E7C86',
  accentSoft: '#E7F5F4',
  accentMuted: '#6AA9AF',
  background: '#EEF3F2',
  backgroundSoft: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F7F5',
  text: '#172326',
  textSoft: '#52666B',
  textMuted: '#7B8C90',
  border: '#D9E4E1',
  borderStrong: '#B8CAC6',
  success: '#25745A',
  successSoft: '#E7F5EF',
  danger: '#BA4A45',
  dangerSoft: '#FCEDEB',
  warning: '#B7791F',
  warningSoft: '#FFF6DB'
} as const;

const LEGACY_ACCENT_MAP: Record<string, string> = {
  '#B45309': brandTokens.accent,
  '#92400E': brandTokens.primary,
  '#D97706': brandTokens.warning,
  '#F59E0B': brandTokens.warning,
  '#9333EA': brandTokens.primary,
  '#8B5CF6': brandTokens.accent,
  '#7C3AED': brandTokens.primary,
  '#A855F7': brandTokens.accentMuted,
  '#C084FC': brandTokens.accentMuted,
  '#B370EF': brandTokens.primary,
  '#FF6B6B': brandTokens.danger,
  '#FF6B6BFF': brandTokens.danger
};

const LEGACY_SURFACE_MAP: Record<string, string> = {
  '#F3E8FF': brandTokens.surfaceAlt,
  '#EDE9FE': brandTokens.surfaceAlt,
  '#FAE8FF': brandTokens.surfaceAlt,
  '#FFF7ED': brandTokens.warningSoft,
  '#FFFBEB': brandTokens.warningSoft,
  '#F7FAF8': brandTokens.backgroundSoft,
  '#EEF3F2': brandTokens.background
};

const PAGE_BACKGROUND_PRESETS = [
  '#FFFFFF',
  '#F7FAF8',
  '#EEF3F2',
  '#E7F5F4',
  '#F4F7F5',
  '#F9FAFB',
  '#EFF6FF',
  '#FFF6DB',
  '#F1F5F9',
  '#ECFDF5'
] as const;

const PAGE_TEXT_PRESETS = [
  brandTokens.text,
  brandTokens.primary,
  '#1F2937',
  '#334155',
  brandTokens.textSoft,
  '#174D43',
  '#1E3A5F',
  '#7A4D1D',
  '#475569',
  '#111827'
] as const;

const PAGE_ACCENT_PRESETS = [
  brandTokens.accent,
  brandTokens.primary,
  brandTokens.primaryLight,
  '#2563EB',
  '#0F766E',
  brandTokens.success,
  brandTokens.warning,
  brandTokens.danger,
  '#475569',
  '#111827'
] as const;

const normalizeHex = (value?: string | null) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed.startsWith('#')) return trimmed;
  return trimmed.toUpperCase();
};

export const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized.slice(0, 6);

  const numericAlpha = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  return `#${full}${numericAlpha.toString(16).padStart(2, '0')}`;
};

export const normalizeThemeColor = (
  value: string | undefined | null,
  role: 'background' | 'text' | 'accent' | 'bold',
  fallback?: string
) => {
  const normalized = normalizeHex(value);

  if (!normalized) {
    if (fallback) return fallback;
    if (role === 'background') return brandTokens.surface;
    if (role === 'text') return brandTokens.text;
    return brandTokens.accent;
  }

  if (role === 'background' && LEGACY_SURFACE_MAP[normalized]) {
    return LEGACY_SURFACE_MAP[normalized];
  }

  if ((role === 'accent' || role === 'bold' || role === 'text') && LEGACY_ACCENT_MAP[normalized]) {
    return LEGACY_ACCENT_MAP[normalized];
  }

  return value!.trim();
};

export const buildPagePresets = {
  background: [...PAGE_BACKGROUND_PRESETS],
  text: [...PAGE_TEXT_PRESETS],
  accent: [...PAGE_ACCENT_PRESETS]
};
