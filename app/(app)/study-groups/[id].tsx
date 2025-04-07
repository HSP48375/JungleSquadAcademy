import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Trophy, Target, Send, Star } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AvatarDisplay from '@/components/AvatarDisplay';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchGroupDetails();
      subscribeToMessages();
    }
  }, [session, id]);

  const fetchGroupDetails = async () => {
    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .select(`
          *,
          track:learning_tracks(name, difficulty)
        `)
        .eq('id', id)
        .single();

      if (groupError) throw groupError;

      // Fetch members
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:profiles(
            avatar:user_avatar(
              avatar_name,
              species:avatar_species(name),
              primary_color
            )
          )
        `)
        .eq('group_id', id);

      if (memberError) throw memberError;

      // Fetch messages
      const { data: messageData, error: messageError } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:profiles(
            avatar:user_avatar(
              avatar_name,
              species:avatar_species(name),
              primary_color
            )
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (messageError) throw messageError;

      // Fetch active challenges
      const { data: challengeData, error: challengeError } = await supabase
        .from('group_challenges')
        .select(`
          *,
          progress:group_challenge_progress(*)
        `)
        .eq('group_id', id)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (challengeError) throw challengeError;

      setGroup(groupData);
      setMembers(memberData || []);
      setMessages(messageData || []);
      setChallenges(challengeData || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch group details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('group_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${id}`,
        },
        (payload) => {
          setMessages((current) => [payload.new, ...current]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const { error: sendError } = await supabase
        .from('group_messages')
        .insert({
          group_id: id,
          user_id: session?.user?.id,
          content: message.trim(),
        });

      if (sendError) throw sendError;
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message');
    }
  };

  const joinGroup = async () => {
    try {
      const { error: joinError } = await supabase.rpc('join_study_group', {
        p_group_id: id,
        p_user_id: session?.user?.id,
      });

      if (joinError) throw joinError;
      await fetchGroupDetails();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join group');
    }
  };

  const isMember = members.some(m => m.user_id === session?.user?.id);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{group?.name}</Text>
        <Text style={styles.subtitle}>{group?.subject}</Text>

        <View style={styles.memberCount}>
          <Users size={16} color="#666666" />
          <Text style={styles.memberText}>
            {members.length}/{group?.member_limit} Members
          </Text>
        </View>

        {!isMember && (
          <TouchableOpacity style={styles.joinButton} onPress={joinGroup}>
            <Text style={styles.joinButtonText}>Join Group</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {challenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Challenge</Text>
          {challenges.map(challenge => (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Trophy size={24} color="#FFD700" />
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(challenge.progress.length / members.length) * 100}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.rewards}>
                <View style={styles.rewardItem}>
                  <Star size={16} color="#00FFA9" />
                  <Text style={styles.rewardText}>+{challenge.xp_reward} XP</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Trophy size={16} color="#FFD700" />
                  <Text style={styles.rewardText}>+{challenge.coin_reward} Coins</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <AvatarDisplay
                species={member.profile.avatar.species.name}
                name={member.profile.avatar.avatar_name}
                primaryColor={member.profile.avatar.primary_color}
                size="small"
              />
              <Text style={styles.memberName}>
                {member.profile.avatar.avatar_name}
              </Text>
              {member.role === 'leader' && (
                <View style={styles.leaderBadge}>
                  <Star size={12} color="#FFD700" />
                  <Text style={styles.leaderText}>Leader</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group Chat</Text>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.user_id === session?.user?.id && styles.ownMessage,
            ]}
          >
            <AvatarDisplay
              species={msg.sender.avatar.species.name}
              name={msg.sender.avatar.avatar_name}
              primaryColor={msg.sender.avatar.primary_color}
              size="small"
              showName={false}
            />
            <View style={styles.messageContent}>
              <Text style={styles.messageSender}>
                {msg.sender.avatar.avatar_name}
              </Text>
              <Text style={styles.messageText}>{msg.content}</Text>
            </View>
          </View>
        ))}
      </View>

      {isMember && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#666666"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Send size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    height: 300,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#00FFA9',
    marginBottom: 16,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  joinButton: {
    backgroundColor: '#00FFA9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  joinButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFA9',
    borderRadius: 2,
  },
  rewards: {
    flexDirection: 'row',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
  },
  memberCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 100,
  },
  memberName: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  leaderText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFD700',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  ownMessage: {
    flexDirection: 'row-reverse',
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  messageSender: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
    marginBottom: 4,
  },
  messageText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  input: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00FFA9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
});