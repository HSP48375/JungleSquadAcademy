import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Switch
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bookmark, 
  Music, 
  MusicOff, 
  HelpCircle, 
  Image as ImageIcon,
  Info,
  Smile,
  ThumbsUp,
  Heart,
  Star
} from 'lucide-react-native';
import Animated, { 
  FadeInUp, 
  FadeOutDown, 
  Layout, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { getAdaptedPrompt, getTutorExamples } from '@/lib/tutorPrompts';

// Map of tutors to their themes
const TUTOR_THEMES = {
  'tango': { 
    theme: 'math', 
    primaryColor: '#FF7B54', 
    secondaryColor: '#FFB26B',
    gradientColors: ['#FF7B54', '#FFB26B'],
    personality: 'energetic',
    subject: 'Mathematics'
  },
  'zara': { 
    theme: 'history', 
    primaryColor: '#845EC2', 
    secondaryColor: '#D65DB1',
    gradientColors: ['#845EC2', '#D65DB1'],
    personality: 'methodical',
    subject: 'History & Geography'
  },
  'milo': { 
    theme: 'language', 
    primaryColor: '#00C6A7', 
    secondaryColor: '#1E4D92',
    gradientColors: ['#00C6A7', '#1E4D92'],
    personality: 'playful',
    subject: 'Language Arts'
  },
  'luna': { 
    theme: 'science', 
    primaryColor: '#FF9A8B', 
    secondaryColor: '#FF6A88',
    gradientColors: ['#FF9A8B', '#FF6A88'],
    personality: 'analytical',
    subject: 'Science'
  },
  'bindi': { 
    theme: 'art', 
    primaryColor: '#FF61D2', 
    secondaryColor: '#FE9090',
    gradientColors: ['#FF61D2', '#FE9090'],
    personality: 'creative',
    subject: 'Art & Creativity'
  },
  'chip': { 
    theme: 'tech', 
    primaryColor: '#4158D0', 
    secondaryColor: '#C850C0',
    gradientColors: ['#4158D0', '#C850C0'],
    personality: 'efficient',
    subject: 'Technology'
  },
  'rhea': { 
    theme: 'art', 
    primaryColor: '#8EC5FC', 
    secondaryColor: '#E0C3FC',
    gradientColors: ['#8EC5FC', '#E0C3FC'],
    personality: 'soulful',
    subject: 'Music'
  },
  'gabi': { 
    theme: 'default', 
    primaryColor: '#FAD961', 
    secondaryColor: '#F76B1C',
    gradientColors: ['#FAD961', '#F76B1C'],
    personality: 'practical',
    subject: 'Life Skills'
  },
  'ellie': { 
    theme: 'default', 
    primaryColor: '#B721FF', 
    secondaryColor: '#21D4FD',
    gradientColors: ['#B721FF', '#21D4FD'],
    personality: 'empathetic',
    subject: 'Social & Emotional Learning'
  },
  'rocky': { 
    theme: 'default', 
    primaryColor: '#48C6EF', 
    secondaryColor: '#6F86D6',
    gradientColors: ['#48C6EF', '#6F86D6'],
    personality: 'clever',
    subject: 'Problem-Solving'
  },
};

// Daily questions by tutor
const DAILY_QUESTIONS = {
  'tango': "What's a math concept you'd like to understand better today?",
  'zara': "What historical event or place are you curious about today?",
  'milo': "What's something you've read or written recently that you enjoyed?",
  'luna': "What scientific phenomenon makes you wonder 'how does that work?'",
  'bindi': "What's something creative you'd like to try or improve at?",
  'chip': "What technology skill would be most useful for you to learn?",
  'rhea': "What's your favorite song or piece of music, and why does it move you?",
  'gabi': "What's one life skill you wish you were better at?",
  'ellie': "What's something you're grateful for today?",
  'rocky': "What's a problem you're trying to solve right now?",
};

// Tutor avatar images
const TUTOR_AVATARS = {
  'tango': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=400&auto=format&fit=crop',
  'zara': 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=400&auto=format&fit=crop',
  'milo': 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=400&auto=format&fit=crop',
  'luna': 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=400&auto=format&fit=crop',
  'bindi': 'https://images.unsplash.com/photo-1595873520615-67e8c98db5d1?q=80&w=400&auto=format&fit=crop',
  'chip': 'https://images.unsplash.com/photo-1557728325-b66b92d905e5?q=80&w=400&auto=format&fit=crop',
  'rhea': 'https://images.unsplash.com/photo-1584844115436-473eb4a4de8b?q=80&w=400&auto=format&fit=crop',
  'gabi': 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?q=80&w=400&auto=format&fit=crop',
  'ellie': 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=400&auto=format&fit=crop',
  'rocky': 'https://images.unsplash.com/photo-1606574977100-16c8c0365d33?q=80&w=400&auto=format&fit=crop',
};

// Tutor background images
const TUTOR_BACKGROUNDS = {
  'math': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop',
  'history': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1000&auto=format&fit=crop',
  'language': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop',
  'science': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1000&auto=format&fit=crop',
  'art': 'https://images.unsplash.com/photo-1460661419201-fd4cecaea4752?q=80&w=1000&auto=format&fit=crop',
  'tech': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1518050346340-aa2ec3bb424b?q=80&w=1000&auto=format&fit=crop',
};

// Tutor moods and reactions
const TUTOR_MOODS = {
  'thinking': {
    animation: 'pulse',
    icon: '🤔',
  },
  'happy': {
    animation: 'bounce',
    icon: '😊',
  },
  'excited': {
    animation: 'tada',
    icon: '🎉',
  },
  'encouraging': {
    animation: 'heartbeat',
    icon: '👍',
  },
  'neutral': {
    animation: 'none',
    icon: '😐',
  },
};

export default function ChatScreen() {
  const { tutor } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [tutorMood, setTutorMood] = useState('neutral');
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showTutorInfo, setShowTutorInfo] = useState(false);
  const [xpPoints, setXpPoints] = useState(0);
  const [xpLevel, setXpLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [showEmojiReactions, setShowEmojiReactions] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  
  const { session } = useAuth();
  const { messages, loading, error, initializeChat, sendMessage } = useChat(tutor as string);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const pulseAnimation = useSharedValue(1);
  const typingOpacity = useSharedValue(0);
  const xpBarWidth = useSharedValue(0);
  
  // Get tutor theme
  const tutorTheme = TUTOR_THEMES[tutor as keyof typeof TUTOR_THEMES] || { 
    theme: 'default', 
    primaryColor: '#00FFA9',
    secondaryColor: '#00AAFF',
    gradientColors: ['#00FFA9', '#00AAFF'],
    personality: 'friendly',
    subject: 'General Knowledge'
  };
  
  const tutorAvatar = TUTOR_AVATARS[tutor as keyof typeof TUTOR_AVATARS] || TUTOR_AVATARS.tango;
  const backgroundImage = TUTOR_BACKGROUNDS[tutorTheme.theme] || TUTOR_BACKGROUNDS.default;
  
  // Set up animations
  useEffect(() => {
    // Avatar pulse animation
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
    
    // Initialize XP progress
    xpBarWidth.value = withTiming(xpProgress, { duration: 1000 });
  }, []);
  
  // Update typing animation when loading changes
  useEffect(() => {
    if (loading) {
      typingOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
      
      // Set tutor mood to thinking when loading
      setTutorMood('thinking');
    } else {
      typingOpacity.value = withTiming(0);
      
      // Set tutor mood based on last message
      if (messages.length > 0 && messages[messages.length - 1].is_tutor) {
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        if (lastMessage.includes('great') || lastMessage.includes('excellent') || lastMessage.includes('well done')) {
          setTutorMood('happy');
        } else if (lastMessage.includes('exciting') || lastMessage.includes('amazing') || lastMessage.includes('fantastic')) {
          setTutorMood('excited');
        } else if (lastMessage.includes('try') || lastMessage.includes('practice') || lastMessage.includes('you can do it')) {
          setTutorMood('encouraging');
        } else {
          setTutorMood('neutral');
        }
      }
    }
  }, [loading]);
  
  // Update XP progress bar
  useEffect(() => {
    xpBarWidth.value = withTiming(xpProgress, { duration: 1000 });
  }, [xpProgress]);
  
  // Animated styles
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));
  
  const typingIndicatorStyle = useAnimatedStyle(() => ({
    opacity: typingOpacity.value,
  }));
  
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${xpBarWidth.value * 100}%`,
  }));
  
  // Initialize chat
  useEffect(() => {
    if (session?.user) {
      initializeChat(session.user.id);
      
      // Load XP data from storage or API
      // This is a placeholder - in a real app, you'd fetch this from your backend
      const mockXP = Math.floor(Math.random() * 500);
      setXpPoints(mockXP);
      setXpLevel(Math.floor(mockXP / 100) + 1);
      setXpProgress((mockXP % 100) / 100);
    }
  }, [session]);
  
  // Play background music
  useEffect(() => {
    return () => {
      // Clean up sound when component unmounts
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  const toggleMusic = async () => {
    try {
      if (sound) {
        if (isMusicPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsMusicPlaying(!isMusicPlaying);
      } else {
        // Load and play ambient music
        // In a real app, you'd have different music for different tutors/themes
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: 'https://example.com/ambient-music.mp3' }, // Replace with actual music URL
          { isLooping: true, volume: 0.3 }
        );
        setSound(newSound);
        await newSound.playAsync();
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling music:', error);
    }
  };
  
  // Start recording
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
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };
  
  // Stop recording and transcribe
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
        // In a real app, you'd send this to a speech-to-text service
        // For now, we'll simulate transcription
        setMessage("I recorded a voice message about " + tutorTheme.subject);
      }
      
      setIsRecording(false);
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };
  
  // Toggle bookmark for a message
  const toggleBookmark = (messageId: string) => {
    setBookmarkedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        
        // Award XP for bookmarking
        awardXP(5);
      }
      return newSet;
    });
  };
  
  // Award XP to the user
  const awardXP = (amount: number) => {
    setXpPoints(prev => {
      const newXP = prev + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      
      if (newLevel > xpLevel) {
        // Level up!
        setXpLevel(newLevel);
        // In a real app, you'd show a level up animation/notification
      }
      
      setXpProgress((newXP % 100) / 100);
      return newXP;
    });
  };
  
  // Send a message
  const handleSend = async () => {
    if (!message.trim() && !imageUri) return;
    
    // If there's an image, include it in the message
    let messageText = message.trim();
    if (imageUri) {
      messageText += "\n[Image attached]";
    }
    
    const currentMessage = messageText;
    setMessage('');
    setImageUri(null);
    
    await sendMessage(currentMessage);
    
    // Award XP for sending a message
    awardXP(10);
  };
  
  // Send the daily question
  const sendDailyQuestion = () => {
    const question = DAILY_QUESTIONS[tutor as keyof typeof DAILY_QUESTIONS] || 
      "What would you like to learn about today?";
    
    setMessage(question);
  };
  
  // Pick an image from the gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // Take a photo with the camera
  const takePhoto = async () => {
    setShowCamera(true);
  };
  
  // Handle photo capture
  const handleCameraCapture = async (photo: any) => {
    setImageUri(photo.uri);
    setShowCamera(false);
  };
  
  // Toggle emoji reactions for a message
  const toggleEmojiReactions = (messageId: string) => {
    setShowEmojiReactions(prev => !prev);
    setActiveMessageId(messageId);
  };
  
  // Add emoji reaction to a message
  const addEmojiReaction = (emoji: string) => {
    // In a real app, you'd store this reaction in your database
    console.log(`Added ${emoji} reaction to message ${activeMessageId}`);
    setShowEmojiReactions(false);
    
    // Award XP for reacting
    awardXP(2);
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Background Image with Overlay */}
      <Image 
        source={{ uri: backgroundImage }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
      
      {/* Ambient Neon Vines */}
      <View style={styles.neonVines}>
        <View style={[styles.neonVine, { backgroundColor: tutorTheme.primaryColor }]} />
        <View style={[styles.neonVine, styles.neonVine2, { backgroundColor: tutorTheme.secondaryColor }]} />
        <View style={[styles.neonDot, { backgroundColor: tutorTheme.primaryColor }]} />
        <View style={[styles.neonDot, styles.neonDot2, { backgroundColor: tutorTheme.secondaryColor }]} />
      </View>
      
      {/* Header with XP Bar and Controls */}
      <View style={styles.header}>
        {/* Tutor Avatar */}
        <Pressable 
          style={styles.avatarContainer}
          onPress={() => setShowTutorInfo(true)}
        >
          <Animated.View style={[styles.avatarInner, avatarStyle]}>
            <Image 
              source={{ uri: tutorAvatar }}
              style={styles.avatarImage}
            />
            <View style={[styles.avatarRing, { borderColor: tutorTheme.primaryColor }]}>
              <Animated.View 
                style={[
                  styles.typingIndicator, 
                  { backgroundColor: tutorTheme.primaryColor },
                  typingIndicatorStyle
                ]}
              />
            </View>
            <View style={styles.moodIndicator}>
              <Text style={styles.moodEmoji}>{TUTOR_MOODS[tutorMood as keyof typeof TUTOR_MOODS].icon}</Text>
            </View>
          </Animated.View>
        </Pressable>
        
        {/* XP Progress */}
        <View style={styles.xpContainer}>
          <View style={styles.xpInfo}>
            <Text style={styles.xpLevel}>Level {xpLevel}</Text>
            <Text style={styles.xpPoints}>{xpPoints} XP</Text>
          </View>
          <View style={styles.xpBarContainer}>
            <Animated.View 
              style={[
                styles.xpBarFill, 
                { backgroundColor: tutorTheme.primaryColor },
                progressBarStyle
              ]}
            />
          </View>
        </View>
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleMusic}
          >
            {isMusicPlaying ? (
              <MusicOff size={20} color="#FFFFFF" />
            ) : (
              <Music size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={sendDailyQuestion}
          >
            <HelpCircle size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {messages.map((msg, index) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.delay(index * 100).duration(300)}
              exiting={FadeOutDown.duration(200)}
              layout={Layout}
              style={[
                styles.messageWrapper,
                msg.is_tutor ? styles.tutorMessage : styles.userMessage,
              ]}
            >
              <LinearGradient
                colors={msg.is_tutor 
                  ? ['rgba(26, 26, 26, 0.9)', 'rgba(38, 38, 38, 0.8)'] 
                  : tutorTheme.gradientColors.map(color => `${color}CC`)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.messageCard,
                  msg.is_tutor ? styles.tutorMessageCard : styles.userMessageCard,
                  bookmarkedMessages.has(msg.id) && styles.bookmarkedMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  { color: msg.is_tutor ? '#FFFFFF' : '#000000' }
                ]}>
                  {msg.content}
                </Text>
                
                {/* Message actions */}
                {msg.is_tutor && (
                  <View style={styles.messageActions}>
                    <TouchableOpacity 
                      style={styles.messageAction}
                      onPress={() => toggleBookmark(msg.id)}
                    >
                      <Bookmark 
                        size={16} 
                        color={bookmarkedMessages.has(msg.id) ? tutorTheme.primaryColor : '#AAAAAA'} 
                        fill={bookmarkedMessages.has(msg.id) ? tutorTheme.primaryColor : 'transparent'}
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.messageAction}
                      onPress={() => toggleEmojiReactions(msg.id)}
                    >
                      <Smile size={16} color="#AAAAAA" />
                    </TouchableOpacity>
                    
                    {/* Emoji reaction panel */}
                    {showEmojiReactions && activeMessageId === msg.id && (
                      <Animated.View 
                        style={styles.emojiPanel}
                        entering={FadeInUp.duration(200)}
                      >
                        <TouchableOpacity 
                          style={styles.emojiButton}
                          onPress={() => addEmojiReaction('👍')}
                        >
                          <Text style={styles.emoji}>👍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.emojiButton}
                          onPress={() => addEmojiReaction('❤️')}
                        >
                          <Text style={styles.emoji}>❤️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.emojiButton}
                          onPress={() => addEmojiReaction('🎉')}
                        >
                          <Text style={styles.emoji}>🎉</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.emojiButton}
                          onPress={() => addEmojiReaction('🤔')}
                        >
                          <Text style={styles.emoji}>🤔</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.emojiButton}
                          onPress={() => addEmojiReaction('⭐')}
                        >
                          <Text style={styles.emoji}>⭐</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </View>
                )}
                
                {/* Cyberpunk circuit decoration */}
                <View style={styles.circuitDecoration}>
                  <View 
                    style={[
                      styles.circuit, 
                      { backgroundColor: msg.is_tutor ? '#FFFFFF40' : '#00000040' }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.circuitDot, 
                      { backgroundColor: msg.is_tutor ? '#FFFFFF' : '#000000' }
                    ]}
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
          
          {/* Typing indicator */}
          {loading && (
            <Animated.View 
              style={[styles.typingContainer, typingIndicatorStyle]}
              entering={FadeInUp.duration(300)}
            >
              <View style={styles.typingBubble}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotMiddle]} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>
                {tutor} is thinking...
              </Text>
            </Animated.View>
          )}
        </ScrollView>
        
        {/* Image preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: imageUri }}
              style={styles.imagePreview}
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputActions}>
            <TouchableOpacity 
              style={styles.inputAction}
              onPress={pickImage}
            >
              <ImageIcon size={20} color="#AAAAAA" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.inputAction}
              onPress={takePhoto}
            >
              <Camera size={20} color="#AAAAAA" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={`Ask ${tutor} about ${tutorTheme.subject}...`}
            placeholderTextColor="#888888"
            multiline
            editable={!loading && !isRecording}
          />
          
          {message.trim() || imageUri ? (
            <Pressable 
              onPress={handleSend} 
              style={[
                styles.sendButton,
                loading && styles.sendButtonDisabled
              ]}
              disabled={loading}
            >
              <LinearGradient
                colors={tutorTheme.gradientColors}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Send size={24} color="#000000" />
              )}
            </Pressable>
          ) : (
            <Pressable 
              onPress={isRecording ? stopRecording : startRecording}
              style={[
                styles.sendButton,
                isRecording && styles.recordingButton
              ]}
            >
              <LinearGradient
                colors={isRecording ? ['#FF4444', '#FF0000'] : ['#666666', '#333333']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {isRecording ? (
                <MicOff size={24} color="#FFFFFF" />
              ) : (
                <Mic size={24} color="#FFFFFF" />
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
      
      {/* Camera View */}
      {showCamera && (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            onCameraReady={() => console.log('Camera ready')}
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cameraButton, styles.captureButton]}
                onPress={() => {
                  // In a real app, you'd capture the photo here
                  const mockPhoto = { uri: 'https://images.unsplash.com/photo-1518050346340-aa2ec3bb424b?q=80&w=500&auto=format&fit=crop' };
                  handleCameraCapture(mockPhoto);
                }}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={styles.cameraButtonPlaceholder} />
            </View>
          </Camera>
        </View>
      )}
      
      {/* Tutor Info Modal */}
      {showTutorInfo && (
        <Animated.View 
          style={styles.tutorInfoModal}
          entering={FadeInUp.duration(300)}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowTutorInfo(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <View style={styles.tutorInfoContent}>
            <Image 
              source={{ uri: tutorAvatar }}
              style={styles.tutorInfoAvatar}
            />
            
            <Text style={styles.tutorInfoName}>
              {tutor} the {tutorTheme.personality.charAt(0).toUpperCase() + tutorTheme.personality.slice(1)}
            </Text>
            
            <Text style={styles.tutorInfoSubject}>{tutorTheme.subject} Expert</Text>
            
            <View style={styles.tutorInfoDescription}>
              <Text style={styles.tutorInfoText}>
                {getTutorDescription(tutor as string)}
              </Text>
            </View>
            
            <View style={styles.tutorInfoStats}>
              <View style={styles.tutorInfoStat}>
                <Text style={styles.tutorInfoStatValue}>98%</Text>
                <Text style={styles.tutorInfoStatLabel}>Accuracy</Text>
              </View>
              
              <View style={styles.tutorInfoStat}>
                <Text style={styles.tutorInfoStatValue}>1.2M+</Text>
                <Text style={styles.tutorInfoStatLabel}>Students</Text>
              </View>
              
              <View style={styles.tutorInfoStat}>
                <Text style={styles.tutorInfoStatValue}>4.9/5</Text>
                <Text style={styles.tutorInfoStatLabel}>Rating</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.tutorInfoButton, { backgroundColor: tutorTheme.primaryColor }]}
              onPress={() => setShowTutorInfo(false)}
            >
              <Text style={styles.tutorInfoButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Helper function to get tutor description
function getTutorDescription(tutorId: string): string {
  const examples = getTutorExamples(tutorId as keyof typeof TUTOR_THEMES);
  
  switch(tutorId) {
    case 'tango':
      return "Tango is an energetic and strategic mathematics tutor who breaks down complex problems with clarity and visual explanations. With expertise in algebra, geometry, calculus, and statistics, Tango makes math accessible and engaging for learners of all levels.";
    case 'zara':
      return "Zara is a methodical and insightful history and geography tutor who loves connecting historical events to form complete pictures. She organizes information chronologically and uses storytelling to make history memorable, encouraging critical thinking about historical sources and bias.";
    case 'milo':
      return "Milo is a creative and witty language arts tutor who makes language learning fun and interactive. He breaks down complex writing and grammar concepts into manageable parts, encouraging creativity and personal expression through examples from literature, pop culture, and everyday life.";
    case 'luna':
      return "Luna is an analytical and passionate science tutor who breaks down complex scientific concepts into understandable components. She connects scientific principles to observable phenomena and encourages questioning and hypothesis formation, guiding students through scientific reasoning.";
    case 'bindi':
      return "Bindi is an inspiring and colorful art and creativity tutor who nurtures creativity through positive reinforcement. She introduces various artistic techniques and mediums, encouraging experimentation and helping students find their unique artistic voice.";
    case 'chip':
      return "Chip is a fast-thinking and sharp technology tutor who provides clear, concise explanations of technical concepts. He uses practical, hands-on examples and code snippets, breaking complex problems into smaller, manageable steps and encouraging experimentation.";
    case 'rhea':
      return "Rhea is a passionate and soulful music tutor who balances technical precision with emotional expression. She builds strong fundamentals before advancing to complex concepts, connecting technical skills to emotional expression through listening examples.";
    case 'gabi':
      return "Gabi is a wise and practical life skills tutor who breaks down complex adult responsibilities into manageable steps. She uses real-life scenarios and examples that students can relate to, providing actionable templates and frameworks for decision-making.";
    case 'ellie':
      return "Ellie is a gentle and empathetic emotional learning tutor who creates a safe space for exploring emotions and social dynamics. She uses stories and scenarios to illustrate emotional concepts, encouraging reflection and self-awareness.";
    case 'rocky':
      return "Rocky is a playful and clever problem-solving tutor who transforms intimidating problems into engaging puzzles. He teaches multiple approaches to the same problem, encouraging creative thinking and unconventional solutions.";
    default:
      return "A knowledgeable and friendly tutor from the Jungle Squad Academy, ready to help you learn and grow.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
  },
  neonVines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  neonVine: {
    position: 'absolute',
    width: 2,
    height: 200,
    top: '10%',
    left: '15%',
    borderRadius: 1,
    opacity: 0.6,
  },
  neonVine2: {
    top: '30%',
    right: '10%',
    left: 'auto',
    height: 150,
  },
  neonDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: '10%',
    left: '15%',
    opacity: 0.8,
  },
  neonDot2: {
    top: '30%',
    right: '10%',
    left: 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#00FFA9',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FFA9',
  },
  moodIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moodEmoji: {
    fontSize: 14,
  },
  xpContainer: {
    flex: 1,
    marginRight: 16,
  },
  xpInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpLevel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  xpPoints: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  xpBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#00FFA9',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageWrapper: {
    maxWidth: '80%',
    marginVertical: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  tutorMessage: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    padding: 16,
    borderRadius: 16,
    minWidth: 60,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  tutorMessageCard: {
    borderTopLeftRadius: 4,
  },
  userMessageCard: {
    borderTopRightRadius: 4,
  },
  bookmarkedMessage: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  messageText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  messageAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPanel: {
    position: 'absolute',
    bottom: 36,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 20,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  circuitDecoration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 10,
    opacity: 0.4,
  },
  circuit: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 15,
    height: 1,
  },
  circuitDot: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingDotMiddle: {
    opacity: 0.8,
  },
  typingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  imagePreviewContainer: {
    margin: 16,
    marginTop: 0,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  inputAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    maxHeight: 120,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 255, 157, 0.3)',
      },
      default: {
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  recordingButton: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 20,
  },
  cameraButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  cameraButtonPlaceholder: {
    width: 50,
  },
  tutorInfoModal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tutorInfoContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tutorInfoAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#00FFA9',
  },
  tutorInfoName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tutorInfoSubject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#00FFA9',
    marginBottom: 20,
    textAlign: 'center',
  },
  tutorInfoDescription: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  tutorInfoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#DDDDDD',
    lineHeight: 24,
    textAlign: 'center',
  },
  tutorInfoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  tutorInfoStat: {
    alignItems: 'center',
  },
  tutorInfoStatValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  tutorInfoStatLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  tutorInfoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#00FFA9',
  },
  tutorInfoButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
});