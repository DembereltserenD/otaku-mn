export type UserProfile = { 
  id: string; 
  username: string; 
  avatar_url: string | null; 
  created_at: string | null; 
  bio: string | null; 
  level?: number;
  xp?: number;
};
