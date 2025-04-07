import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Send, Mic, MicOff, Clock, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';

interface JournalEntryFormProps {
  onSubmitText: (text: string) => Promise<boolean>;
  onSubmitVoice?: (uri: string) => Promise<boolean>;
  initialText?: string;
  loading?: boolean;
  error?: string | null;
}

export default function JournalEntryForm({
  onSubmitText,
  onSubmitVoice,
  initialText = '',
  loading = false,
  error = null,
}: JournalEntryFormProps) {
  const [text, setText] = useState(initialText);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Animation values
  const micScale = useSharedValue(1);
  const micOpacity = useSharedValue(1);
  
  useEffect(() => {
    return () => {
      // Clean up recording on unmount
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recording, recordingTimer]);
  
  // Set up mic animation when recording
  useEffect(() => {
    if (isRecording) {
      micScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      micOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      micScale.value = withTiming(1);
      micOpacity.value = withTiming(1);
    }
  }, [isRecording]);
  
  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
    opacity: micOpacity.value,
  }));
  
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }
      
      // Set up recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      setRecordingTimer(timer);
      
    } catch (e) {
      console.error('Failed to start recording', e);
    }
  };
  
  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      // Stop recording
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      // Get recording URI
      const uri = recording.getURI();
      if (uri) {
        setRecordingUri(uri);
      }
      
      // Clear timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      setIsRecording(false);
      setRecording(null);
      
    } catch (e) {
      console.error('Failed to stop recording', e);
    }
  };
  
  const cancelRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      setIsRecording(false);
      setRecording(null);
      setRecordingUri(null);
      setRecordingDuration(0);
      
    } catch (e) {
      console.error('Failed to cancel recording', e);
    }
  };
  
  const handleSubmitText = async () => {
    if (!text.trim()) return;
    const success = await onSubmitText(text);
    if (success) {
      setText('');
    }
  };
  
  const handleSubmitVoice = async () => {
    if (!recordingUri || !onSubmitVoice) return;
    const success = await onSubmitVoice(recordingUri);
    if (success) {
      setRecordingUri(null);
      setRecordingDuration(0);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <GlassmorphicCard
      glowColor="#00FFA9"
      intensity="medium"
      style={styles.container}
    >
      <Text style={styles.title}>Weekly Learning Reflection</Text>
      <Text style={styles.subtitle}>
        What did you learn this week? What challenges did you overcome?
      </Text>
      
      {recordingUri ? (
        <View style={styles.recordingPreview}>
          <Text style={styles.recordingText}>
            Voice recording ({formatDuration(recordingDuration)})
          </Text>
          
          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelRecording}
              disabled={loading}
            >
              <Trash2 size={20} color="#FF4444" />
              <Text style={styles.cancelText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitVoice}
              disabled={loading}
            >
              <Send size={20} color="#000000" />
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isRecording ? (
        <View style={styles.recordingContainer}>
          <Text style={styles.recordingLabel}>Recording...</Text>
          
          <View style={styles.recordingTimer}>
            <Clock size={16} color="#FF4444" />
            <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
          </View>
          
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
            >
              <LinearGradient
                colors={['#FF4444', '#FF0000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MicOff size={24} color="#FFFFFF" />
              <Text style={styles.stopText}>Stop Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Share your thoughts, challenges, and victories..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
          
          <View style={styles.actions}>
            {Platform.OS !== 'web' && onSubmitVoice && (
              <Animated.View style={micStyle}>
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startRecording}
                  disabled={loading}
                >
                  <Mic size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            )}
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!text.trim() || loading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitText}
              disabled={!text.trim() || loading}
            >
              <Send size={24} color="#000000" />
              <Text style={styles.submitText}>Save Reflection</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <View style={styles.infoContainer}>
        <Clock size={16} color="#666666" />
        <Text style={styles.infoText}>
          Submit by Sunday for your weekly AI summary
        </Text>
      </View>
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    minHeight: 160,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 0 15px rgba(255, 68, 68, 0.5)',
      },
      default: {
        shadowColor: '#FF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
      },
    }),
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    height: 56,
    borderRadius: 28,
    gap: 8,
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  recordingContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  recordingLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FF4444',
    marginBottom: 12,
  },
  recordingTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  timerText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  recordingControls: {
    width: '100%',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 8,
    overflow: 'hidden',
  },
  stopText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  recordingPreview: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recordingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  cancelText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FF4444',
  },
});