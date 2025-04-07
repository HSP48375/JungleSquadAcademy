import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LogOut, Settings, User, ChevronRight, CreditCard, Trophy, Star, Bell, HelpCircle, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import AppMetadata from '@/components/AppMetadata';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import AvatarDisplay from '@/components/AvatarDisplay';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { subscription } = useSubscription(session?.user?.id ?? '');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          avatar:user_avatar(
            avatar_name,
            primary_color,
            secondary_color,
            species:avatar_species(name)
          )
        `)
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground theme="default" intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <GlassmorphicCard
          glowColor="#00FFA9"
          intensity="high"
          style={styles.profileCard}
        >
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <AvatarDisplay
                species={profile.avatar.species?.name || "Tiger"}
                name={profile.avatar.avatar_name}
                primaryColor={profile.avatar.primary_color}
                secondaryColor={profile.avatar.secondary_color}
                size="large"
                showName={false}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={32} color="#FFFFFF" />
              </View>
            )}
          </View>
          
          <Text style={styles.name}>{profile?.full_name || 'Jungle Explorer'}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
          
          {subscription && (
            <View style={styles.subscriptionBadge}>
              <Star size={16} color="#000000" />
              <Text style={styles.subscriptionText}>
                {subscription.subscription_tiers?.name}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/my-avatar')}
          >
            <Text style={styles.editProfileText}>View My Avatar</Text>
          </TouchableOpacity>
        </GlassmorphicCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity 
              style={styles.menuItemContent}
              onPress={() => router.push('/subscription')}
            >
              <CreditCard size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Subscription</Text>
                <Text style={styles.menuItemSubtext}>
                  {subscription 
                    ? `${subscription.subscription_tiers?.name} - ${subscription.status}`
                    : 'No active subscription'
                  }
                </Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity 
              style={styles.menuItemContent}
              onPress={() => router.push('/profile/settings')}
            >
              <Settings size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Settings</Text>
                <Text style={styles.menuItemSubtext}>App preferences</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity 
              style={styles.menuItemContent}
              onPress={() => router.push('/progress')}
            >
              <Trophy size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Learning Progress</Text>
                <Text style={styles.menuItemSubtext}>View your achievements</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity style={styles.menuItemContent}>
              <Bell size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Notifications</Text>
                <Text style={styles.menuItemSubtext}>Manage alerts</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity style={styles.menuItemContent}>
              <Shield size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Privacy</Text>
                <Text style={styles.menuItemSubtext}>Data and permissions</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <GlassmorphicCard
            glowColor="#00FFA9"
            intensity="low"
            style={styles.menuItem}
          >
            <TouchableOpacity style={styles.menuItemContent}>
              <HelpCircle size={24} color="#00FFA9" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Help Center</Text>
                <Text style={styles.menuItemSubtext}>FAQs and guides</Text>
              </View>
              <ChevronRight size={20} color="#666666" />
            </TouchableOpacity>
          </GlassmorphicCard>
        </View>

        <GlassmorphicCard
          glowColor="#FF4444"
          intensity="low"
          style={styles.signOutButton}
        >
          <TouchableOpacity 
            style={styles.signOutContent}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#FF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </GlassmorphicCard>

        <AppMetadata showFull={true} />

        <Text style={styles.versionText}>Jungle Squad Academy v1.0.0</Text>
      </ScrollView>
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
    paddingTop: Platform.OS === 'web' ? 40 : 80,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFA9',
    ...Platform.select({
      web: {
        boxShadow: '0 0 20px rgba(0, 255, 169, 0.3)',
      },
      default: {
        shadowColor: '#00FFA9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  email: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  subscriptionText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#000000',
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: '#00FFA9',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editProfileText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  menuItemSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 2,
  },
  signOutButton: {
    marginBottom: 24,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  signOutText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#FF4444',
  },
  versionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
});