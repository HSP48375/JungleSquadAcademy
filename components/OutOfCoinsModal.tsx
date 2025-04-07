import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Coins, Clock, Play, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface OutOfCoinsModalProps {
  onClose: () => void;
  onWatchAd: () => void;
  timeUntilNext: number;
}

export default function OutOfCoinsModal({ onClose, onWatchAd, timeUntilNext }: OutOfCoinsModalProps) {
  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.modal}>
        <Text style={styles.title}>Out of Jungle Coins!</Text>
        <Text style={styles.subtitle}>But don't worry — you've got options:</Text>

        <TouchableOpacity style={styles.option} onPress={() => router.push('/games/store')}>
          <Coins size={24} color="#FFD700" />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Buy More Coins</Text>
            <Text style={styles.optionDesc}>Get instant coins from $0.99</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.option, timeUntilNext > 0 && styles.optionDisabled]} 
          disabled={timeUntilNext > 0}
        >
          <Clock size={24} color="#00FFA9" />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Wait for Free Coin</Text>
            <Text style={styles.optionDesc}>
              {timeUntilNext > 0 
                ? `${timeUntilNext} minutes remaining`
                : 'Claim your free coin now!'
              }
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onWatchAd}>
          <Play size={24} color="#FF69B4" />
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Watch & Earn</Text>
            <Text style={styles.optionDesc}>Watch a short video for 1 coin</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.subscribeButton}
          onPress={() => router.push('/subscription')}
        >
          <Crown size={24} color="#000000" />
          <Text style={styles.subscribeText}>Get Unlimited Coins</Text>
          <Text style={styles.subscribePrice}>$9.99/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  subscribeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  subscribePrice: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  closeButton: {
    alignItems: 'center',
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
});