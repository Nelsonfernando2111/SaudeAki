import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/src/theme';

export function LogoMini() {
  return (
    <View style={styles.container}>
      <View style={styles.icone}>
        <MaterialCommunityIcons name="heart" size={32} color={colors.primary} />
        <View style={styles.cruz}>
          <MaterialCommunityIcons name="plus-thick" size={16} color={colors.white} />
        </View>
      </View>
      <View>
        <Text style={styles.nome}>SAUDEID</Text>
        <Text style={styles.slogan}>A sua saúde, em boas mãos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icone: { width: 32, height: 32 },
  cruz: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  nome: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.primaryDark, letterSpacing: 1 },
  slogan: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.textSecondary },
});
