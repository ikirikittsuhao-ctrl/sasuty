import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { SasutyLogo } from '@/components/SasutyLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLocation('/');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card/30 border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <SasutyLogo size={48} className="mb-8" />
        
        <h1 className="text-3xl font-bold mb-8 text-center">Sign in to Sasuty</h1>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-foreground text-background font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2 mb-6 hover:bg-foreground/90 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-muted-foreground text-sm">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-4">
          <div>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent border border-border focus:border-primary rounded-md py-4 px-4 text-foreground outline-none transition-colors"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border focus:border-primary rounded-md py-4 px-4 text-foreground outline-none transition-colors"
              required
            />
          </div>

          {error && <p className="text-destructive text-sm mt-2">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-foreground text-background font-bold py-3 px-4 rounded-full mt-2 hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
