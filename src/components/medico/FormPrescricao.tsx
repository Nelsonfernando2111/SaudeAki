import { useState } from 'react';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { atualizarPrescricao, registarPrescricao } from '@/src/services/prescricao.service';
import { paraErroApi } from '@/src/services/api';
import type { Prescricao } from '@/src/types';

const schema = z.object({
  nomeMedicamento: z.string().trim().min(2, 'Informe o medicamento'),
  dosagem: z.string().trim(),
  frequencia: z.string().trim(),
  duracao: z.string().trim(),
});

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: Prescricao;
  aoGuardar: (prescricao: Prescricao) => void;
}

const CAMPOS: { nome: keyof Form; label: string; placeholder: string }[] = [
  { nome: 'nomeMedicamento', label: 'Medicamento', placeholder: 'Ex.: Amlodipina' },
  { nome: 'dosagem', label: 'Dosagem', placeholder: 'Ex.: 5mg' },
  { nome: 'frequencia', label: 'Frequência', placeholder: 'Ex.: 1x ao dia' },
  { nome: 'duracao', label: 'Duração', placeholder: 'Ex.: 30 dias' },
];

export function FormPrescricao({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeMedicamento: inicial?.nomeMedicamento ?? '',
      dosagem: inicial?.dosagem ?? '',
      frequencia: inicial?.frequencia ?? '',
      duracao: inicial?.duracao ?? '',
    },
  });

  const guardar = handleSubmit(
    async (dados) => {
      setErro(null);
      // Campos vazios não são enviados (ficam como estavam)
      const corpo = Object.fromEntries(
        Object.entries(dados).filter(([, v]) => v.length > 0)
      ) as Form;
      try {
        const resultado = inicial
          ? await atualizarPrescricao(inicial.id, corpo)
          : await registarPrescricao(pacienteId, corpo);
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
      {CAMPOS.map((c) => (
        <Controller
          key={c.nome}
          control={control}
          name={c.nome}
          render={({ field, fieldState }) => (
            <Input
              label={c.label}
              placeholder={c.placeholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              erro={fieldState.error?.message}
            />
          )}
        />
      ))}
      <Button
        titulo={inicial ? 'Guardar alterações' : 'Prescrever'}
        icone="pill"
        onPress={guardar}
        carregando={formState.isSubmitting}
      />
    </Animated.View>
  );
}
