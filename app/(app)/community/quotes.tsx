import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote, Star, Heart, Share2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQuoteSubmission } from '@/hooks/useQuoteSubmission';
import QuoteSubmission from '@/components/QuoteSubmission';
import GlassmorphicCard from '@/components/GlassmorphicCard';
import ImmersiveBackground from '@/components/ImmersiveBackground';

export default function CommunityQuotesScreen() {
  const { session } = useAuth();
  const { fetchUserQuotes, loading: submissionLoading } = useQuoteSubmission();
  const [quotes, setQuotes] = useState([]);
  const [userQuotes, setUserQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canSubmit, setCanSubmit] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchQuotes();
      loadUserQuotes();
    }
  }, [session]);

  const fetchQuotes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('quote_submissions')
        .select(`
          *,
          author:profiles!inner (
            avatar:user_avatar!inner (
              avatar_name,
              primary_color,
              secondary_color,
              species:avatar_species (
                name
              )
            )
          )
        `)
        .eq('approved', true)
        .order('featured_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setQuotes(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const loadUserQuotes = async () => {
    if (!session?.user) return;
    
    try {
      const quotes = await fetchUserQuotes(session.user.id);
      setUserQuotes(quotes);
      
      // Check if user can submit a new quote
      const recentQuote = quotes.find(q => {
        const quoteDate = new Date(q.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return quoteDate > weekAgo;
      });
      
      setCanSubmit(!recentQuote);
    } catch (e) {
      console.error('Error loading user quotes:', e);
    }
  };

  const handleQuoteSubmit = () => {
    loadUserQuotes();
    fetchQuotes();
  };

  const handleLike = async (quoteId: string) => {
    // This would be implemented with a likes table in a real app
    console.log('Liked quote:', quoteId);
  };

  const handleShare = async (quote: any) => {
    // This would use the Share API in a real app
    console.log('Shared quote:', quote.quote_text);
  };

  return (
    <View style={styles.container}>
      <ImmersiveBackground intensity="medium" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Community Quotes</Text>
          <Text style={styles.subtitle}>Wisdom and inspiration from the Jungle Squad</Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {canSubmit && (
          <QuoteSubmission 
            userId={session?.user?.id} 
            onSubmit={handleQuoteSubmit} 
          />
        )}

        {userQuotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Submissions</Text>
            
            {userQuotes.map((quote) => (
              <GlassmorphicCard
                key={quote.id}
                glowColor={quote.approved ? '#00FFA9' : '#666666'}
                intensity={quote.approved ? 'medium' : 'low'}
                style={styles.quoteCard}
              >
                <Text style={styles.quoteText}>"{quote.quote_text}"</Text>
                
                <View style={styles.quoteFooter}>
                  <Text style={styles.timestamp}>
                    {new Date(quote.created_at).toLocaleDateString()}
                  </Text>
                  
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: quote.approved 
                        ? 'rgba(0, 255, 169, 0.1)' 
                        : 'rgba(102, 102, 102, 0.1)'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: quote.approved ? '#00FFA9' : '#666666' }
                    ]}>
                      {quote.approved ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </GlassmorphicCard>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Quotes</Text>
          
          {quotes.filter(q => q.featured_at).map((quote) => (
            <GlassmorphicCard
              key={quote.id}
              glowColor="#FFD700"
              intensity="medium"
              style={styles.quoteCard}
            >
              <View style={styles.featuredBadge}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
              
              <Text style={styles.quoteText}>"{quote.quote_text}"</Text>
              
              <View style={styles.quoteAuthor}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>— {quote.author.avatar.avatar_name}</Text>
                </View>
                
                <View style={styles.quoteActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleLike(quote.id)}
                  >
                    <Heart size={20} color="#FF4444" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleShare(quote)}
                  >
                    <Share2 size={20} color="#00FFA9" />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassmorphicCard>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Quotes</Text>
          
          {quotes.filter(q => !q.featured_at).map((quote) => (
            <GlassmorphicCard
              key={quote.id}
              glowColor="#00FFA9"
              intensity="low"
              style={styles.quoteCard}
            >
              <Text style={styles.quoteText}>"{quote.quote_text}"</Text>
              
              <View style={styles.quoteAuthor}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>— {quote.author.avatar.avatar_name}</Text>
                </View>
                
                <View style={styles.quoteActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleLike(quote.id)}
                  >
                    <Heart size={20} color="#FF4444" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleShare(quote)}
                  >
                    <Share2 size={20} color="#00FFA9" />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassmorphicCard>
          ))}
        </View>
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
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 255, 169, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  quoteCard: {
    marginBottom: 16,
    padding: 20,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  featuredText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 28,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
  },
  quoteAuthor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#00FFA9',
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});