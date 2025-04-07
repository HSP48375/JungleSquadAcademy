import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';

type GameState = 'ready' | 'playing' | 'paused' | 'gameOver';

export default function GameScreen() {
  const { game } = useLocalSearchParams();
  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const { session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scoreAnimation = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSequence(
          withSpring(1.2),
          withSpring(1)
        ),
      },
    ],
  }));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setGameState('gameOver');
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const handlePress = () => {
    if (gameState === 'playing') {
      setScore((prev) => prev + 10);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#000000' : '#F5F5F5' }
    ]}>
      <LinearGradient
        colors={['rgba(0,255,170,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Animated.Text style={[
          styles.score,
          scoreAnimation,
          { color: isDark ? '#FFFFFF' : '#000000' }
        ]}>
          Score: {score}
        </Animated.Text>
        <Text style={[
          styles.timer,
          { color: isDark ? '#FFFFFF' : '#000000' }
        ]}>
          Time: {timeLeft}s
        </Text>
      </View>

      <View style={styles.gameArea}>
        {gameState === 'ready' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startGame}
          >
            <Text style={styles.startButtonText}>Start Game</Text>
          </TouchableOpacity>
        )}

        {gameState === 'playing' && (
          <TouchableOpacity
            style={styles.gameButton}
            onPress={handlePress}
          >
            <Text style={styles.gameButtonText}>Tap!</Text>
          </TouchableOpacity>
        )}

        {gameState === 'paused' && (
          <TouchableOpacity
            style={styles.resumeButton}
            onPress={resumeGame}
          >
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        )}

        {gameState === 'gameOver' && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <Text style={styles.finalScoreText}>Final Score: {score}</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={startGame}
            >
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {gameState === 'playing' && (
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={pauseGame}
        >
          <Text style={styles.pauseButtonText}>Pause</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
    paddingTop: 60,
  },
  score: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
  },
  timer: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startButton: {
    backgroundColor: '#00FFA9',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
  },
  startButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#000000',
  },
  gameButton: {
    width: 200,
    height: 200,
    backgroundColor: '#00FFA9',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#000000',
  },
  pauseButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pauseButtonText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  resumeButton: {
    backgroundColor: '#00FFA9',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
  },
  resumeButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#000000',
  },
  gameOverContainer: {
    alignItems: 'center',
  },
  gameOverText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 36,
    color: '#FF4444',
    marginBottom: 20,
  },
  finalScoreText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#00FFA9',
    marginBottom: 40,
  },
  playAgainButton: {
    backgroundColor: '#00FFA9',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 16,
  },
  playAgainButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 24,
    color: '#000000',
  },
});