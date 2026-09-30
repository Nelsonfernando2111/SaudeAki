export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  h1: { fontFamily: fontFamily.semibold, fontSize: 24 },
  h2: { fontFamily: fontFamily.semibold, fontSize: 20 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 18 },
  body: { fontFamily: fontFamily.regular, fontSize: 16 },
  caption: { fontFamily: fontFamily.regular, fontSize: 14 },
  small: { fontFamily: fontFamily.regular, fontSize: 12 },
} as const;