import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSearch, getSearchQueryKey } from '@workspace/api-client-react';
import { PostCard } from '@/components/PostCard';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function Search() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');
  
  // Update query state if URL changes
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [location]);

  const { data: results, isLoading } = useSearch(
    { q: query, type: 'all' },
    { query: { enabled: query.trim().length > 0, queryKey: getSearchQueryKey({ q: query, type: 'all' }) } }
  );

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md flex flex-col pt-2">
        <div className="flex items-center px-4 gap-4 h-12">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors sm:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="search" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-card/50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-full py-2 pl-10 pr-4 text-[15px] outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex border-b border-border w-full mt-2">
          {[
            { id: 'posts', label: t('search.posts') },
            { id: 'users', label: t('search.users') }
          ].map(tab => (
            <button 
              key={tab.id}
              className="flex-1 hover:bg-card/50 transition-colors pt-3 pb-0 flex justify-center"
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
      </div>

      <div className="flex-1 pb-20 sm:pb-0">
        {!query.trim() ? (
          <div className="p-8 text-center text-muted-foreground">
            {t('search.typeToSearch')}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'posts' ? (
          results?.posts?.length ? (
            results.posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-muted-foreground font-medium">
              {t('search.noResults')}
            </div>
          )
        ) : (
          results?.users?.length ? (
            results.users.map(u => (
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
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground font-medium">
              {t('search.noResults')}
            </div>
          )
        )}
      </div>
    </div>
  );
}