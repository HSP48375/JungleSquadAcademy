import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];

export function useChat(tutorId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      // Create or get existing chat session
      const { data: existingSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      let currentSession = existingSession;

      if (!currentSession) {
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert([
            {
              user_id: userId,
              tutor_id: tutorId,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        currentSession = newSession;
      }

      setSession(currentSession);

      // Load existing messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSession.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  const sendMessage = async (content: string) => {
    if (!session) return;

    try {
      setLoading(true);

      // Call the chat edge function
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId,
          message: content,
          sessionId: session.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Fetch the latest messages after the AI response
      const { data: updatedMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(updatedMessages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    initializeChat,
    sendMessage,
  };
}