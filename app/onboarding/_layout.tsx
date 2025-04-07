import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0A0A' }
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="avatar" />
      <Stack.Screen name="learning-type" />
      <Stack.Screen name="learning-track" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}