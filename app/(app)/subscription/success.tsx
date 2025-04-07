import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Trophy, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import ConfettiCannon from 'react-native-confetti-cannon';
import AppMetadata from '@/components/AppMetadata';

export default function SubscriptionSuccessScreen() {
  const { session_id } = useLocalSearchParams();
  const { session } = useAuth();
  const [confettiActive, setConfettiActive] = useState(true);

  useEffect(() => {
    // Reset confetti after 5 seconds
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#0F172A', '#0A0A0A', '#0A0A0A']}
        style={styles.gradient}
      />

      {confettiActive && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          fallSpeed={2500}
          fadeOut={true}
          colors={['#00FFA9', '#FFD700', '#FF69B4', '#7B68EE']}
        />
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#00FFA9', '#00CC88']}
            style={styles.iconBackground}
          >
            <Check size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Subscription Activated!</Text>
        <Text style={styles.message}>
          Your premium features are now unlocked. Get ready for an enhanced learning experience!
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Check size={20} color="#00FFA9" />
            <Text style={styles.benefitText}>Access to premium tutors</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check size={20} color="#00FFA9" />
            <Text style={styles.benefitText}>Exclusive learning content</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check size={20} color="#00FFA9" />
            <Text style={styles.benefitText}>Advanced progress tracking</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check size={20} color="#00FFA9" />
            <Text style={styles.benefitText}>Premium games and challenges</Text>
          </View>
        </View>

        <AppMetadata showFull={true} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(app)')}
        >
          <Text style={styles.buttonText}>Start Exploring</Text>
          <ChevronRight size={20} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/chat')}
        >
          <Trophy size={20} color="#00FFA9" />
          <Text style={styles.secondaryButtonText}>Meet Your Tutors</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FFA9',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: '#BBBBBB',
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: 400,
  },
  benefitsContainer: {
    backgroundColor: 'rgba(26, 11, 46, 0.5)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  benefitText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
  },
  buttonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#000000',
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,255,169,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#00FFA9',
  },
});