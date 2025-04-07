import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function StudyGroupsLayout() {
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
          title: 'Study Groups',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          title: route.params?.name || 'Group Details',
          presentation: 'card',
        })}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Study Group',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}