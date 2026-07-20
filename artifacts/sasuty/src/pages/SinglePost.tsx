import { useParams, Link } from 'wouter';
import { useGetPost, useGetPostReplies, useRecordView } from '@workspace/api-client-react';
import { PostCard } from '@/components/PostCard';
import { ComposePost } from '@/components/ComposePost';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';

export default function SinglePost() {
  const { t } = useTranslation();
  const params = useParams();
  const id = Number(params.id);

  const { data: post, isLoading: isPostLoading } = useGetPost(id);
  const { data: replies, isLoading: isRepliesLoading } = useGetPostReplies(id);
  
  const recordView = useRecordView();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (id && !hasRecordedView.current) {
      recordView.mutate({ id });
      hasRecordedView.current = true;
    }
  }, [id, recordView]);

  return (
    <div className="flex flex-col w-full min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 py-3 gap-6">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-card/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('post.post', 'Post')}</h1>
      </div>

      {isPostLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : post ? (
        <>
          <PostCard post={post} />
          
          <ComposePost replyToId={post.id} placeholder={t('compose.replyPlaceholder')} />

          {isRepliesLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : replies && replies.length > 0 ? (
            <div className="flex flex-col pb-20 sm:pb-0">
              {replies.map((reply) => (
                <PostCard key={reply.id} post={reply} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('post.noReplies', 'No replies yet.')}
            </div>
          )}
        </>
      ) : (
        <div className="p-8 text-center text-muted-foreground font-medium">
          {t('post.notFound')}
        </div>
      )}
    </div>
  );
}