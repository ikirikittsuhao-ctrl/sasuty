import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/AppShell';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import SinglePost from '@/pages/SinglePost';
import Profile from '@/pages/Profile';
import Search from '@/pages/Search';
import Trending from '@/pages/Trending';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function PublicRoute({ component: Component, shell = false }: { component: React.ComponentType<any>, shell?: boolean }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (shell && user) {
    return (
      <AppShell>
        <Component />
      </AppShell>
    );
  }

  return <Component />;
}

function CatchAllRoute() {
  const { user } = useAuth();
  if (user) {
    return <AppShell><NotFound /></AppShell>;
  }
  return <NotFound />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/register">
        <PublicRoute component={Register} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/post/:id">
        <ProtectedRoute component={SinglePost} />
      </Route>
      <Route path="/profile/:userId">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/search">
        <PublicRoute component={Search} shell />
      </Route>
      <Route path="/trending">
        <PublicRoute component={Trending} shell />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route>
        <CatchAllRoute />
      </Route>
    </Switch>
  );
}

function App() {
  // Ensure dark mode is active by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;