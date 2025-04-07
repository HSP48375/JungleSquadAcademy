import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function ProgressLayout() {
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
          title: 'Progress',
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          title: 'Daily Challenges',
        }}
      />
      <Stack.Screen
        name="journal"
        options={{
          title: 'Learning Journal',
        }}
      />
      <Stack.Screen
        name="entry/[id]"
        options={{
          title: 'Journal Entry',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}