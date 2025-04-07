import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface JournalEntry {
  id: string;
  week_start: string;
  text_entry: string | null;
  voice_entry_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

export function useJournal(userId: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchEntries();
      calculateStreak();
    }
  }, [userId]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      // Get all entries
      const { data, error: fetchError } = await supabase
        .from('weekly_journals')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false });

      if (fetchError) throw fetchError;
      
      setEntries(data || []);
      
      // Get current week's entry if it exists
      const currentWeekStart = getWeekStart(new Date());
      const currentWeekEntry = data?.find(entry => 
        new Date(entry.week_start).toISOString() === currentWeekStart.toISOString()
      );
      
      setCurrentEntry(currentWeekEntry || null);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async () => {
    try {
      // Get entries from the last 8 weeks
      const { data, error: fetchError } = await supabase
        .from('weekly_journals')
        .select('week_start')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(8);

      if (fetchError) throw fetchError;
      
      if (!data || data.length === 0) {
        setStreak(0);
        return;
      }
      
      // Calculate streak
      let currentStreak = 0;
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      // Sort entries by week_start in descending order
      const sortedEntries = [...data].sort((a, b) => 
        new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
      );
      
      // Check if current week has an entry
      const currentWeekStart = getWeekStart(now);
      const hasCurrentWeek = sortedEntries.some(entry => 
        new Date(entry.week_start).toISOString() === currentWeekStart.toISOString()
      );
      
      if (hasCurrentWeek) {
        currentStreak = 1;
        
        // Check previous weeks
        let prevWeekStart = new Date(currentWeekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryWeekStart = new Date(sortedEntries[i].week_start);
          
          if (entryWeekStart.toISOString() === prevWeekStart.toISOString()) {
            currentStreak++;
            prevWeekStart.setDate(prevWeekStart.getDate() - 7);
          } else {
            break;
          }
        }
      }
      
      setStreak(currentStreak);
      
    } catch (e) {
      console.error('Error calculating streak:', e);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay()); // Set to Sunday
    result.setHours(0, 0, 0, 0); // Set to midnight
    return result;
  };

  const submitTextEntry = async (text: string) => {
    if (!text.trim()) {
      setError('Journal entry cannot be empty');
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const weekStart = getWeekStart(new Date());
      
      // Check if entry already exists
      if (currentEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('weekly_journals')
          .update({
            text_entry: text.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEntry.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('weekly_journals')
          .insert({
            user_id: userId,
            week_start: weekStart.toISOString(),
            text_entry: text.trim()
          });
          
        if (insertError) throw insertError;
        
        // Award XP for new entry
        await supabase.rpc('add_user_xp', {
          p_user_id: userId,
          p_amount: 10,
          p_source: 'journal_entry'
        });
      }
      
      // Generate AI summary
      await generateSummary(text.trim(), currentEntry?.id);
      
      // Refresh entries
      await fetchEntries();
      await calculateStreak();
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save journal entry');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitVoiceEntry = async (uri: string) => {
    if (!uri) {
      setError('Voice recording is empty');
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const weekStart = getWeekStart(new Date());
      
      // Upload voice recording
      const fileName = `voice_entries/${userId}/${Date.now()}.m4a`;
      
      // For web, we'd need a different approach since FileSystem is not available
      if (Platform.OS !== 'web') {
        const { error: uploadError } = await supabase.storage
          .from('journal')
          .upload(fileName, await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }), {
            contentType: 'audio/m4a'
          });
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('journal')
          .getPublicUrl(fileName);
          
        // Save entry
        if (currentEntry) {
          // Update existing entry
          const { error: updateError } = await supabase
            .from('weekly_journals')
            .update({
              voice_entry_url: publicUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentEntry.id);
            
          if (updateError) throw updateError;
        } else {
          // Create new entry
          const { error: insertError } = await supabase
            .from('weekly_journals')
            .insert({
              user_id: userId,
              week_start: weekStart.toISOString(),
              voice_entry_url: publicUrl
            });
            
          if (insertError) throw insertError;
          
          // Award XP for new entry
          await supabase.rpc('add_user_xp', {
            p_user_id: userId,
            p_amount: 15, // Extra XP for voice entries
            p_source: 'journal_voice_entry'
          });
        }
        
        // Refresh entries
        await fetchEntries();
        await calculateStreak();
        
        return true;
      } else {
        throw new Error('Voice recording not supported on web');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save voice entry');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const generateSummary = async (text: string, entryId?: string) => {
    try {
      // Call the edge function to generate summary
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-journal-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          entryId,
          text
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to generate summary:', await response.text());
      }
    } catch (e) {
      console.error('Error generating summary:', e);
    }
  };

  const getEntryById = (id: string) => {
    return entries.find(entry => entry.id === id) || null;
  };

  const getEntryByWeek = (weekStart: Date) => {
    const formattedWeekStart = weekStart.toISOString();
    return entries.find(entry => 
      new Date(entry.week_start).toISOString() === formattedWeekStart
    ) || null;
  };

  const shareEntry = async (entryId: string) => {
    try {
      const entry = getEntryById(entryId);
      if (!entry) throw new Error('Entry not found');
      
      if (Platform.OS === 'web') {
        // Web sharing
        await navigator.share({
          title: 'My Learning Journal',
          text: `My learning reflection from ${new Date(entry.week_start).toLocaleDateString()}:\n\n${entry.text_entry}\n\n${entry.ai_summary ? `AI Reflection: ${entry.ai_summary}` : ''}`,
        });
      } else if (await Sharing.isAvailableAsync()) {
        // Native sharing
        const fileUri = FileSystem.documentDirectory + 'journal_entry.txt';
        await FileSystem.writeAsStringAsync(fileUri, 
          `My learning reflection from ${new Date(entry.week_start).toLocaleDateString()}:\n\n${entry.text_entry}\n\n${entry.ai_summary ? `AI Reflection: ${entry.ai_summary}` : ''}`
        );
        await Sharing.shareAsync(fileUri);
      }
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share journal entry');
      return false;
    }
  };

  return {
    entries,
    currentEntry,
    loading,
    submitting,
    error,
    streak,
    submitTextEntry,
    submitVoiceEntry,
    getEntryById,
    getEntryByWeek,
    shareEntry,
    refreshEntries: fetchEntries,
  };
}