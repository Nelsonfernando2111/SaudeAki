import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVoltar } from '@/src/hooks/useVoltar';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Input } from '@/src/components/ui/Input';
import { paraErroApi } from '@/src/services/api';
import { alterarSenha } from '@/src/services/auth.service';
import { toast } from '@/src/store/toast.store';
import { colors, fontFamily, spacing } from '@/src/theme';

const schema = z
  .object({
    senhaAtual: z.string().min(1, 'Informe a senha atual'),
    novaSenha: z.string().min(4, 'Mínimo 4 caracteres'),
    confirmar: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.novaSenha === d.confirmar, {
    message: 'As senhas não coincidem',
    path: ['confirmar'],
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    message: 'A nova senha tem de ser diferente da atual',
    path: ['novaSenha'],
  });

type Form = z.infer<typeof schema>;

const CAMPOS: { nome: keyof Form; label: string }[] = [
  { nome: 'senhaAtual', label: 'Senha atual' },
  { nome: 'novaSenha', label: 'Nova senha' },
  { nome: 'confirmar', label: 'Confirmar nova senha' },
];

export default function AlterarSenha() {
  const voltar = useVoltar();
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmar: '' },
  });

  const guardar = handleSubmit(
    async (d) => {
      setErro(null);
      try {
        await alterarSenha(d.senhaAtual, d.novaSenha);
        toast.sucesso('Senha alterada. Os outros dispositivos terão de entrar de novo.');
        voltar();
      } catch (e) {
        const err = paraErroApi(e);
        setErro(err.status === 401 ? 'A senha atual está incorreta.' : err.message);
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Cabecalho titulo="Alterar senha" voltar />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.texto}>
          Ao alterar a senha, as sessões noutros dispositivos são terminadas.
        </Text>
        <Animated.View style={estilo}>
          <Alerta mensagem={erro} />
          {CAMPOS.map((c) => (
            <Controller
              key={c.nome}
              control={control}
              name={c.nome}
              render={({ field, fieldState }) => (
                <Input
                  senha
                  label={c.label}
                  icone="lock-outline"
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />
          ))}
        </Animated.View>
        <View style={{ height: spacing.sm }} />
        <Button titulo="Guardar nova senha" onPress={guardar} carregando={formState.isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl },
  texto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
});
