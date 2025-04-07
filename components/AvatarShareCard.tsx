import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Crown } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AvatarDisplay from './AvatarDisplay';

interface AvatarShareCardProps {
  avatar: {
    name: string;
    species: string;
    primaryColor: string;
    secondaryColor: string;
    visualEffects?: any;
    idleAnimation?: string;
  };
  stats: {
    level: number;
    xp: number;
    streak: number;
  };
  isAvatarOfWeek?: boolean;
}

export default function AvatarShareCard({ avatar, stats, isAvatarOfWeek }: AvatarShareCardProps) {
  const cardRef = useRef();

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 0.9,
      });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this platform');
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Your Jungle Avatar',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <View ref={cardRef} style={styles.container}>
      <LinearGradient
        colors={[avatar.primaryColor + '40', 'transparent']}
        style={styles.gradient}
      />

      {isAvatarOfWeek && (
        <View style={styles.crownContainer}>
          <Crown size={32} color="#FFD700" />
          <Text style={styles.crownText}>Avatar of the Week</Text>
        </View>
      )}

      <View style={styles.avatarContainer}>
        <AvatarDisplay
          species={avatar.species}
          name={avatar.name}
          primaryColor={avatar.primaryColor}
          secondaryColor={avatar.secondaryColor}
          visualEffects={avatar.visualEffects}
          idleAnimation={avatar.idleAnimation}
          size="large"
          showName={false}
        />
      </View>

      <Text style={styles.name}>{avatar.name}</Text>
      <Text style={styles.species}>{avatar.species}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Trophy size={24} color="#00FFA9" />
          <Text style={styles.statValue}>Level {stats.level}</Text>
        </View>

        <View style={styles.statItem}>
          <Star size={24} color="#FFD700" />
          <Text style={styles.statValue}>{stats.xp} XP</Text>
        </View>

        <View style={styles.statItem}>
          <Crown size={24} color="#FF69B4" />
          <Text style={styles.statValue}>{stats.streak} Day Streak</Text>
        </View>
      </View>

      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>Jungle Squad</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  crownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  crownText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  species: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#00FFA9',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  watermark: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  watermarkText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#333333',
  },
});