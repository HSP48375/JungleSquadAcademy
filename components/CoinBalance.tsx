import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Coins } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { router } from 'expo-router';

export default function CoinBalance() {
  const { session } = useAuth();
  const { coins, loading } = useCoins(session?.user?.id ?? '');

  if (loading || !coins) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/games/store')}
    >
      <Coins size={20} color="#FFD700" />
      <Text style={styles.balance}>{coins.balance}</Text>
      <Text style={styles.label}>Coins</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    right: 20,
  },
  balance: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 6,
  },
  label: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
});