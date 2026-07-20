import { useGetTrending } from '@workspace/api-client-react';
import { PostCard } from '@/components/PostCard';
import { Hash } from 'lucide-react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function Trending() {
  const { t } = useTranslation();
  const { data: trending, isLoading } = useGetTrending();

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 py-3 gap-6">
        <h1 className="text-xl font-bold">{t('trending.title')}</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trending ? (
        <div className="pb-20 sm:pb-0">
          {trending.hashtags?.length > 0 && (
            <div className="p-4 border-b border-border bg-card/30">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" /> {t('trending.trending')}
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {trending.hashtags.map((tg, i) => (
                  <Link 
                    key={i} 
                    href={`/search?q=${encodeURIComponent(tg.tag)}`}
                    className="flex justify-between items-center p-3 rounded-xl hover:bg-card/50 transition-colors"
                  >
                    <div>
                      <div className="text-sm text-muted-foreground">{i + 1} · {t('trending.trending')}</div>
                      <div className="font-bold text-[15px] mt-0.5">{tg.tag}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{tg.count} {t('trending.posts')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {trending.posts?.length > 0 && (
            <div>
              <div className="p-4 pb-2 font-bold border-b border-border">{t('trending.hotPosts')}</div>
              {trending.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No trending data available.
        </div>
      )}
    </div>
  );
}