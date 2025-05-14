import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: string | null; // 'user', 'admin', or null
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  role: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Fetch user role from users table
  const fetchUserRole = async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setRole(data?.role || null);
    } catch (error) {
      setRole(null);
    }
  };

  useEffect(() => {
    // Check for stored session
    const loadSession = async () => {
      try {
        // First try to get the current session from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          // If we have a valid current session, use it
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          await fetchUserRole(currentSession?.user?.id);
          setIsLoading(false);
          return;
        }
        
        // If no current session, try to restore from SecureStore
        const storedSession = await SecureStore.getItemAsync('supabase-session');
        
        if (storedSession) {
          try {
            const { data: { session: restoredSession }, error } = await supabase.auth.setSession(JSON.parse(storedSession));
            
            if (error) {
              // If there's an error with the stored session (like invalid refresh token),
              // clear the stored session and start fresh
              console.log('Error restoring session, clearing stored session:', error.message);
              await SecureStore.deleteItemAsync('supabase-session');
              throw error;
            }
            
            if (restoredSession) {
              setSession(restoredSession);
              setUser(restoredSession?.user ?? null);
              await fetchUserRole(restoredSession?.user?.id);
            }
          } catch (sessionError) {
            console.error('Failed to restore session:', sessionError);
            // Clear user state since session restoration failed
            setUser(null);
            setSession(null);
            setRole(null);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // Clear everything on sign out
        setUser(null);
        setSession(null);
        setRole(null);
        await SecureStore.deleteItemAsync('supabase-session');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Update with the new session
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user?.id) {
          await fetchUserRole(newSession.user.id);
        }
        
        // Store session securely
        if (newSession) {
          await SecureStore.setItemAsync('supabase-session', JSON.stringify(newSession));
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data?.user?.id) {
        await fetchUserRole(data.user.id);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (data?.user?.id) {
        await fetchUserRole(data.user.id);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        role,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
