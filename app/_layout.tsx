import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
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

  const [fontsLoaded, fontError] = useFonts({
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      setAppReady(true);
    }
  }, [fontsLoaded, authLoading]);

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

  if (!splashAnimationComplete) {
    return (
      <Animated.View style={[styles.splashContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#1A0B2E', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.vinesContainer}>
          <Animated.View style={[styles.vine, styles.vineTopLeft]}>
            <LinearGradient
              colors={['transparent', '#00FFA9']}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.vineGradient}
            />
          </Animated.View>
          <Animated.View style={[styles.vine, styles.vineTopRight]}>
            <LinearGradient
              colors={['transparent', '#00AAFF']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.vineGradient}
            />
          </Animated.View>
          <Animated.View style={[styles.vine, styles.vineBottomLeft]}>
            <LinearGradient
              colors={['transparent', '#FF00FF']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.vineGradient}
            />
          </Animated.View>
          <Animated.View style={[styles.vine, styles.vineBottomRight]}>
            <LinearGradient
              colors={['transparent', '#FFAA00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vineGradient}
            />
          </Animated.View>
        </View>

        <View style={styles.splashContent}>
          <Animated.Image
            source={require('@/assets/images/JungleSquadLogo.png')}
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
    shadowColor: '#00FFA9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
