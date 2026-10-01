import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fontFamily, radius } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Etiqueta({
  texto,
  cor,
  fundo,
  icone,
}: {
  texto: string;
  cor: string;
  fundo: string;
  icone?: IconName;
}) {
  return (
    <View style={[styles.etiqueta, { backgroundColor: fundo }]}>
      {icone ? <MaterialCommunityIcons name={icone} size={13} color={cor} /> : null}
      <Text style={[styles.texto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  texto: { fontFamily: fontFamily.medium, fontSize: 12 },
});
