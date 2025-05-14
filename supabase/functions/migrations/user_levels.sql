-- Add level and xp fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users USING btree (level);

-- Create a function to update user level based on XP
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple level calculation: Every 100 XP = 1 level
  NEW.level := 1 + FLOOR(NEW.xp / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update level when XP changes
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.users;
CREATE TRIGGER trigger_update_user_level
BEFORE UPDATE OF xp ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_user_level();
