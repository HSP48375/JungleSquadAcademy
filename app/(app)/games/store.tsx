import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coins, Clock, Gift, Crown } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import { router } from 'expo-router';

const COIN_PACKAGES = [
  { id: 'small', amount: 5, price: 0.99, bonus: 0 },
  { id: 'medium', amount: 25, price: 3.99, bonus: 3 },
  { id: 'large', amount: 60, price: 7.99, bonus: 10 },
];

export default function StoreScreen() {
  const { session } = useAuth();
  const { coins, loading, error, earnFreeCoins, purchaseCoins } = useCoins(session?.user?.id ?? '');

  const handlePurchase = async (amount: number, price: number) => {
    const sessionId = await purchaseCoins(amount, price);
    if (sessionId) {
      // Handle Stripe checkout
    }
  };

  const canEarnFree = coins?.next_free_coin_at && new Date(coins.next_free_coin_at) <= new Date();
  const timeUntilNext = coins?.next_free_coin_at 
    ? Math.max(0, Math.floor((new Date(coins.next_free_coin_at).getTime() - Date.now()) / 1000 / 60))
    : 0;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(255,215,0,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Jungle Coin Store</Text>
        <Text style={styles.subtitle}>Power up your learning journey!</Text>
      </View>

      <View style={styles.balanceCard}>
        <Coins size={32} color="#FFD700" />
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceTitle}>Your Balance</Text>
          <Text style={styles.balanceAmount}>{coins?.balance ?? 0} Coins</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.freeCoinsCard,
          !canEarnFree && styles.freeCoinsDisabled
        ]}
        onPress={() => canEarnFree && earnFreeCoins()}
        disabled={!canEarnFree}
      >
        <Gift size={24} color="#00FFA9" />
        <View style={styles.freeCoinsInfo}>
          <Text style={styles.freeCoinsTitle}>
            {canEarnFree ? 'Claim Free Coin' : 'Next Coin Available In'}
          </Text>
          <Text style={styles.freeCoinsSubtitle}>
            {canEarnFree 
              ? 'Tap to claim your free coin!'
              : `${timeUntilNext} minutes remaining`
            }
          </Text>
        </View>
        <Clock size={24} color="#666666" />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buy Coins</Text>
        {COIN_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={styles.packageCard}
            onPress={() => handlePurchase(pkg.amount, pkg.price)}
          >
            <View style={styles.packageInfo}>
              <Text style={styles.packageAmount}>{pkg.amount} Coins</Text>
              {pkg.bonus > 0 && (
                <Text style={styles.packageBonus}>+{pkg.bonus} Bonus</Text>
              )}
              <Text style={styles.packagePrice}>${pkg.price}</Text>
            </View>
            <Coins size={32} color="#FFD700" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.subscriptionCard}
        onPress={() => router.push('/subscription')}
      >
        <Crown size={32} color="#FFD700" />
        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionTitle}>Game Pass</Text>
          <Text style={styles.subscriptionPrice}>$9.99/month</Text>
          <Text style={styles.subscriptionDesc}>
            Unlimited coins & premium content
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  balanceInfo: {
    marginLeft: 16,
  },
  balanceTitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  balanceAmount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFD700',
  },
  freeCoinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00FFA9',
  },
  freeCoinsDisabled: {
    opacity: 0.5,
    borderColor: '#333333',
  },
  freeCoinsInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  freeCoinsTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  freeCoinsSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  packageInfo: {
    flex: 1,
  },
  packageAmount: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  packageBonus: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
    marginTop: 4,
  },
  packagePrice: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFD700',
    marginTop: 8,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  subscriptionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  subscriptionPrice: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFD700',
    marginTop: 4,
  },
  subscriptionDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
});