import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AppMetadataProps {
  showFull?: boolean;
}

export default function AppMetadata({ showFull = false }: AppMetadataProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(26, 11, 46, 0.8)', 'rgba(15, 23, 42, 0.8)']}
        style={styles.background}
      />
      
      <Text style={styles.appName}>Jungle Squad Academy</Text>
      
      {showFull && (
        <>
          <Text style={styles.tagline}>The World's Most Advanced AI Tutoring Ecosystem</Text>
          <Text style={styles.subline}>Join the squad. Transform your potential.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 10,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  appName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#00FFA9',
    textAlign: 'center',
    marginTop: 8,
  },
  subline: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#B794F6',
    textAlign: 'center',
    marginTop: 4,
  },
});