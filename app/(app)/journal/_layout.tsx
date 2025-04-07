import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function JournalLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontFamily: 'SpaceGrotesk-Bold',
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Learning Journal',
        }}
      />
      <Stack.Screen
        name="[week]"
        options={{
          title: 'Past Entry',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}