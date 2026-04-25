export const brandTokens = {
  primary: '#4A4540',
  primaryHover: '#3D3834',
  accent: '#6F5A48',
  accentSoft: '#EFE4D7',
  accentMuted: '#A28E7D',
  background: '#E8E4E0',
  backgroundSoft: '#F5F3F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF8F4',
  text: '#2F2924',
  textSoft: '#6B6560',
  textMuted: '#837A71',
  border: '#DDD2C6',
  borderStrong: '#C9B9A7',
  success: '#557865',
  successSoft: '#E7F0EA',
  danger: '#B85C4C',
  dangerSoft: '#FBEEEB',
  warning: '#A97B37',
  warningSoft: '#F9F0E0'
} as const;

const LEGACY_ACCENT_MAP: Record<string, string> = {
  '#B45309': brandTokens.accent,
  '#92400E': brandTokens.accent,
  '#D97706': brandTokens.accent,
  '#F59E0B': brandTokens.accentMuted,
  '#9333EA': brandTokens.primary,
  '#8B5CF6': brandTokens.primary,
  '#7C3AED': brandTokens.primary,
  '#A855F7': brandTokens.primary,
  '#C084FC': brandTokens.accentMuted,
  '#B370EF': brandTokens.primary,
  '#FF6B6B': brandTokens.accent,
  '#FF6B6BFF': brandTokens.accent
};

const LEGACY_SURFACE_MAP: Record<string, string> = {
  '#F3E8FF': brandTokens.surfaceAlt,
  '#EDE9FE': brandTokens.surfaceAlt,
  '#FAE8FF': brandTokens.surfaceAlt,
  '#FFF7ED': brandTokens.surfaceAlt
};

const EARTH_BACKGROUND_PRESETS = [
  '#FFFFFF',
  '#FBF8F4',
  '#F5F3F0',
  '#EFE8E0',
  '#E8E4E0',
  '#F6EFE6',
  '#F3ECE4',
  '#EEE4D7',
  '#F8F4EC',
  '#F3F0EB'
] as const;

const EARTH_TEXT_PRESETS = [
  '#111827',
  brandTokens.text,
  brandTokens.primary,
  '#5C534B',
  brandTokens.textSoft,
  '#4E6658',
  '#3F5B70',
  '#7A4D3C',
  '#7A6857',
  '#6B7280'
] as const;

const EARTH_ACCENT_PRESETS = [
  brandTokens.primary,
  brandTokens.accent,
  '#5B493B',
  '#7A6857',
  brandTokens.accentMuted,
  brandTokens.success,
  '#3F5B70',
  brandTokens.danger,
  brandTokens.warning,
  '#2F2924'
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
    return brandTokens.primary;
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
  background: [...EARTH_BACKGROUND_PRESETS],
  text: [...EARTH_TEXT_PRESETS],
  accent: [...EARTH_ACCENT_PRESETS]
};
