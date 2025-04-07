import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserGroup, Users, Book, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function CreateGroupScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [memberLimit, setMemberLimit] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !description.trim() || !subject.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: name.trim(),
          description: description.trim(),
          subject: subject.trim(),
          member_limit: parseInt(memberLimit, 10),
          current_members: 1,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as leader
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: session?.user?.id,
          role: 'leader',
        });

      if (memberError) throw memberError;

      router.push(`/study-groups/${group.id}?name=${group.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <UserGroup size={32} color="#00FFA9" />
        <Text style={styles.title}>Create Study Group</Text>
        <Text style={styles.subtitle}>Start your collaborative learning journey</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Advanced Math Squad"
            placeholderTextColor="#666666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's your group's focus and goals?"
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics"
            placeholderTextColor="#666666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Member Limit (3-10)</Text>
          <TextInput
            style={styles.input}
            value={memberLimit}
            onChangeText={setMemberLimit}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor="#666666"
          />
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Users size={20} color="#00FFA9" />
            <Text style={styles.featureTitle}>Collaborative Learning</Text>
            <Text style={styles.featureDesc}>Learn and grow together with peers</Text>
          </View>

          <View style={styles.featureItem}>
            <Book size={20} color="#00FFA9" />
            <Text style={styles.featureTitle}>Shared Resources</Text>
            <Text style={styles.featureDesc}>Access study materials and notes</Text>
          </View>

          <View style={styles.featureItem}>
            <Target size={20} color="#00FFA9" />
            <Text style={styles.featureTitle}>Group Challenges</Text>
            <Text style={styles.featureDesc}>Complete tasks together for rewards</Text>
          </View>
        </View>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#00FFA9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  features: {
    gap: 16,
  },
  featureItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  featureTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});