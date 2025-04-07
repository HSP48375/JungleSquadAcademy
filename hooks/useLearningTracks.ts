import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LearningTrack {
  id: string;
  tutor_id: string;
  name: string;
  description: string;
  difficulty: string;
  grade_level: string;
  prerequisites: any;
  learning_objectives: any;
  estimated_duration: string;
}

interface TrackModule {
  id: string;
  track_id: string;
  title: string;
  description: string;
  content: any;
  order_index: number;
  exercises: any;
  completion_requirements: any;
  xp_reward: number;
}

interface UserProgress {
  id: string;
  track_id: string;
  current_module_id: string;
  completed_modules: string[];
  completion_percentage: number;
}

export function useLearningTracks(userId: string, tutorId?: string) {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [modules, setModules] = useState<Record<string, TrackModule[]>>({});
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchTracks();
    }
  }, [userId, tutorId]);

  const fetchTracks = async () => {
    try {
      // Fetch learning tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('learning_tracks')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('difficulty');

      if (tracksError) throw tracksError;

      // Fetch modules for each track
      const modulePromises = tracksData.map(track =>
        supabase
          .from('track_modules')
          .select('*')
          .eq('track_id', track.id)
          .order('order_index')
      );

      const moduleResults = await Promise.all(modulePromises);
      const modulesByTrack = moduleResults.reduce((acc, result, index) => {
        if (result.error) throw result.error;
        acc[tracksData[index].id] = result.data;
        return acc;
      }, {} as Record<string, TrackModule[]>);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress_tracks')
        .select('*')
        .eq('user_id', userId)
        .in('track_id', tracksData.map(t => t.id));

      if (progressError) throw progressError;

      const progressByTrack = progressData.reduce((acc, progress) => {
        acc[progress.track_id] = progress;
        return acc;
      }, {} as Record<string, UserProgress>);

      setTracks(tracksData);
      setModules(modulesByTrack);
      setProgress(progressByTrack);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch learning tracks');
    } finally {
      setLoading(false);
    }
  };

  const startTrack = async (trackId: string) => {
    try {
      const firstModule = modules[trackId]?.[0];
      if (!firstModule) throw new Error('No modules found for this track');

      const { error: progressError } = await supabase
        .from('user_progress_tracks')
        .insert({
          user_id: userId,
          track_id: trackId,
          current_module_id: firstModule.id,
          completed_modules: [],
          completion_percentage: 0,
        });

      if (progressError) throw progressError;
      await fetchTracks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start track');
    }
  };

  const completeModule = async (trackId: string, moduleId: string) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      const trackModules = modules[trackId] || [];
      const currentProgress = progress[trackId];

      if (!track || !currentProgress) throw new Error('Track or progress not found');

      const completedModules = [...(currentProgress.completed_modules || []), moduleId];
      const completionPercentage = (completedModules.length / trackModules.length) * 100;

      // Find next module
      const currentIndex = trackModules.findIndex(m => m.id === moduleId);
      const nextModule = trackModules[currentIndex + 1];

      const { error: progressError } = await supabase
        .from('user_progress_tracks')
        .update({
          current_module_id: nextModule?.id || moduleId,
          completed_modules: completedModules,
          completion_percentage: completionPercentage,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', currentProgress.id);

      if (progressError) throw progressError;
      await fetchTracks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete module');
    }
  };

  return {
    tracks,
    modules,
    progress,
    loading,
    error,
    startTrack,
    completeModule,
  };
}