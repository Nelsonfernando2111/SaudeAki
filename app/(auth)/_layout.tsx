import { Stack } from 'expo-router';
import { opcoesStack } from '@/src/utils/navegacao';

export default function AuthLayout() {
  return <Stack screenOptions={opcoesStack} />;
}
