import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { SasutyLogo } from '@/components/SasutyLogo';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          username: email.split('@')[0], // Give them a default username based on email
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card/30 border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <SasutyLogo size={48} className="mb-8" />
        
        <h1 className="text-3xl font-bold mb-8 text-center">Join Sasuty today</h1>

        <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
          <div>
            <input 
              type="text" 
              placeholder="Display Name" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-transparent border border-border focus:border-primary rounded-md py-4 px-4 text-foreground outline-none transition-colors"
              required
            />
          </div>
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
              placeholder="Password (min 6 chars)" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border border-border focus:border-primary rounded-md py-4 px-4 text-foreground outline-none transition-colors"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-destructive text-sm mt-2">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-full mt-4 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
