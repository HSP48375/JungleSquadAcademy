import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Mail, 
  Quote, 
  Zap, 
  Trophy, 
  Calendar, 
  ArrowLeft,
  Eye
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import EmailPreviewModal from '@/components/EmailPreviewModal';

export default function NotificationSettingsScreen() {
  const { session } = useAuth();
  const { 
    preferences, 
    loading, 
    error, 
    updatePreferences 
  } = useNotifications(session?.user?.id ?? '');
  
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Animation values
  const titleGlow = useSharedValue(0.5);
  
  // Set up animations
  useEffect(() => {
    // Title glow animation
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );
  }, []);
  
  // Animated styles
  const titleGlowStyle = useAnimatedStyle(() => ({
    opacity: titleGlow.value,
  }));
  
  // Toggle preference
  const togglePreference = async (key: string, value: boolean) => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      
      const success = await updatePreferences({ [key]: value });
      
      if (!success) {
        throw new Error('Failed to update preference');
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };
  
  // Preview email template
  const previewEmailTemplate = (templateName: string) => {
    // Sample email templates
    const templates = {
      weekly_summary: {
        name: 'weekly_summary',
        subject: 'Your Weekly Jungle Squad Summary',
        html_content: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;">
                <h1 style="color: #00FFA9; text-align: center; margin-bottom: 20px;">Your Weekly Jungle Squad Summary</h1>
                <p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Here's how you did this week, {{name}}!</p>
                
                <div style="background-color: rgba(0, 255, 169, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">XP Progress</h2>
                  <p style="color: #FFFFFF;">You earned <span style="color: #00FFA9; font-weight: bold;">{{xp_earned}} XP</span> this week!</p>
                  <p style="color: #FFFFFF;">Current streak: <span style="color: #FFD700; font-weight: bold;">{{streak}} days</span></p>
                </div>
                
                <div style="background-color: rgba(255, 215, 0, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">Achievements</h2>
                  <p style="color: #FFFFFF;">{{achievements_summary}}</p>
                </div>
                
                <div style="background-color: rgba(0, 170, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">Learning Focus</h2>
                  <p style="color: #FFFFFF;">{{learning_summary}}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://academy.junglesquad.com" style="background-color: #00FFA9; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue Learning</a>
                </div>
                
                <p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled weekly summaries in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p>
              </div>
            </body>
          </html>
        `,
      },
      streak_reminder: {
        name: 'streak_reminder',
        subject: 'Don\'t Break Your Streak!',
        html_content: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;">
                <h1 style="color: #FF4444; text-align: center; margin-bottom: 20px;">Your Streak is About to End!</h1>
                <p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Hey {{name}}, don't lose your {{streak}}-day streak!</p>
                
                <div style="background-color: rgba(255, 68, 68, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">⚠️ Streak Alert</h2>
                  <p style="color: #FFFFFF; font-size: 18px;">Your streak will reset in <span style="color: #FF4444; font-weight: bold;">{{hours_left}} hours</span>!</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://academy.junglesquad.com" style="background-color: #FF4444; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Log In Now</a>
                </div>
                
                <p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled streak reminders in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p>
              </div>
            </body>
          </html>
        `,
      },
      quote_featured: {
        name: 'quote_featured',
        subject: 'Your Quote Has Been Featured!',
        html_content: `
          <html>
            <body style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; padding: 30px; border: 1px solid #333333;">
                <h1 style="color: #FFD700; text-align: center; margin-bottom: 20px;">Your Quote Has Been Featured!</h1>
                <p style="color: #AAAAAA; text-align: center; margin-bottom: 30px;">Congratulations {{name}}! Your wisdom is now featured in the Jungle Squad community.</p>
                
                <div style="background-color: rgba(255, 215, 0, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">Your Quote</h2>
                  <p style="color: #FFFFFF; font-size: 18px; font-style: italic;">"{{quote_text}}"</p>
                </div>
                
                <div style="background-color: rgba(0, 255, 169, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                  <h2 style="color: #FFFFFF; margin-top: 0;">Your Reward</h2>
                  <p style="color: #FFFFFF;">You've earned <span style="color: #FFD700; font-weight: bold;">50 Jungle Coins</span>!</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://academy.junglesquad.com/community/quotes" style="background-color: #FFD700; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Featured Quotes</a>
                </div>
                
                <p style="color: #666666; text-align: center; margin-top: 30px; font-size: 12px;">You received this email because you enabled quote updates in your notification preferences. <a href="https://academy.junglesquad.com/profile/notification-settings" style="color: #00FFA9;">Manage preferences</a>.</p>
              </div>
            </body>
          </html>
        `,
      },
    };
    
    setSelectedTemplate(templates[templateName as keyof typeof templates]);
    setShowEmailPreview(true);
  };
  
  // Sample variables for email preview
  const sampleVariables = {
    name: session?.user?.email?.split('@')[0] || 'Jungle Explorer',
    xp_earned: 250,
    streak: 5,
    achievements_summary: 'You unlocked 2 new achievements: "Streak Master" and "Quote Sage"',
    learning_summary: 'You spent 3 hours learning Mathematics with Tango the Tiger',
    hours_left: 6,
    quote_text: 'The best way to predict the future is to create it.',
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Animated.View style={[styles.titleGlow, titleGlowStyle]}>
              <LinearGradient
                colors={['transparent', '#00FFA9']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            
            <Text style={styles.title}>Notification Settings</Text>
            <Text style={styles.subtitle}>Customize your notification experience</Text>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {saveError && (
          <Text style={styles.errorText}>{saveError}</Text>
        )}

        {loading ? (
          <Text style={styles.loadingText}>Loading preferences...</Text>
        ) : preferences ? (
          <>
            <Animated.View entering={FadeIn.duration(400)}>
              <GlassmorphicCard
                glowColor="#00FFA9"
                intensity="medium"
                style={styles.section}
              >
                <View style={styles.sectionHeader}>
                  <Bell size={24} color="#00FFA9" />
                  <Text style={styles.sectionTitle}>Push Notifications</Text>
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Enable Push Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive alerts on your device
                    </Text>
                  </View>
                  
                  <Switch
                    value={preferences.push_enabled}
                    onValueChange={(value) => togglePreference('push_enabled', value)}
                    trackColor={{ false: '#333333', true: '#00FFA950' }}
                    thumbColor={preferences.push_enabled ? '#00FFA9' : '#666666'}
                    disabled={saving}
                  />
                </View>
              </GlassmorphicCard>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <GlassmorphicCard
                glowColor="#00AAFF"
                intensity="medium"
                style={styles.section}
              >
                <View style={styles.sectionHeader}>
                  <Mail size={24} color="#00AAFF" />
                  <Text style={styles.sectionTitle}>Email Notifications</Text>
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Enable Email Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive emails about important updates
                    </Text>
                  </View>
                  
                  <Switch
                    value={preferences.email_enabled}
                    onValueChange={(value) => togglePreference('email_enabled', value)}
                    trackColor={{ false: '#333333', true: '#00AAFF50' }}
                    thumbColor={preferences.email_enabled ? '#00AAFF' : '#666666'}
                    disabled={saving}
                  />
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Weekly Summary Email</Text>
                    <Text style={styles.settingDescription}>
                      Receive a weekly recap of your progress
                    </Text>
                  </View>
                  
                  <View style={styles.settingControls}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => previewEmailTemplate('weekly_summary')}
                    >
                      <Eye size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <Switch
                      value={preferences.weekly_summary}
                      onValueChange={(value) => togglePreference('weekly_summary', value)}
                      trackColor={{ false: '#333333', true: '#00AAFF50' }}
                      thumbColor={preferences.weekly_summary ? '#00AAFF' : '#666666'}
                      disabled={saving || !preferences.email_enabled}
                    />
                  </View>
                </View>
              </GlassmorphicCard>
            </Animated.View>
            
            <Animated.View entering={FadeIn.delay(200).duration(400)}>
              <GlassmorphicCard
                glowColor="#FFD700"
                intensity="medium"
                style={styles.section}
              >
                <View style={styles.sectionHeader}>
                  <Trophy size={24} color="#FFD700" />
                  <Text style={styles.sectionTitle}>Notification Types</Text>
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Quote Updates</Text>
                    <Text style={styles.settingDescription}>
                      Notifications about featured quotes and competitions
                    </Text>
                  </View>
                  
                  <View style={styles.settingControls}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => previewEmailTemplate('quote_featured')}
                    >
                      <Eye size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <Switch
                      value={preferences.quote_updates}
                      onValueChange={(value) => togglePreference('quote_updates', value)}
                      trackColor={{ false: '#333333', true: '#FFD70050' }}
                      thumbColor={preferences.quote_updates ? '#FFD700' : '#666666'}
                      disabled={saving}
                    />
                  </View>
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Streak Reminders</Text>
                    <Text style={styles.settingDescription}>
                      Get notified when your streak is about to break
                    </Text>
                  </View>
                  
                  <View style={styles.settingControls}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => previewEmailTemplate('streak_reminder')}
                    >
                      <Eye size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <Switch
                      value={preferences.streak_reminders}
                      onValueChange={(value) => togglePreference('streak_reminders', value)}
                      trackColor={{ false: '#333333', true: '#FF444450' }}
                      thumbColor={preferences.streak_reminders ? '#FF4444' : '#666666'}
                      disabled={saving}
                    />
                  </View>
                </View>
                
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Achievement Alerts</Text>
                    <Text style={styles.settingDescription}>
                      Notifications about badges and milestones
                    </Text>
                  </View>
                  
                  <Switch
                    value={preferences.achievement_alerts}
                    onValueChange={(value) => togglePreference('achievement_alerts', value)}
                    trackColor={{ false: '#333333', true: '#FF69B450' }}
                    thumbColor={preferences.achievement_alerts ? '#FF69B4' : '#666666'}
                    disabled={saving}
                  />
                </View>
              </GlassmorphicCard>
            </Animated.View>
            
            <View style={styles.infoContainer}>
              <Bell size={16} color="#AAAAAA" />
              <Text style={styles.infoText}>
                Enabling notifications helps you stay on track with your learning goals and never miss important updates.
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.errorText}>Failed to load notification preferences</Text>
        )}
      </ScrollView>
      
      {/* Email preview modal */}
      {selectedTemplate && (
        <EmailPreviewModal
          visible={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          template={selectedTemplate}
          variables={sampleVariables}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  titleContainer: {
    flex: 1,
    position: 'relative',
  },
  titleGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
  },
  unreadBadge: {
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  unreadText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    flex: 1,
  },
});