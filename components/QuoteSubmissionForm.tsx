import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote, Send, AlertCircle, Clock } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from '@/components/GlassmorphicCard';

interface QuoteSubmissionFormProps {
  theme: {
    id: string;
    theme: string;
    description: string;
    end_date: string;
  } | null;
  onSubmit: (quoteText: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  hasSubmitted: boolean;
}

export default function QuoteSubmissionForm({
  theme,
  onSubmit,
  loading,
  error,
  hasSubmitted,
}: QuoteSubmissionFormProps) {
  const [quoteText, setQuoteText] = useState('');
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [charCount, setCharCount] = useState(0);
  
  // Animation values
  const glowOpacity = useSharedValue(0.5);
  const buttonScale = useSharedValue(1);
  const inputBorderGlow = useSharedValue(0.3);
  
  // Set up animations
  useEffect(() => {
    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Input border animation
    inputBorderGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Button animation on press
  const animateButton = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };
  
  // Update time remaining
  useEffect(() => {
    if (!theme) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(theme.end_date);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [theme]);
  
  // Update character count
  useEffect(() => {
    setCharCount(quoteText.length);
  }, [quoteText]);
  
  // Animated styles
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  const inputStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 255, 169, ${inputBorderGlow.value})`,
  }));
  
  const handleSubmit = async () => {
    if (!quoteText.trim()) return;
    
    animateButton();
    const success = await onSubmit(quoteText);
    
    if (success) {
      setQuoteText('');
    }
  };
  
  if (!theme) {
    return (
      <GlassmorphicCard
        glowColor="#666666"
        intensity="low"
        style={styles.container}
      >
        <Text style={styles.noThemeText}>No active quote theme available</Text>
      </GlassmorphicCard>
    );
  }
  
  if (hasSubmitted) {
    return (
      <GlassmorphicCard
        glowColor="#00FFA9"
        intensity="medium"
        style={styles.container}
      >
        <View style={styles.submittedContainer}>
          <Quote size={32} color="#00FFA9" />
          <Text style={styles.submittedTitle}>Quote Submitted!</Text>
          <Text style={styles.submittedText}>
            Your quote has been entered into this week's competition. Check back to see how many votes you get!
          </Text>
          
          <View style={styles.timeRemainingContainer}>
            <Clock size={16} color="#AAAAAA" />
            <Text style={styles.timeRemainingText}>
              Competition ends in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
            </Text>
          </View>
        </View>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard
      glowColor="#00FFA9"
      intensity="medium"
      style={styles.container}
    >
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={['transparent', '#00FFA940']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <View style={styles.header}>
        <Quote size={24} color="#00FFA9" />
        <Text style={styles.title}>Weekly Quote Competition</Text>
      </View>
      
      <View style={styles.themeContainer}>
        <Text style={styles.themeTitle}>This Week's Theme: <Text style={styles.themeText}>{theme.theme}</Text></Text>
        <Text style={styles.themeDescription}>{theme.description}</Text>
      </View>
      
      <Animated.View style={[styles.inputContainer, inputStyle]}>
        <TextInput
          style={styles.input}
          value={quoteText}
          onChangeText={setQuoteText}
          placeholder="Share your inspirational quote..."
          placeholderTextColor="#666666"
          multiline
          maxLength={180}
          editable={!loading}
        />
      </Animated.View>
      
      <View style={styles.charCountContainer}>
        <Text style={[
          styles.charCount,
          charCount > 160 ? styles.charCountWarning : null,
          charCount === 180 ? styles.charCountLimit : null
        ]}>
          {charCount}/180 characters
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#FF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <View style={styles.timeRemainingContainer}>
          <Clock size={16} color="#AAAAAA" />
          <Text style={styles.timeRemainingText}>
            Ends in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
          </Text>
        </View>
        
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!quoteText.trim() || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!quoteText.trim() || loading}
          >
            <LinearGradient
              colors={['#00FFA9', '#00AAFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Send size={20} color="#000000" />
            <Text style={styles.submitButtonText}>Submit Quote</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  themeContainer: {
    marginBottom: 20,
  },
  themeTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  themeText: {
    color: '#00FFA9',
  },
  themeDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  inputContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 169, 0.3)',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 255, 169, 0.2)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  input: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  charCount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  charCountWarning: {
    color: '#FFD700',
  },
  charCountLimit: {
    color: '#FF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeRemainingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  noThemeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  submittedContainer: {
    alignItems: 'center',
    padding: 16,
  },
  submittedTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#00FFA9',
    marginTop: 16,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  submittedText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
});