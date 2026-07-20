import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetUser, useGetUserPosts, useGetUserFollowers, useGetUserFollowing, useToggleFollow } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PostCard } from '@/components/PostCard';
import { ArrowLeft, CalendarDays, MapPin, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const userId = params.userId!;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  const { data: user, isLoading: isUserLoading } = useGetUser(userId);
  const { data: postsPage, isLoading: isPostsLoading } = useGetUserPosts(userId);
  const { data: followers, isLoading: isFollowersLoading } = useGetUserFollowers(userId);
  const { data: following, isLoading: isFollowingLoading } = useGetUserFollowing(userId);
  const toggleFollow = useToggleFollow();

  const handleFollowToggle = () => {
    if (!user) return;
    toggleFollow.mutate({ userId: user.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      }
    });
  };

  const avatarFallback = user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md flex items-center px-4 py-2 gap-6 h-14">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold leading-tight">{user?.displayName || t('nav.profile')}</h1>
          <span className="text-xs text-muted-foreground leading-tight">{user?.postsCount || 0} {t('profile.posts')}</span>
        </div>
      </div>

      {isUserLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : user ? (
        <>
          <div className="relative">
            <div className="h-32 sm:h-48 bg-muted w-full relative">
              {user.bannerUrl && <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            </div>
            
            <div className="px-4 pb-4">
              <div className="flex justify-between items-start">
                <div className="relative -mt-12 sm:-mt-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-card overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                      {avatarFallback}
                    </div>
                  )}
                </div>
                
                <div className="pt-3">
                  {user.isMe ? (
                    <Link href="/settings" className="px-4 py-1.5 font-bold border border-border rounded-full hover:bg-card transition-colors inline-block text-[15px]">
                      {t('profile.editProfile')}
                    </Link>
                  ) : (
                    <button 
                      onClick={handleFollowToggle}
                      disabled={toggleFollow.isPending}
                      className={`px-4 py-1.5 font-bold rounded-full transition-colors text-[15px] ${
                        user.isFollowing 
                          ? 'border border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10' 
                          : 'bg-foreground text-background hover:bg-foreground/90'
                      }`}
                    >
                      {user.isFollowing ? t('profile.unfollow') : t('profile.follow')}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h2 className="font-bold text-xl leading-tight">{user.displayName}</h2>
                <div className="text-muted-foreground text-[15px]">@{user.username}</div>
              </div>

              {user.bio && (
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-muted-foreground text-[15px]">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
                {user.birthday && (
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <span>{t('profile.birthday')} {format(new Date(user.birthday), 'PP')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>{t('profile.joined')} {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-3 text-[15px]">
                <button onClick={() => setActiveTab('following')} className="hover:underline">
                  <strong className="text-foreground">{user.followingCount}</strong> <span className="text-muted-foreground">{t('profile.following')}</span>
                </button>
                <button onClick={() => setActiveTab('followers')} className="hover:underline">
                  <strong className="text-foreground">{user.followersCount}</strong> <span className="text-muted-foreground">{t('profile.followers')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-border w-full">
            {[
              { id: 'posts', label: t('profile.posts') },
              { id: 'followers', label: t('profile.followers') },
              { id: 'following', label: t('profile.following') }
            ].map(tab => (
              <button 
                key={tab.id}
                className="flex-1 hover:bg-card/50 transition-colors pt-4 pb-0 flex justify-center"
                onClick={() => setActiveTab(tab.id as any)}
              >
                <div className={`pb-3 font-medium text-[15px] relative ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 pb-20 sm:pb-0">
            {activeTab === 'posts' && (
              isPostsLoading ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : postsPage && postsPage.length > 0 ? (
                postsPage.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="p-8 text-center text-muted-foreground">{t('profile.noPosts')}</div>
              )
            )}
            
            {(activeTab === 'followers' || activeTab === 'following') && (
              <div className="flex flex-col">
                {(() => {
                  const list = activeTab === 'followers' ? followers : following;
                  const isLoading = activeTab === 'followers' ? isFollowersLoading : isFollowingLoading;
                  
                  if (isLoading) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
                  if (!list || list.length === 0) return <div className="p-8 text-center text-muted-foreground">{activeTab === 'followers' ? t('profile.noFollowers') : t('profile.noFollowing')}</div>;
                  
                  return list.map(u => (
                    <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 p-4 border-b border-border hover:bg-card/50 transition-colors">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.displayName || ''} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {(u.displayName?.[0] || u.username?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-bold text-[15px] truncate hover:underline">{u.displayName}</span>
                        <span className="text-muted-foreground text-[15px] truncate">@{u.username}</span>
                      </div>
                    </Link>
                  ));
                })()}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-muted-foreground">User not found</div>
      )}
    </div>
  );
}