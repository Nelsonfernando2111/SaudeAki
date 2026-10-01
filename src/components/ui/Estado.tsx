import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface EstadoProps {
  icone: IconName;
  titulo: string;
  texto?: string;
  cor?: string;
  fundo?: string;
  acao?: { titulo: string; onPress: () => void };
}

/** Mensagem centrada para listas vazias, erros e acessos bloqueados */
export function Estado({
  icone,
  titulo,
  texto,
  cor = colors.primary,
  fundo = colors.primarySoft,
  acao,
}: EstadoProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={[styles.icone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={30} color={cor} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {texto ? <Text style={styles.texto}>{texto}</Text> : null}
      {acao ? (
        <View style={styles.acao}>
          <Button titulo={acao.titulo} variante="secundario" onPress={acao.onPress} />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  icone: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text, textAlign: 'center' },
  texto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  acao: { alignSelf: 'stretch', marginTop: spacing.md },
});
