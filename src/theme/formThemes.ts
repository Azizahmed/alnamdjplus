import { brandTokens, normalizeThemeColor } from './brand';

const GLOBAL_FORM_FONT = "var(--font-arabic)";

export type FormTheme = {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  bold: string;
  border: string;
  swatches: string[];
};

export const FORM_THEMES: FormTheme[] = [
  {
    id: 'alnamdj-core',
    name: 'Alnamdj Core',
    description: 'هادئ ومهني للنماذج اليومية',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#EEF3F2',
    surface: '#FFFFFF',
    text: brandTokens.text,
    accent: brandTokens.accent,
    bold: brandTokens.primary,
    border: brandTokens.border,
    swatches: ['#EEF3F2', '#FFFFFF', brandTokens.primary, brandTokens.accent],
  },
  {
    id: 'executive-ink',
    name: 'Executive Ink',
    description: 'تباين قوي وتقارير رسمية',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#F4F1EA',
    surface: '#FFFCF6',
    text: '#1F2528',
    accent: '#37515A',
    bold: '#111827',
    border: '#D8D0C2',
    swatches: ['#F4F1EA', '#FFFCF6', '#111827', '#37515A'],
  },
  {
    id: 'calm-mint',
    name: 'Calm Mint',
    description: 'لطيف ومناسب لرضا العملاء',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#ECFDF5',
    surface: '#FFFFFF',
    text: '#17352E',
    accent: '#0F766E',
    bold: '#14532D',
    border: '#BFE7D2',
    swatches: ['#ECFDF5', '#FFFFFF', '#14532D', '#0F766E'],
  },
  {
    id: 'civic-blue',
    name: 'Civic Blue',
    description: 'واضح للطلبات والخدمات',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#EFF6FF',
    surface: '#FFFFFF',
    text: '#172554',
    accent: '#2563EB',
    bold: '#1D4ED8',
    border: '#BFDBFE',
    swatches: ['#EFF6FF', '#FFFFFF', '#172554', '#2563EB'],
  },
  {
    id: 'warm-paper',
    name: 'Warm Paper',
    description: 'ناعم للاستبيانات الطويلة',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#FFF7ED',
    surface: '#FFFFFF',
    text: '#352516',
    accent: '#B7791F',
    bold: '#92400E',
    border: '#FED7AA',
    swatches: ['#FFF7ED', '#FFFFFF', '#92400E', '#B7791F'],
  },
  {
    id: 'clinic-green',
    name: 'Clinic Green',
    description: 'مريح للنماذج الصحية والتعليمية',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#F0FDF4',
    surface: '#FFFFFF',
    text: '#16332A',
    accent: '#16A34A',
    bold: '#166534',
    border: '#BBF7D0',
    swatches: ['#F0FDF4', '#FFFFFF', '#166534', '#16A34A'],
  },
  {
    id: 'event-night',
    name: 'Event Night',
    description: 'داكن ومناسب للتسجيلات والفعاليات',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    accent: '#38BDF8',
    bold: '#67E8F9',
    border: '#334155',
    swatches: ['#111827', '#1F2937', '#F9FAFB', '#38BDF8'],
  },
  {
    id: 'minimal-slate',
    name: 'Minimal Slate',
    description: 'محايد وكثيف للفرق التشغيلية',
    fontFamily: GLOBAL_FORM_FONT,
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    accent: '#475569',
    bold: '#1E293B',
    border: '#CBD5E1',
    swatches: ['#F8FAFC', '#FFFFFF', '#0F172A', '#475569'],
  },
];

export const DEFAULT_FORM_THEME_ID = 'alnamdj-core';

export const getFormTheme = (themeId?: string | null) =>
  FORM_THEMES.find((theme) => theme.id === themeId) || FORM_THEMES[0];

export const themeToSettings = (theme: FormTheme) => ({
  theme_id: theme.id,
  theme_font_family: theme.fontFamily,
  background_color: theme.background,
  text_color: theme.text,
  accent_color: theme.accent,
  bold_text_color: theme.bold,
  surface_color: theme.surface,
  border_color: theme.border,
});

export const resolveFormTheme = (settings: any = {}) => {
  const theme = getFormTheme(settings.theme_id || DEFAULT_FORM_THEME_ID);

  return {
    ...theme,
    fontFamily: GLOBAL_FORM_FONT,
    background: normalizeThemeColor(settings.background_color, 'background', theme.background),
    surface: settings.surface_color || theme.surface,
    text: normalizeThemeColor(settings.text_color, 'text', theme.text),
    accent: normalizeThemeColor(settings.accent_color, 'accent', theme.accent),
    bold: normalizeThemeColor(settings.bold_text_color || settings.accent_color, 'bold', theme.bold),
    border: settings.border_color || theme.border,
  };
};

export const buildThemeStyle = (settings: any = {}) => {
  const theme = resolveFormTheme(settings);
  return {
    theme,
    pageStyle: {
      background: theme.background,
      color: theme.text,
      fontFamily: theme.fontFamily,
    },
    surfaceStyle: {
      background: theme.surface,
      color: theme.text,
      borderColor: theme.border,
      fontFamily: theme.fontFamily,
    },
  };
};
