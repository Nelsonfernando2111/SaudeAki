import { Redirect } from 'expo-router';

// A primeira tela é a escolha de perfil (médico ou paciente)
export default function Inicio() {
  return <Redirect href={'/(auth)/escolher-perfil' as any} />;
}
