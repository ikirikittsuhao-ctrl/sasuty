import { useListPosts } from '@workspace/api-client-react';
import { PostCard } from '@/components/PostCard';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type FeedTab = 'forYou' | 'following';

function Feed({ feed }: { feed: FeedTab }) {
  const { t } = useTranslation();
  const { data: postsPage, isLoading } = useListPosts(
    { feed },
    { query: { queryKey: [`/api/posts`, feed] } }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const posts = postsPage?.posts ?? [];
  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {feed === 'following' ? t('feed.noFollowingPosts') : t('feed.noPostsYet')}
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20 sm:pb-0">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FeedTab>('forYou');

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <h1 className="text-xl font-bold px-4 py-3 sm:hidden">{t('nav.home')}</h1>
        <div className="flex w-full">
          {([
            { id: 'forYou', label: t('feed.forYou') },
            { id: 'following', label: t('feed.following') },
          ] as const).map(tab => (
            <button
              key={tab.id}
              className="flex-1 hover:bg-card/50 transition-colors pt-4 pb-0 flex justify-center"
              onClick={() => setActiveTab(tab.id)}
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
      </div>

      <Feed key={activeTab} feed={activeTab} />
    </div>
  );
}
