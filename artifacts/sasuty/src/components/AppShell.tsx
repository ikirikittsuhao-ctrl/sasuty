import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { SasutyLogo } from './SasutyLogo';
import { Home, Search, Hash, Bell, User as UserIcon, Settings, LogOut, Plus } from 'lucide-react';
import { useGetTrending, getGetTrendingQueryKey, useGetRecommendedUsers, useToggleFollow } from '@workspace/api-client-react';
import { ComposeModal } from './ComposePost';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  
  const { data: trending } = useGetTrending({ query: { enabled: !!user, queryKey: getGetTrendingQueryKey() } });
  const { data: recommended } = useGetRecommendedUsers({ query: { enabled: !!user, queryKey: ['/api/users/recommended'] } });
  const toggleFollow = useToggleFollow();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/search', icon: Search, label: t('nav.search') },
    { href: '/trending', icon: Hash, label: t('nav.trending') },
    { href: '/notifications', icon: Bell, label: t('nav.notifications') },
    { href: `/profile/${user.id}`, icon: UserIcon, label: t('nav.profile') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const handleLogout = async () => {
    await signOut();
    setLocation('/login');
  };

  const handleFollowToggle = (userId: string) => {
    toggleFollow.mutate({ userId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/users/recommended'] });
      }
    });
  };

  const avatarFallback = user.user_metadata?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
  const displayName = user.user_metadata?.displayName || user.email?.split('@')[0];
  const username = user.user_metadata?.username || user.email?.split('@')[0];
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.avatarUrl;

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      {/* Left Sidebar (Desktop) */}
      <header className="hidden sm:flex flex-col w-[80px] xl:w-[275px] shrink-0 border-r border-border h-[100dvh] sticky top-0 px-2 xl:px-4 py-4 justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/" className="p-3 w-max rounded-full hover:bg-card transition-colors mb-2">
            <SasutyLogo />
          </Link>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div className="inline-flex items-center gap-4 p-3 rounded-full hover:bg-card transition-colors">
                    <Icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className={`hidden xl:inline text-xl ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <button 
            className="mt-4 hidden xl:block w-[90%] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-full py-3 transition-colors"
            onClick={() => setComposeOpen(true)}
          >
            {t('nav.post')}
          </button>
          <button 
            className="mt-4 xl:hidden w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center transition-colors mx-auto shadow-sm"
            onClick={() => setComposeOpen(true)}
          >
            <div className="w-5 h-5 bg-current mask-[url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTExIDRoMnYxNmgtMnoiLz48cGF0aCBkPSJNNCAxMWgxNnYyaC0xNnoiLz48L3N2Zz4=)]" />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-full hover:bg-card transition-colors w-full mt-auto"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full shrink-0 object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold shrink-0">
              {avatarFallback}
            </div>
          )}
          <div className="hidden xl:flex flex-col items-start truncate min-w-0 flex-1">
            <span className="font-bold text-[15px] truncate w-full text-left">{displayName}</span>
            <span className="text-muted-foreground text-[15px] truncate w-full text-left">@{username}</span>
          </div>
          <LogOut className="hidden xl:block w-5 h-5 ml-auto opacity-0 group-hover:opacity-100" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl border-r border-border min-h-[100dvh] pb-16 sm:pb-0">
        {children}
      </main>

      {/* Right Sidebar (Desktop) */}
      <aside className="hidden lg:block w-[350px] shrink-0 pl-8 py-4 sticky top-0 h-[100dvh] overflow-y-auto">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="search" 
            placeholder={t('sidebar.searchPlaceholder')}
            className="w-full bg-card/50 focus:bg-background border border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-full py-3 pl-12 pr-4 text-[15px] outline-none transition-all placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setLocation(`/search?q=${encodeURIComponent(e.currentTarget.value)}`);
              }
            }}
          />
        </div>

        {recommended && recommended.length > 0 && (
          <div className="bg-card/30 border border-border rounded-2xl p-4 mb-4">
            <h2 className="font-bold text-xl mb-4">{t('sidebar.whoToFollow')}</h2>
            <div className="flex flex-col gap-4">
              {recommended.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link href={`/profile/${u.id}`} className="shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover hover:opacity-90" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground hover:opacity-90">
                        {(u.displayName?.[0] || u.username?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <Link href={`/profile/${u.id}`} className="flex flex-col min-w-0 flex-1 hover:underline">
                    <span className="font-bold text-[15px] truncate">{u.displayName}</span>
                    <span className="text-muted-foreground text-[15px] truncate">@{u.username}</span>
                  </Link>
                  <button 
                    onClick={() => handleFollowToggle(u.id)}
                    disabled={toggleFollow.isPending}
                    className="shrink-0 bg-foreground text-background hover:bg-foreground/90 font-bold rounded-full px-4 py-1.5 text-sm transition-colors"
                  >
                    {t('sidebar.follow')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {trending && trending.hashtags && trending.hashtags.length > 0 && (
          <div className="bg-card/30 border border-border rounded-2xl p-4 mb-4">
            <h2 className="font-bold text-xl mb-4">{t('sidebar.whatsHappening')}</h2>
            <div className="flex flex-col gap-4">
              {trending.hashtags.slice(0, 5).map((tg, i) => (
                <Link key={i} href={`/search?q=${encodeURIComponent(tg.tag)}`} className="block hover:bg-card/50 -mx-4 px-4 py-1 transition-colors">
                  <div className="text-sm text-muted-foreground">{t('trending.trending')}</div>
                  <div className="font-bold mt-0.5">{tg.tag}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{tg.count} {t('trending.posts')}</div>
                </Link>
              ))}
            </div>
            <Link href="/trending" className="block text-primary hover:underline mt-4 text-[15px]">
              {t('sidebar.showMore')}
            </Link>
          </div>
        )}

        <div className="text-sm text-muted-foreground px-4 flex flex-wrap gap-x-3 gap-y-1">
          <span>{t('sidebar.terms')}</span>
          <span>{t('sidebar.privacy')}</span>
          <span>{t('sidebar.copyright')}</span>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 w-full bg-background/90 backdrop-blur-md border-t border-border flex justify-around p-3 z-40">
        {[
          { href: '/', icon: Home },
          { href: '/search', icon: Search },
          { href: '/trending', icon: Hash },
          { href: '/notifications', icon: Bell },
          { href: `/profile/${user.id}`, icon: UserIcon },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className="p-2">
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px] text-foreground' : 'stroke-2 text-muted-foreground'}`} />
            </Link>
          );
        })}
      </nav>

      {/* Mobile Floating Action Button */}
      <button 
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-40 transition-transform active:scale-95"
        onClick={() => setComposeOpen(true)}
      >
        <Plus className="w-7 h-7" />
      </button>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}