import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius } from '@/src/theme';

interface InputProps extends TextInputProps {
  label?: string;
  erro?: string;
  senha?: boolean;
  escuro?: boolean;
}

export function Input({ label, erro, senha = false, escuro = false, style, ...rest }: InputProps) {
  const [oculta, setOculta] = useState(senha);
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.container}>
        {label ? (
        <Text style={[styles.label, escuro && { color: colors.white }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.campo,
          focado && styles.campoFocado,
          !!erro && styles.campoErro,
        ]}
      >
        <TextInput
          {...rest}
          style={[styles.input, style]}
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
          <Pressable onPress={() => setOculta((v) => !v)} hitSlop={10}>
            <MaterialCommunityIcons
              name={oculta ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

        {erro ? (
        <Text style={[styles.erro, escuro && { color: '#FCA5A5' }]}>{erro}</Text>
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
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  campoFocado: { borderColor: colors.primary },
  campoErro: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text,
  },
  erro: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});