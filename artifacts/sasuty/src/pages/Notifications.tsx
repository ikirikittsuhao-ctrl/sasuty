import { useEffect, useRef } from 'react';
import { useGetNotifications, useMarkNotificationsRead } from '@workspace/api-client-react';
import { Heart, MessageCircle, UserPlus, Repeat2 } from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function Notifications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationsRead();
  const prevCount = useRef(notifications?.filter(n => !n.isRead).length || 0);

  useEffect(() => {
    if (notifications?.some(n => !n.isRead)) {
      markRead.mutate();
    }
    
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
    if (unreadCount > prevCount.current) {
      toast({
        title: t('notifications.newNotifications'),
      });
    }
    prevCount.current = unreadCount;
  }, [notifications, markRead, toast, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold">{t('notifications.title')}</h1>
      </div>

      <div className="flex-1 pb-20 sm:pb-0">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="flex flex-col">
            {notifications.map((notif) => {
              const actor = notif.actor;
              const avatarFallback = actor?.displayName?.[0]?.toUpperCase() || actor?.username?.[0]?.toUpperCase() || '?';

              return (
                <div key={notif.id} className={`flex gap-4 p-4 border-b border-border transition-colors hover:bg-card/50 ${!notif.isRead ? 'bg-card/30' : ''}`}>
                  <div className="shrink-0 w-8 flex justify-end">
                    {notif.type === 'like' && <Heart className="w-7 h-7 text-destructive fill-destructive" />}
                    {notif.type === 'reply' && <MessageCircle className="w-7 h-7 text-primary fill-primary" />}
                    {notif.type === 'repost' && <Repeat2 className="w-7 h-7 text-green-500" />}
                    {notif.type === 'follow' && <UserPlus className="w-7 h-7 text-primary" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {actor && (
                      <Link href={`/profile/${actor.id}`}>
                        {actor.avatarUrl ? (
                          <img src={actor.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover mb-2" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground mb-2">
                            {avatarFallback}
                          </div>
                        )}
                      </Link>
                    )}

                    <div className="text-[15px] mb-2 leading-tight">
                      <Link href={`/profile/${actor?.id}`} className="font-bold hover:underline">
                        {actor?.displayName || actor?.username}
                      </Link>
                      {' '}
                      {notif.type === 'like' && t('notifications.liked')}
                      {notif.type === 'reply' && t('notifications.replied')}
                      {notif.type === 'repost' && t('notifications.reposted')}
                      {notif.type === 'follow' && t('notifications.followed')}
                      <span className="text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: false }).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                      </span>
                    </div>

                    {notif.post?.content && (
                      <Link href={`/post/${notif.post.id}`} className="text-[15px] text-muted-foreground line-clamp-3">
                        {notif.post.content}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {t('notifications.empty')}
          </div>
        )}
      </div>
    </div>
  );
}