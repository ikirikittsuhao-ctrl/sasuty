import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useSyncUser, setAuthTokenGetter } from '@workspace/api-client-react';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

// Module-level token store so setAuthTokenGetter getter can read it
let _currentToken: string | null = null;

// Register the getter once at module load
setAuthTokenGetter(() => _currentToken);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const syncUser = useSyncUser();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.access_token) {
        _currentToken = session.access_token;
        sessionStorage.setItem('access_token', session.access_token);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        _currentToken = session.access_token;
        sessionStorage.setItem('access_token', session.access_token);

        // Sync user to our backend
        if (session.user) {
          syncUser.mutate({
            data: {
              id: session.user.id,
              email: session.user.email ?? '',
              displayName:
                session.user.user_metadata?.['full_name'] ??
                session.user.user_metadata?.['displayName'] ??
                undefined,
              avatarUrl: session.user.user_metadata?.['avatar_url'] ?? undefined,
              username:
                session.user.user_metadata?.['user_name'] ??
                session.user.email?.split('@')[0] ??
                undefined,
            },
          });
        }
      } else {
        _currentToken = null;
        sessionStorage.removeItem('access_token');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
