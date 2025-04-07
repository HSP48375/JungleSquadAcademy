import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useChallenges } from '@/hooks/useChallenges';
import { Clock, Trophy, AlertCircle } from 'lucide-react-native';

export default function ChallengesScreen() {
  const { session } = useAuth();
  const { challenges, submissions, loading, error, submitChallenge } = useChallenges(
    session?.user?.id ?? ''
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.subtitle}>Complete challenges to earn XP</Text>
      </View>

      {challenges.map((challenge) => {
        const submission = submissions.find(
          (s) => s.challenge_id === challenge.id
        );

        return (
          <View key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      challenge.difficulty === 'easy'
                        ? '#4CAF50'
                        : challenge.difficulty === 'medium'
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}>
                <Text style={styles.difficultyText}>
                  {challenge.difficulty.charAt(0).toUpperCase() +
                    challenge.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.challengeDesc}>{challenge.description}</Text>

            <View style={styles.challengeFooter}>
              <View style={styles.challengeInfo}>
                <View style={styles.infoItem}>
                  <Trophy size={16} color="#00FFA9" />
                  <Text style={styles.infoText}>{challenge.points} XP</Text>
                </View>
                <View style={styles.infoItem}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.infoText}>24h remaining</Text>
                </View>
              </View>

              {submission ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        submission.status === 'approved'
                          ? '#4CAF50'
                          : submission.status === 'rejected'
                          ? '#F44336'
                          : '#FF9800',
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {submission.status.charAt(0).toUpperCase() +
                      submission.status.slice(1)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitChallenge(challenge.id)}>
                  <Text style={styles.submitText}>Submit Solution</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
  },
  challengeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#333',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#fff',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  difficultyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#fff',
  },
  challengeDesc: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#BBB',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeInfo: {
    flexDirection: 'row',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#00FFA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#fff',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 40,
  },
});