import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Star, Crown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AvatarDisplay from '@/components/AvatarDisplay';

export default function QuoteAdminScreen() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

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
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQuotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quoteId: string, featured: boolean = false) => {
    try {
      const { error: approveError } = await supabase
        .from('quote_submissions')
        .update({
          approved: true,
          featured_at: featured ? new Date().toISOString() : null,
        })
        .eq('id', quoteId);

      if (approveError) throw approveError;

      if (featured) {
        // Reward user with coins
        const quote = quotes.find(q => q.id === quoteId);
        if (quote) {
          await supabase.rpc('handle_coin_transaction', {
            p_user_id: quote.user_id,
            p_amount: 50,
            p_type: 'reward',
            p_description: 'Quote featured in Jungle Squad!',
          });
        }
      }

      await fetchQuotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve quote');
    }
  };

  const handleReject = async (quoteId: string) => {
    try {
      const { error: rejectError } = await supabase
        .from('quote_submissions')
        .delete()
        .eq('id', quoteId);

      if (rejectError) throw rejectError;
      await fetchQuotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject quote');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading quotes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Quote Submissions</Text>
        <Text style={styles.subtitle}>Review and approve community quotes</Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {quotes.map((quote) => (
        <View key={quote.id} style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <AvatarDisplay
              species={quote.author.avatar.species.name}
              name={quote.author.avatar.avatar_name}
              primaryColor={quote.author.avatar.primary_color}
              secondaryColor={quote.author.avatar.secondary_color}
              size="small"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{quote.author.avatar.avatar_name}</Text>
              <Text style={styles.timestamp}>
                {new Date(quote.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Text style={styles.quoteText}>"{quote.quote_text}"</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(quote.id)}
            >
              <Check size={20} color="#000" />
              <Text style={styles.actionText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.featureButton]}
              onPress={() => handleApprove(quote.id, true)}
            >
              <Crown size={20} color="#000" />
              <Text style={styles.actionText}>Feature</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(quote.id)}
            >
              <X size={20} color="#FFF" />
              <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
    fontSize: 16,
    color: '#666666',
  },
  loadingText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 16,
  },
  quoteCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#333333',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  timestamp: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
  },
  quoteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#00FFA9',
  },
  featureButton: {
    backgroundColor: '#FFD700',
  },
  rejectButton: {
    backgroundColor: '#333333',
  },
  actionText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#000000',
  },
  rejectText: {
    color: '#FFFFFF',
  },
});