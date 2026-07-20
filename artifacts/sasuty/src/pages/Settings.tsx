import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateMyProfile, useGetUser } from '@workspace/api-client-react';
import { ArrowLeft, ChevronRight, User, Globe, LogOut, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { setLanguage as setI18nLanguage } from '@/i18n';

type SettingsView = 'menu' | 'account' | 'language';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const [view, setView] = useState<SettingsView>('menu');

  const { data: dbUser } = useGetUser(user?.id ?? '', {
    query: { enabled: !!user?.id, queryKey: [`/api/users/${user?.id}`] },
  });

  // Account state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');

  // Language state
  const [language, setLanguage] = useState(i18n.language?.startsWith('en') ? 'en' : 'ja');

  useEffect(() => {
    if (dbUser) {
      setDisplayName(dbUser.displayName || '');
      setUsername(dbUser.username || '');
      setBio(dbUser.bio || '');
      setAvatarUrl(dbUser.avatarUrl || '');
      setBannerUrl(dbUser.bannerUrl || '');
      setLocationStr(dbUser.location || '');
      setBirthday(dbUser.birthday ? new Date(dbUser.birthday).toISOString().split('T')[0] : '');
      setWebsite(dbUser.website || '');
      if (dbUser.language) setLanguage(dbUser.language);
    } else if (user?.user_metadata) {
      setDisplayName(user.user_metadata.displayName || '');
      setUsername(user.user_metadata.username || user.email?.split('@')[0] || '');
    }
  }, [user, dbUser]);

  const handleAccountSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      data: { displayName, username, bio, avatarUrl, bannerUrl, location: locationStr, birthday: birthday || undefined, website },
    }, {
      onSuccess: () => {
        if (user) queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
        setView('menu');
      },
    });
  };

  const handleLanguageSave = () => {
    setI18nLanguage(language);
    updateProfile.mutate({ data: { language } }, {
      onSuccess: () => setView('menu'),
    });
  };

  const handleLogout = async () => {
    await signOut();
    setLocation('/login');
  };

  const inputClass = 'w-full bg-transparent border border-border focus:border-primary rounded-xl py-3 px-4 text-foreground outline-none transition-colors text-[15px]';
  const labelClass = 'text-sm font-semibold text-muted-foreground ml-1';

  if (view === 'account') {
    return (
      <div className="flex flex-col w-full min-h-[100dvh]">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 py-3 gap-4">
          <button onClick={() => setView('menu')} className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{t('settings.accountSettings')}</h1>
        </div>
        <div className="p-4 sm:p-6 pb-24">
          <form onSubmit={handleAccountSave} className="flex flex-col gap-5 max-w-xl mx-auto">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.displayName')}</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.username')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputClass + ' pl-8'} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.bio')}</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={160}
                className="w-full bg-transparent border border-border focus:border-primary rounded-xl py-3 px-4 text-foreground outline-none transition-colors text-[15px] resize-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.avatarUrl')}</label>
              <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className={inputClass} />
              {avatarUrl && <img src={avatarUrl} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover mt-1" />}
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.bannerUrl')}</label>
              <input type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." className={inputClass} />
              {bannerUrl && <img src={bannerUrl} alt="Banner preview" className="w-full h-24 object-cover rounded-xl mt-1" />}
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.location')}</label>
              <input type="text" value={locationStr} onChange={e => setLocationStr(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.birthday')}</label>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('settings.website')}</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={updateProfile.isPending}
                className="bg-foreground text-background font-bold py-2.5 px-8 rounded-full hover:bg-foreground/90 transition-colors disabled:opacity-50">
                {updateProfile.isPending ? t('settings.saving') : t('settings.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'language') {
    return (
      <div className="flex flex-col w-full min-h-[100dvh]">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 py-3 gap-4">
          <button onClick={() => setView('menu')} className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{t('settings.languageSettings')}</h1>
        </div>
        <div className="p-4 sm:p-6 max-w-xl mx-auto w-full">
          <p className="text-muted-foreground text-[15px] mb-6">{t('settings.languageDesc')}</p>
          <div className="flex flex-col gap-3">
            {[
              { value: 'ja', label: '日本語' },
              { value: 'en', label: 'English' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setLanguage(value)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all ${language === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-card/50'}`}>
                <span className="text-[16px] font-medium">{label}</span>
                {language === value && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary-foreground" /></div>}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={handleLanguageSave} disabled={updateProfile.isPending}
              className="bg-foreground text-background font-bold py-2.5 px-8 rounded-full hover:bg-foreground/90 transition-colors disabled:opacity-50">
              {updateProfile.isPending ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main menu
  const menuItems = [
    {
      icon: User,
      label: t('settings.accountSettings'),
      desc: t('settings.accountDesc'),
      onClick: () => setView('account'),
    },
    {
      icon: Globe,
      label: t('settings.languageSettings'),
      desc: language === 'ja' ? '日本語' : 'English',
      onClick: () => setView('language'),
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 py-3 gap-4">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
      </div>

      <div className="flex flex-col max-w-xl mx-auto w-full pb-24">
        {/* User info header */}
        <div className="flex items-center gap-4 p-5 border-b border-border">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
              {displayName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[17px] truncate">{displayName || username}</span>
            <span className="text-muted-foreground text-[15px] truncate">@{username}</span>
          </div>
        </div>

        {/* Settings menu */}
        <div className="flex flex-col">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={item.onClick}
                className="flex items-center gap-4 px-5 py-4 hover:bg-card/50 transition-colors border-b border-border w-full text-left">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-semibold text-[15px]">{item.label}</span>
                  {item.desc && <span className="text-muted-foreground text-sm truncate">{item.desc}</span>}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Danger zone */}
        <div className="mt-6 px-5">
          <div className="rounded-xl border border-destructive/30 overflow-hidden">
            <button onClick={handleLogout}
              className="flex items-center gap-4 px-5 py-4 hover:bg-destructive/5 transition-colors w-full text-left text-destructive">
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-[15px]">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
