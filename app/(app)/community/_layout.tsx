import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function CommunityLayout() {
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
          title: 'Community',
        }}
      />
      <Stack.Screen
        name="quotes"
        options={{
          title: 'Community Quotes',
        }}
      />
      <Stack.Screen
        name="avatar-of-week"
        options={{
          title: 'Avatar of the Week',
        }}
      />
      <Stack.Screen
        name="referrals"
        options={{
          title: 'Invite Friends',
        }}
      />
      <Stack.Screen
        name="leaderboard"
        options={{
          title: 'Referral Champions',
        }}
      />
      <Stack.Screen
        name="hall-of-fame"
        options={{
          title: 'Quote Hall of Fame',
        }}
      />
      <Stack.Screen
        name="share-quote"
        options={{
          title: 'Share Quote',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}