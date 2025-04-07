import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserGroup, Plus, Users, Trophy, Target, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import AvatarDisplay from '@/components/AvatarDisplay';

export default function StudyGroupsScreen() {
  const { session } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchGroups();
    }
  }, [session]);

  const fetchGroups = async () => {
    try {
      // Fetch all public groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('study_groups')
        .select(`
          *,
          members:group_members(count),
          track:learning_tracks(name, difficulty)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch user's groups
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group:study_groups(
            *,
            members:group_members(count),
            track:learning_tracks(name, difficulty)
          )
        `)
        .eq('user_id', session?.user?.id);

      if (memberError) throw memberError;

      setGroups(groupsData || []);
      setMyGroups(memberData?.map(m => m.group) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const GroupCard = ({ group, isMember = false }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => router.push(`/study-groups/${group.id}?name=${group.name}`)}
    >
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.cardGradient}
      />

      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupSubject}>{group.subject}</Text>
        </View>

        <View style={styles.memberCount}>
          <Users size={16} color="#666666" />
          <Text style={styles.memberText}>
            {group.members[0].count}/{group.member_limit}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{group.description}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MessageSquare size={16} color="#00FFA9" />
          <Text style={styles.statText}>Active Chat</Text>
        </View>

        <View style={styles.statItem}>
          <Target size={16} color="#00FFA9" />
          <Text style={styles.statText}>Weekly Challenge</Text>
        </View>

        <View style={styles.statItem}>
          <Trophy size={16} color="#FFD700" />
          <Text style={styles.statText}>Top 10 Group</Text>
        </View>
      </View>

      {group.track && (
        <View style={styles.trackBadge}>
          <Text style={styles.trackText}>
            {group.track.name} • {group.track.difficulty}
          </Text>
        </View>
      )}

      {isMember && (
        <View style={styles.memberBadge}>
          <Text style={styles.memberBadgeText}>Member</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Study Groups</Text>
          <Text style={styles.subtitle}>Learn together, grow together</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/study-groups/create')}
        >
          <Plus size={20} color="#000000" />
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {myGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          {myGroups.map(group => (
            <GroupCard key={group.id} group={group} isMember />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Groups</Text>
        {groups
          .filter(g => !myGroups.find(mg => mg.id === g.id))
          .map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 16,
    color: '#666666',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00FFA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  createButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
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
  groupCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  groupName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  groupSubject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#00FFA9',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  description: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  trackBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,255,169,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#00FFA9',
  },
  memberBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00FFA9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#000000',
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