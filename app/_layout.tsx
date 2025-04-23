import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady'; // Relative path
import { useFonts } from 'expo-font'; 
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { useAuth } from '../hooks/useAuth'; // Relative path
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading: authLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);

  // Load fonts locally using correct relative paths and casing
  const [fontsLoaded, fontError] = useFonts({
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
    if (fontsLoaded && !authLoading) {
      setAppReady(true);
    }
  }, [fontsLoaded, fontError, authLoading]);

  useEffect(() => {
    if (appReady) {
      logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });
      logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) });

      textOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
      textTranslateY.value = withDelay(400, withTiming(0, { duration: 800 }));
      subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

      setTimeout(() => {
        backgroundOpacity.value = withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.quad),
        }, () => {
          runOnJS(setSplashAnimationComplete)(true);
          runOnJS(SplashScreen.hideAsync)();
        });
      }, 2500);
    }
  }, [appReady]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  // Render loading/error state or null while fonts are loading or if error
  if (!splashAnimationComplete) {
    // Add fallback UI while fonts load
    if (!fontsLoaded && !fontError) {
      return (
        <View style={styles.splashContainer}>
          <Text style={{ color: 'white' }}>Loading fonts...</Text>
        </View>
      );
    }
    if (fontError) {
      return (
        <View style={styles.splashContainer}>
          <Text style={{ color: 'red', padding: 20 }}>Failed to load fonts. App cannot start.</Text>
        </View>
      );
    }
    // Fonts loaded, animation is running
    return (
      <Animated.View style={[styles.splashContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#1A0B2E', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.vinesContainer}>
          {/* ... vines ... */}
        </View>
        <View style={styles.splashContent}>
          <Animated.Image
            source={require('../../assets/images/JungleSquadLogo.png')} // Corrected path
            style={[styles.logo, logoAnimatedStyle]}
          />
          <Animated.Text style={[styles.title, textAnimatedStyle]}>
            Jungle Squad Academy
          </Animated.Text>
          <Animated.Text style={[styles.mainTagline, textAnimatedStyle]}>
            The World's Most Advanced AI Tutoring Ecosystem
          </Animated.Text>
          <Animated.Text style={[styles.subTagline, subtitleAnimatedStyle]}>
            Welcome to the (AI) jungle.
          </Animated.Text>
        </View>
      </Animated.View>
    );
  }

  // App is ready and splash animation is complete
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  vinesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  vine: {
    position: 'absolute',
    width: 150,
    height: 150,
  },
  vineGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  vineTopLeft: {
    top: 0,
    left: 0,
    transform: [{ rotate: '45deg' }],
  },
  vineTopRight: {
    top: 0,
    right: 0,
    transform: [{ rotate: '-45deg' }],
  },
  vineBottomLeft: {
    bottom: 0,
    left: 0,
    transform: [{ rotate: '-45deg' }],
  },
  vineBottomRight: {
    bottom: 0,
    right: 0,
    transform: [{ rotate: '45deg' }],
  },
  splashContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#00FFA9',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  mainTagline: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#00FFA9',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 300,
    lineHeight: 26,
  },
  subTagline: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#B794F6',
    textAlign: 'center',
  },
});
