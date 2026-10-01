import { Tabs } from 'expo-router';
import { ColorValue, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CabecalhoApp } from '@/src/components/ui/CabecalhoApp';
import { colors, fontFamily } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function icone(ativo: IconName, inativo: IconName) {
  return function IconeTab({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <MaterialCommunityIcons name={focused ? ativo : inativo} size={24} color={color as string} />;
  };
}

export default function PacienteTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: ({ options, route }) => (
          <CabecalhoApp titulo={options.title} logo={route.name === 'index'} />
        ),
        animation: 'shift',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home', 'home-outline') }} />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico Clínico',
          tabBarLabel: 'Histórico',
          tabBarIcon: icone('clipboard-text-clock', 'clipboard-text-clock-outline'),
        }}
      />
      <Tabs.Screen
        name="acessos"
        options={{ title: 'Acessos', tabBarIcon: icone('shield-lock', 'shield-lock-outline') }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Meu Perfil', tabBarLabel: 'Perfil', tabBarIcon: icone('account', 'account-outline') }}
      />
    </Tabs>
  );
}
