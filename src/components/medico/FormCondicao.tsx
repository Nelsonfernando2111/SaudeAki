import { useState } from 'react';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { atualizarCondicao, registarCondicao } from '@/src/services/condicao.service';
import { paraErroApi } from '@/src/services/api';
import type { CondicaoMedica } from '@/src/types';

const schema = z.object({
  tipo: z.enum(['ALERGIA', 'DOENCA_CRONICA'], { message: 'Escolha o tipo' }),
  descricao: z.string().trim().min(2, 'Descreva a condição'),
  severidade: z.enum(['BAIXA', 'MEDIA', 'CRITICA'], { message: 'Escolha a severidade' }),
});

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: CondicaoMedica;
  aoGuardar: (condicao: CondicaoMedica) => void;
}

export function FormCondicao({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: inicial?.tipo ?? 'ALERGIA',
      descricao: inicial?.descricao ?? '',
      severidade: inicial?.severidade ?? 'MEDIA',
    },
  });

  const guardar = handleSubmit(
    async (dados) => {
      setErro(null);
      try {
        const resultado = inicial
          ? await atualizarCondicao(inicial.id, dados)
          : await registarCondicao(pacienteId, dados);
        aoGuardar(resultado);
      } catch (e) {
        setErro(paraErroApi(e).message);
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <Animated.View style={estilo}>
      <Alerta mensagem={erro} />
      <Controller
        control={control}
        name="tipo"
        render={({ field, fieldState }) => (
          <Opcoes
            label="Tipo"
            opcoes={[
              { valor: 'ALERGIA', titulo: 'Alergia' },
              { valor: 'DOENCA_CRONICA', titulo: 'Doença crónica' },
            ]}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="descricao"
        render={({ field, fieldState }) => (
          <Input
            label="Descrição"
            placeholder="Ex.: Alergia a Penicilina"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="severidade"
        render={({ field, fieldState }) => (
          <Opcoes
            label="Severidade"
            opcoes={[
              { valor: 'BAIXA', titulo: 'Baixa' },
              { valor: 'MEDIA', titulo: 'Média' },
              { valor: 'CRITICA', titulo: 'Crítica' },
            ]}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Button
        titulo={inicial ? 'Guardar alterações' : 'Registar'}
        icone="content-save-outline"
        onPress={guardar}
        carregando={formState.isSubmitting}
      />
    </Animated.View>
  );
}
