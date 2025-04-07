export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          is_parent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_parent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_parent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tutors: {
        Row: {
          id: string
          name: string
          animal: string
          subject: string
          catchphrase: string | null
          avatar_url: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          animal: string
          subject: string
          catchphrase?: string | null
          avatar_url?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          animal?: string
          subject?: string
          catchphrase?: string | null
          avatar_url?: string | null
          description?: string | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          tutor_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tutor_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tutor_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          content: string
          is_tutor: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          content: string
          is_tutor?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          content?: string
          is_tutor?: boolean
          created_at?: string
        }
      }
      daily_challenges: {
        Row: {
          id: string
          tutor_id: string
          title: string
          description: string
          difficulty: string
          points: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          title: string
          description: string
          difficulty: string
          points?: number
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          tutor_id?: string
          title?: string
          description?: string
          difficulty?: string
          points?: number
          created_at?: string
          expires_at?: string
        }
      }
      challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          content: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          content: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          content?: string
          status?: string
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          tutor_id: string
          xp_points: number
          time_spent: string
          last_interaction: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tutor_id: string
          xp_points?: number
          time_spent?: string
          last_interaction?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tutor_id?: string
          xp_points?: number
          time_spent?: string
          last_interaction?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon_url: string | null
          required_points: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon_url?: string | null
          required_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon_url?: string | null
          required_points?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}