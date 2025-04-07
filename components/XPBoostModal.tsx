import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface XPBoostModalProps {
  onPurchaseBoost: (duration: number, cost: number) => void;
  onClose: () => void;
}

export default function XPBoostModal({ onPurchaseBoost, onClose }: XPBoostModalProps) {
  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.modal}>
        <Text style={styles.title}>Power Up Your Progress!</Text>
        <Text style={styles.subtitle}>You're on a roll! Keep the momentum going with an XP boost:</Text>

        <TouchableOpacity 
          style={styles.boostOption}
          onPress={() => onPurchaseBoost(10, 2)}
        >
          <View style={styles.boostHeader}>
            <Zap size={24} color="#00FFA9" />
            <Text style={styles.boostTitle}>Quick Boost</Text>
            <Text style={styles.boostCost}>2 coins</Text>
          </View>
          <View style={styles.boostDetails}>
            <Clock size={16} color="#666666" />
            <Text style={styles.boostTime}>2x XP for 10 minutes</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.boostOption}
          onPress={() => onPurchaseBoost(60, 99)}
        >
          <View style={styles.boostHeader}>
            <Zap size={24} color="#FFD700" />
            <Text style={styles.boostTitle}>Ultimate Boost</Text>
            <Text style={styles.boostCost}>$0.99</Text>
          </View>
          <View style={styles.boostDetails}>
            <Clock size={16} color="#666666" />
            <Text style={styles.boostTime}>Unlimited XP for 1 hour</Text>
          </View>
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
    color: '#00FFA9',
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
  boostOption: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  boostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  boostCost: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  boostDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boostTime: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  closeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
  },
});