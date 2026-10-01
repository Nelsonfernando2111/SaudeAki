import { StyleSheet, View } from 'react-native';

import { SkeletonLista, Skeleton } from '@/src/components/anim/Skeleton';
import { VistaHistorico } from '@/src/components/shared/VistaHistorico';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Estado } from '@/src/components/ui/Estado';
import { useRecurso } from '@/src/hooks/useRecurso';
import { obterMeuHistorico } from '@/src/services/paciente.service';
import { colors, spacing } from '@/src/theme';

export default function Historico() {
  const historico = useRecurso(obterMeuHistorico, [], { aoFocar: true });

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Histórico Clínico" />

      {historico.carregando ? (
        <View style={styles.esqueleto}>
          <Skeleton altura={44} raio={22} />
          <SkeletonLista itens={4} />
        </View>
      ) : historico.dados ? (
        <VistaHistorico
          historico={historico.dados}
          aAtualizar={historico.aAtualizar}
          aoAtualizar={historico.atualizar}
        />
      ) : (
        <Estado
          icone="cloud-alert-outline"
          titulo="Não foi possível carregar o histórico"
          texto={historico.erro?.message}
          acao={{ titulo: 'Tentar de novo', onPress: historico.atualizar }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  esqueleto: { padding: spacing.xl, gap: spacing.lg },
});
