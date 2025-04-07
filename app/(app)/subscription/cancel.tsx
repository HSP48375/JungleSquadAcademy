import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import AppMetadata from '@/components/AppMetadata';

export default function SubscriptionCancelScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#0F172A', '#0A0A0A', '#0A0A0A']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertCircle size={64} color="#FF4444" />
        </View>

        <Text style={styles.title}>Subscription Not Completed</Text>
        <Text style={styles.message}>
          Your subscription process was canceled or encountered an issue. No charges have been made to your account.
        </Text>

        <AppMetadata showFull={false} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/subscription')}
        >
          <ChevronLeft size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Back to Subscription Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/(app)')}
        >
          <Text style={styles.secondaryButtonText}>Continue with Free Access</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 68, 68, 0.3)',
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    marginBottom: 16,
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#666666',
  },
});