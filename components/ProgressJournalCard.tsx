import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Book, ChevronRight, Mic, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useSharedValueEffect,
} from 'react-native-reanimated';
import GlassmorphicCard from './GlassmorphicCard';

interface ProgressJournalCardProps {
  date: string;
  hasTextEntry: boolean;
  hasVoiceEntry: boolean;
  hasSummary: boolean;
  onPress: () => void;
  isLatest?: boolean;
}

export default function ProgressJournalCard({
  date,
  hasTextEntry,
  hasVoiceEntry,
  hasSummary,
  onPress,
  isLatest = false,
}: ProgressJournalCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      year: date.toLocaleDateString('en-US', { year: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  };
  
  const formattedDate = formatDate(date);
  
  // Get entry type icon
  const getEntryTypeIcon = () => {
    if (hasTextEntry && hasVoiceEntry) {
      return <View style={styles.multipleIcons}>
        <FileText size={12} color="#FFFFFF" />
        <Mic size={12} color="#FFFFFF" />
      </View>;
    } else if (hasVoiceEntry) {
      return <Mic size={16} color="#FFFFFF" />;
    } else {
      return <FileText size={16} color="#FFFFFF" />;
    }
  };

  return (
    <GlassmorphicCard
      glowColor={isLatest ? '#00FFA9' : '#666666'}
      intensity={isLatest ? 'medium' : 'low'}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
      >
        <View style={styles.dateContainer}>
          <View style={styles.calendarIcon}>
            <Text style={styles.monthText}>{formattedDate.month}</Text>
            <Text style={styles.dayText}>{formattedDate.day}</Text>
          </View>
          
          <View style={styles.dateInfo}>
            <Text style={styles.weekdayText}>{formattedDate.weekday}</Text>
            <Text style={styles.yearText}>{formattedDate.year}</Text>
          </View>
        </View>
        
        <View style={styles.entryInfo}>
          <View style={styles.entryTypeContainer}>
            <View style={[
              styles.entryTypeBadge,
              { backgroundColor: hasTextEntry || hasVoiceEntry ? '#00FFA9' : '#666666' }
            ]}>
              {getEntryTypeIcon()}
            </View>
            
            <Text style={styles.entryTypeText}>
              {hasTextEntry || hasVoiceEntry ? 'Entry Completed' : 'No Entry'}
            </Text>
          </View>
          
          {hasSummary && (
            <View style={styles.summaryBadge}>
              <Book size={12} color="#FFD700" />
              <Text style={styles.summaryText}>AI Summary</Text>
            </View>
          )}
        </View>
        
        <ChevronRight size={20} color="#666666" />
      </TouchableOpacity>
      
      {isLatest && (
        <View style={styles.latestBadge}>
          <LinearGradient
            colors={['#00FFA9', '#00AAFF']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.latestText}>Latest</Text>
        </View>
      )}
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#00FFA9',
    textTransform: 'uppercase',
  },
  dayText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  dateInfo: {
    marginLeft: 12,
  },
  weekdayText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  yearText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  entryInfo: {
    flex: 1,
  },
  entryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  multipleIcons: {
    flexDirection: 'row',
    gap: 2,
  },
  entryTypeText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  summaryText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFD700',
  },
  latestBadge: {
    position: 'absolute',
    top: 12,
    right: -30,
    width: 100,
    transform: [{ rotate: '45deg' }],
    paddingVertical: 4,
    alignItems: 'center',
  },
  latestText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 10,
    color: '#000000',
  },
});