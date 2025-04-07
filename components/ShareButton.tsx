import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Twitter, Instagram, Facebook, MessageSquare, X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface ShareButtonProps {
  onShare: (platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other') => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function ShareButton({
  onShare,
  disabled = false,
  size = 'medium',
  color = '#00FFA9',
}: ShareButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonGlow = useSharedValue(0.5);
  
  // Set up animations
  React.useEffect(() => {
    if (!disabled) {
      // Button pulse animation
      buttonScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      // Glow animation
      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    } else {
      buttonScale.value = withTiming(1);
      buttonGlow.value = withTiming(0.3);
    }
  }, [disabled]);
  
  // Animated styles
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: buttonGlow.value,
  }));
  
  // Get size-specific styles
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, iconSize: 16 };
      case 'large':
        return { width: 64, height: 64, iconSize: 28 };
      default: // medium
        return { width: 52, height: 52, iconSize: 22 };
    }
  };
  
  const buttonSize = getButtonSize();
  
  // Handle share button press
  const handleSharePress = () => {
    if (disabled) return;
    setModalVisible(true);
  };
  
  // Handle platform selection
  const handlePlatformSelect = (platform: 'twitter' | 'instagram' | 'facebook' | 'message' | 'other') => {
    setModalVisible(false);
    onShare(platform);
  };

  return (
    <>
      <Animated.View style={[
        styles.buttonContainer,
        { width: buttonSize.width, height: buttonSize.height },
        buttonStyle
      ]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: disabled ? '#333333' : color },
          ]}
          onPress={handleSharePress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={['transparent', color]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          
          <Share2 size={buttonSize.iconSize} color="#000000" />
        </TouchableOpacity>
      </Animated.View>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={styles.modalContent}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Quote</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Choose a platform to share on:</Text>
            
            <View style={styles.platformsContainer}>
              <TouchableOpacity
                style={styles.platformButton}
                onPress={() => handlePlatformSelect('twitter')}
              >
                <LinearGradient
                  colors={['#1DA1F2', '#0C85D0']}
                  style={styles.platformGradient}
                >
                  <Twitter size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.platformText}>Twitter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.platformButton}
                onPress={() => handlePlatformSelect('instagram')}
              >
                <LinearGradient
                  colors={['#833AB4', '#FD1D1D', '#FCAF45']}
                  style={styles.platformGradient}
                >
                  <Instagram size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.platformText}>Instagram</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.platformButton}
                onPress={() => handlePlatformSelect('facebook')}
              >
                <LinearGradient
                  colors={['#4267B2', '#3B5998']}
                  style={styles.platformGradient}
                >
                  <Facebook size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.platformText}>Facebook</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.platformButton}
                onPress={() => handlePlatformSelect('message')}
              >
                <LinearGradient
                  colors={['#00C853', '#009624']}
                  style={styles.platformGradient}
                >
                  <MessageSquare size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.platformText}>Message</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.otherButton}
              onPress={() => handlePlatformSelect('other')}
            >
              <Text style={styles.otherButtonText}>Other Options</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(0, 255, 169, 0.5)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  platformButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  otherButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  otherButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});