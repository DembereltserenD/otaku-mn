import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};

export async function upsertUserProfile(profile: UserProfile) {
  if (!profile.id || !profile.username) return;
  // Upsert user profile (insert or update if exists)
  const { error } = await supabase
    .from('users')
    .upsert([profile], { onConflict: 'id' });
  if (error) throw error;
} 