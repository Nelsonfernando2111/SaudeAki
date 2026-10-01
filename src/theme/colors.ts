export const colors = {
  primary: '#2563EB',
  primaryDark: '#1E3A8A', // títulos e textos de destaque
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  purple: '#7C3AED',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  skeleton: '#E2E8F0',

  text: '#0F172A',
  textSecondary: '#64748B',
  white: '#FFFFFF',

  // variações suaves para fundos de ícones e badges
  primarySoft: '#DBEAFE',
  primaryFaint: '#EFF6FF',
  successSoft: '#D1FAE5',
  errorSoft: '#FEE2E2',
  warningSoft: '#FEF3C7',
  warningText: '#B45309',
  purpleSoft: '#EDE9FE',
} as const;

export const sombra = {
  shadowColor: '#1E3A8A',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
