import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface InputProps extends TextInputProps {
  label?: string;
  erro?: string;
  senha?: boolean;
  icone?: IconName;
  ajuda?: string;
}

export function Input({ label, erro, senha = false, icone, ajuda, style, multiline, ...rest }: InputProps) {
  const [oculta, setOculta] = useState(senha);
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.campo,
          multiline && styles.campoMultilinha,
          focado && styles.campoFocado,
          !!erro && styles.campoErro,
        ]}
      >
        {icone ? (
          <MaterialCommunityIcons
            name={icone}
            size={20}
            color={focado ? colors.primary : colors.textSecondary}
          />
        ) : null}
        <TextInput
          {...rest}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultilinha, style]}
          secureTextEntry={oculta}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setFocado(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            rest.onBlur?.(e);
          }}
        />
        {senha && (
          <Pressable
            onPress={() => setOculta((v) => !v)}
            hitSlop={10}
            accessibilityLabel={oculta ? 'Mostrar senha' : 'Ocultar senha'}
          >
            <MaterialCommunityIcons
              name={oculta ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {erro ? (
        <Text style={styles.erro}>{erro}</Text>
      ) : ajuda ? (
        <Text style={styles.ajuda}>{ajuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  campoMultilinha: { height: undefined, minHeight: 90, alignItems: 'flex-start', paddingVertical: 12 },
  campoFocado: { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
  campoErro: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text,
  },
  inputMultilinha: { textAlignVertical: 'top', minHeight: 66 },
  erro: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  ajuda: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
