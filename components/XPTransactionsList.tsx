import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { Trophy, Zap, Gamepad2, Book, MessageSquare, Calendar } from 'lucide-react-native';
import GlassmorphicCard from './GlassmorphicCard';

interface XPTransaction {
  id: string;
  amount: number;
  source: string;
  multiplier: number;
  streak_bonus: number;
  final_amount: number;
  created_at: string;
}

interface XPTransactionsListProps {
  transactions: XPTransaction[];
  loading?: boolean;
}

export default function XPTransactionsList({
  transactions,
  loading = false,
}: XPTransactionsListProps) {
  // Get icon based on source
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'daily_login':
        return <Calendar size={20} color="#00FFA9" />;
      case 'chat_completion':
        return <MessageSquare size={20} color="#00AAFF" />;
      case 'challenge_completion':
        return <Trophy size={20} color="#FFD700" />;
      case 'game_completion':
        return <Gamepad2 size={20} color="#FF00AA" />;
      case 'lesson_completion':
        return <Book size={20} color="#00FF00" />;
      default:
        return <Zap size={20} color="#00FFA9" />;
    }
  };
  
  // Get formatted source name
  const getSourceName = (source: string) => {
    switch (source) {
      case 'daily_login':
        return 'Daily Login';
      case 'chat_completion':
        return 'Chat Session';
      case 'challenge_completion':
        return 'Challenge Completed';
      case 'game_completion':
        return 'Game Completed';
      case 'lesson_completion':
        return 'Lesson Completed';
      default:
        return source.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render transaction item
  const renderItem = ({ item }: { item: XPTransaction }) => {
    const hasBonus = item.multiplier > 1 || item.streak_bonus > 1;
    
    return (
      <GlassmorphicCard
        glowColor="#00FFA9"
        intensity="low"
        style={styles.transactionCard}
      >
        <View style={styles.transactionContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            {getSourceIcon(item.source)}
          </View>
          
          {/* Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sourceName}>
              {getSourceName(item.source)}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(item.created_at)}
            </Text>
            
            {/* Bonus info */}
            {hasBonus && (
              <View style={styles.bonusContainer}>
                {item.multiplier > 1 && (
                  <Text style={styles.bonusText}>
                    {item.multiplier}x Tier Bonus
                  </Text>
                )}
                {item.streak_bonus > 1 && (
                  <Text style={styles.bonusText}>
                    {item.streak_bonus}x Streak Bonus
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* XP amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>
              +{item.final_amount}
            </Text>
            {item.amount !== item.final_amount && (
              <Text style={styles.baseAmountText}>
                (Base: {item.amount})
              </Text>
            )}
          </View>
        </View>
      </GlassmorphicCard>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent XP Activity</Text>
      
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>
          No XP transactions yet. Start learning to earn XP!
        </Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  transactionCard: {
    marginBottom: 0,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  sourceName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dateText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  bonusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  bonusText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#00FFA9',
    textShadowColor: 'rgba(0, 255, 169, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  baseAmountText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#AAAAAA',
  },
  emptyText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 20,
  },
});