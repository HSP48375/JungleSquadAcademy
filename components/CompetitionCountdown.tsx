import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface CompetitionCountdownProps {
  endDate: string;
}

export default function CompetitionCountdown({ endDate }: CompetitionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  
  // Animation values
  const pulseOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  
  // Set up countdown
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endDate);
      const difference = end.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [endDate]);
  
  // Set up animations
  useEffect(() => {
    // Only animate if less than 24 hours left
    if (timeLeft.days === 0 && !timeLeft.isExpired) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
      
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.sine) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sine) })
        ),
        -1,
        true
      );
    }
  }, [timeLeft.days, timeLeft.isExpired]);
  
  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));
  
  // Get color based on time left
  const getColor = () => {
    if (timeLeft.isExpired) return '#666666';
    if (timeLeft.days === 0 && timeLeft.hours < 6) return '#FF4444';
    if (timeLeft.days === 0) return '#FFD700';
    return '#00FFA9';
  };
  
  const color = getColor();
  
  // Format time units
  const formatTimeUnit = (value: number) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { borderColor: color + '40' },
        timeLeft.days === 0 && !timeLeft.isExpired && pulseStyle
      ]}
    >
      <Clock size={16} color={color} />
      
      <View style={styles.timeContainer}>
        {timeLeft.isExpired ? (
          <Text style={[styles.expiredText, { color }]}>Competition Ended</Text>
        ) : (
          <>
            {timeLeft.days > 0 && (
              <View style={styles.timeUnit}>
                <Text style={[styles.timeValue, { color }]}>{timeLeft.days}</Text>
                <Text style={styles.timeLabel}>days</Text>
              </View>
            )}
            
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color }]}>{formatTimeUnit(timeLeft.hours)}</Text>
              <Text style={styles.timeLabel}>hrs</Text>
            </View>
            
            <Text style={[styles.timeSeparator, { color }]}>:</Text>
            
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color }]}>{formatTimeUnit(timeLeft.minutes)}</Text>
              <Text style={styles.timeLabel}>min</Text>
            </View>
            
            <Text style={[styles.timeSeparator, { color }]}>:</Text>
            
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color }]}>{formatTimeUnit(timeLeft.seconds)}</Text>
              <Text style={styles.timeLabel}>sec</Text>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  timeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeValue: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
  },
  timeLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: '#666666',
  },
  timeSeparator: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#00FFA9',
    marginHorizontal: 2,
  },
  expiredText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#666666',
  },
});