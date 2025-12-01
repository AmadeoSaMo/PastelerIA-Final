
export type Theme = 'natural' | 'gourmet' | 'tech';

export type ThemePalette = {
  '--color-primary-50': string;
  '--color-primary-100': string;
  '--color-primary-500': string;
  '--color-primary-600': string;
  '--color-primary-800': string;
  '--color-neutral-50': string;
  '--color-neutral-100': string;
  '--color-neutral-200': string;
  '--color-neutral-300': string;
  '--color-neutral-400': string;
  '--color-neutral-500': string;
  '--color-neutral-600': string;
  '--color-neutral-700': string;
  '--color-neutral-800': string;
  '--color-neutral-900': string;
};

export const themes: Record<Theme, ThemePalette> = {
  natural: {
    '--color-primary-50': '#FEF6F4',
    '--color-primary-100': '#FCE9E5',
    '--color-primary-500': '#D05A46', // Oscurecido para mejor contraste
    '--color-primary-600': '#B03E2C', // Más oscuro para botones accesibles
    '--color-primary-800': '#852515', // Texto oscuro
    '--color-neutral-50': '#FAFAF9', 
    '--color-neutral-100': '#F5F5F4',
    '--color-neutral-200': '#E7E5E4',
    '--color-neutral-300': '#D6D3D1',
    '--color-neutral-400': '#A8A29E',
    '--color-neutral-500': '#78716C',
    '--color-neutral-600': '#57534E',
    '--color-neutral-700': '#44403C',
    '--color-neutral-800': '#292524',
    '--color-neutral-900': '#1C1917',
  },
  gourmet: {
    '--color-primary-50': '#F9F5F1',
    '--color-primary-100': '#EAE0D5',
    '--color-primary-500': '#4A2C2A', 
    '--color-primary-600': '#3C2321',
    '--color-primary-800': '#2A1817',
    '--color-neutral-50': '#FDFBF8', 
    '--color-neutral-100': '#F5EFE6',
    '--color-neutral-200': '#E8E1D9',
    '--color-neutral-300': '#D8CEC4',
    '--color-neutral-400': '#B0A69C',
    '--color-neutral-500': '#897F76',
    '--color-neutral-600': '#665F58',
    '--color-neutral-700': '#514A44',
    '--color-neutral-800': '#3C3631',
    '--color-neutral-900': '#282421',
  },
  tech: {
    '--color-primary-50': '#EFF6FF',
    '--color-primary-100': '#DBEAFE',
    '--color-primary-500': '#3B82F6', 
    '--color-primary-600': '#2563EB',
    '--color-primary-800': '#1E40AF',
    '--color-neutral-50': '#F8FAFC', 
    '--color-neutral-100': '#F1F5F9',
    '--color-neutral-200': '#E2E8F0',
    '--color-neutral-300': '#CBD5E1',
    '--color-neutral-400': '#94A3B8',
    '--color-neutral-500': '#64748B',
    '--color-neutral-600': '#475569',
    '--color-neutral-700': '#334155',
    '--color-neutral-800': '#1E293B',
    '--color-neutral-900': '#0F172A',
  },
};
