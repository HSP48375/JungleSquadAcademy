import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Quote, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

interface QuoteSubmissionProps {
  userId: string;
  onSubmit: () => void;
}

export default function QuoteSubmission({ userId, onSubmit }: QuoteSubmissionProps) {
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!quote.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const { error: submitError } = await supabase
        .from('quote_submissions')
        .insert({
          user_id: userId,
          quote_text: quote.trim(),
        });

      if (submitError) throw submitError;

      setQuote('');
      onSubmit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,255,169,0.1)', 'rgba(0,0,0,0)']}
        style={styles.gradient}
      />

      <View style={styles.header}>
        <Quote size={24} color="#00FFA9" />
        <Text style={styles.title}>Inspire the Jungle</Text>
      </View>

      <Text style={styles.subtitle}>
        Share your favorite motivational quote! Top quotes get featured and earn rewards.
      </Text>

      <TextInput
        style={styles.input}
        value={quote}
        onChangeText={setQuote}
        placeholder="Type your quote here..."
        placeholderTextColor="#666666"
        multiline
        maxLength={200}
      />

      <Text style={styles.charCount}>
        {quote.length}/200 characters
      </Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading || !quote.trim()}
      >
        <Send size={20} color="#000000" />
        <Text style={styles.submitText}>Submit Quote</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        * Limited to one submission per week
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFA9',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 16,
  },
  note: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
});