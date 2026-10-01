import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';

import { BottomSheet } from '@/src/components/anim/BottomSheet';
import { Skeleton } from '@/src/components/anim/Skeleton';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Input } from '@/src/components/ui/Input';
import { LinhaInfo } from '@/src/components/ui/LinhaInfo';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { useRecurso } from '@/src/hooks/useRecurso';
import { paraErroApi } from '@/src/services/api';
import { atualizarMeuPerfilMedico } from '@/src/services/medico.service';
import { listarUnidades } from '@/src/services/unidade.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import type { AtualizacaoMedico, Medico } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

interface FormPerfil {
  nomeCompleto: string;
  telefone: string;
  especialidade: string;
  unidadeSanitariaId: number | null;
}

function FormEditarPerfil({ medico, aoGuardar }: { medico: Medico; aoGuardar: (m: Medico) => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();
  const unidades = useRecurso(listarUnidades, []);

  const { control, handleSubmit, formState } = useForm<FormPerfil>({
    defaultValues: {
      nomeCompleto: medico.nomeCompleto,
      telefone: medico.telefone ?? '',
      especialidade: medico.especialidade ?? '',
      unidadeSanitariaId: medico.unidadeSanitariaId,
    },
  });

  const guardar = handleSubmit(async (d) => {
    setErro(null);
    if (d.nomeCompleto.trim().length < 3) {
      setErro('O nome não pode ficar vazio.');
      tremer();
      return;
    }
    const corpo: AtualizacaoMedico = {
      nomeCompleto: d.nomeCompleto.trim(),
      telefone: d.telefone.replace(/\s/g, '') || undefined,
      especialidade: d.especialidade.trim() || undefined,
      unidadeSanitariaId: d.unidadeSanitariaId ?? undefined,
    };
    try {
      aoGuardar(await atualizarMeuPerfilMedico(corpo));
    } catch (e) {
      setErro(paraErroApi(e).message);
      tremer();
    }
  });

  return (
    <Animated.View style={estilo}>
      <Alerta mensagem={erro} />
      <Controller
        control={control}
        name="nomeCompleto"
        render={({ field }) => <Input label="Nome completo" value={field.value} onChangeText={field.onChange} />}
      />
      <Controller
        control={control}
        name="telefone"
        render={({ field }) => (
          <Input label="Telefone" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="especialidade"
        render={({ field }) => (
          <Input label="Especialidade" placeholder="Ex.: Medicina Interna" value={field.value} onChangeText={field.onChange} />
        )}
      />
      {unidades.carregando ? (
        <Skeleton altura={38} raio={19} style={{ marginBottom: spacing.lg }} />
      ) : (
        <Controller
          control={control}
          name="unidadeSanitariaId"
          render={({ field }) => (
            <Opcoes<number>
              label="Unidade sanitária"
              opcoes={(unidades.dados ?? []).map((u) => ({ valor: u.id, titulo: u.nome }))}
              valor={field.value}
              onMudar={field.onChange}
            />
          )}
        />
      )}
      <Button titulo="Guardar" icone="content-save-outline" onPress={guardar} carregando={formState.isSubmitting} />
    </Animated.View>
  );
}

export default function PerfilMedico() {
  const router = useRouter();
  const medico = useSessaoStore((s) => s.medico);
  const definirMedico = useSessaoStore((s) => s.definirMedico);
  const sair = useSessaoStore((s) => s.sair);
  const [editar, setEditar] = useState(false);
  const [aSair, setASair] = useState(false);

  function confirmarSaida() {
    Alert.alert('Terminar sessão', 'Tem a certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setASair(true);
          await sair();
          router.replace('/(auth)/escolher-perfil' as any);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Meu Perfil" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.identificacao}>
          <Avatar nome={medico?.nomeCompleto} tamanho={96} />
          <Text style={styles.nome}>{medico?.nomeCompleto ?? '—'}</Text>
          <Text style={styles.unidade}>{medico?.especialidade ?? 'Médico'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.cartao}>
          <LinhaInfo icone="email-outline" titulo="Email" valor={medico?.email} />
          <LinhaInfo icone="card-account-details-outline" titulo="Nº da Ordem" valor={medico?.numeroOrdem} />
          <LinhaInfo icone="phone-outline" titulo="Telefone" valor={medico?.telefone ?? '—'} />
          <LinhaInfo
            icone="hospital-building"
            titulo="Unidade sanitária"
            valor={medico?.unidadeSanitariaNome ?? '—'}
            ultima
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={[styles.cartao, { marginTop: spacing.lg }]}>
          <LinhaInfo icone="account-edit-outline" titulo="Editar perfil" onPress={() => setEditar(true)} />
          <LinhaInfo
            icone="lock-reset"
            titulo="Alterar senha"
            onPress={() => router.push('/alterar-senha' as any)}
            ultima
          />
        </Animated.View>

        <View style={styles.sair}>
          <Button titulo="Terminar sessão" icone="logout" variante="perigoContorno" onPress={confirmarSaida} carregando={aSair} />
        </View>
      </ScrollView>

      <BottomSheet visivel={editar} aoFechar={() => setEditar(false)} titulo="Editar perfil">
        {medico ? (
          <FormEditarPerfil
            medico={medico}
            aoGuardar={(m) => {
              definirMedico(m);
              setEditar(false);
              toast.sucesso('Perfil atualizado');
            }}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  identificacao: { alignItems: 'center', marginBottom: spacing.xl, gap: 2 },
  nome: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.primaryDark, textAlign: 'center', marginTop: spacing.md },
  unidade: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  sair: { marginTop: spacing.xl },
});
