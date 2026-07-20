import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useToggleLike, useToggleRepost, useCreateReply, type Post, getGetPostRepliesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat2, Share, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const toggleLike = useToggleLike();
  const toggleRepost = useToggleRepost();
  const createReply = useCreateReply();
  const { toast } = useToast();

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // If this is a repost entry, show the original post with a repost banner
  const isRepostEntry = !!post.repostOfId && !!post.repostOf;
  const displayPost = isRepostEntry ? (post.repostOf as Post) : post;
  const reposter = isRepostEntry ? post.user : null;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike.mutate({ id: displayPost.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${displayPost.id}`] });
      },
    });
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRepost.mutate({ id: displayPost.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${displayPost.id}`] });
      },
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + '/post/' + displayPost.id);
    toast({ description: t('post.linkCopied') });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    createReply.mutate({ id: displayPost.id, data: { content: replyContent } }, {
      onSuccess: () => {
        setReplyContent('');
        setShowReplyBox(false);
        queryClient.invalidateQueries({ queryKey: getGetPostRepliesQueryKey(displayPost.id) });
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        queryClient.invalidateQueries({ queryKey: [`/api/posts/${displayPost.id}`] });
      },
    });
  };

  const handleCardClick = () => {
    setLocation(`/post/${displayPost.id}`);
  };

  /** Render text with #hashtag and @mention as links */
  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split(/(#[a-zA-Z0-9_\u3041-\u9fff]+|@[a-zA-Z0-9_]+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Link key={i} href={`/search?q=${encodeURIComponent(part)}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}>
            {part}
          </Link>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link key={i} href={`/search?q=${encodeURIComponent(part)}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}>
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const user = displayPost.user;
  const avatarFallback = user?.displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  const timeAgo = displayPost.createdAt
    ? formatDistanceToNow(new Date(displayPost.createdAt), { addSuffix: false })
        .replace('about ', '').replace(' minutes', 'm').replace(' minute', 'm')
        .replace(' hours', 'h').replace(' hour', 'h')
        .replace(' days', 'd').replace(' day', 'd')
        .replace(' months', 'mo').replace(' month', 'mo')
        .replace(' years', 'y').replace(' year', 'y')
    : '';

  const isLiked = displayPost.isLiked ?? false;
  const isReposted = displayPost.isReposted ?? false;

  return (
    <motion.article
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col border-b border-border transition-colors hover:bg-card/30"
      data-testid={`card-post-${post.id}`}
    >
      {/* Repost banner */}
      {reposter && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0 text-sm text-muted-foreground font-semibold ml-10">
          <Repeat2 className="w-4 h-4" />
          <Link href={`/profile/${reposter.id}`} onClick={e => e.stopPropagation()}
            className="hover:underline">
            {reposter.displayName || reposter.username}
          </Link>
          <span>{t('post.repostedLabel')}</span>
        </div>
      )}

      <div className="flex gap-3 p-4 cursor-pointer" onClick={handleCardClick}>
        {/* Avatar */}
        <Link href={`/profile/${user?.id}`} onClick={e => e.stopPropagation()} className="shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName || ''} className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground hover:opacity-90 transition-opacity">
              {avatarFallback}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            <Link href={`/profile/${user?.id}`} onClick={e => e.stopPropagation()}
              className="font-bold text-[15px] hover:underline truncate max-w-[140px]">
              {user?.displayName || user?.username}
            </Link>
            <span className="text-muted-foreground text-[15px] truncate max-w-[120px]">@{user?.username}</span>
            <span className="text-muted-foreground text-[13px] shrink-0">· {timeAgo}</span>
          </div>

          {/* Content */}
          {displayPost.content && (
            <p className="text-[15px] leading-normal whitespace-pre-wrap break-words mb-2">
              {renderContent(displayPost.content)}
            </p>
          )}

          {/* Image */}
          {displayPost.imageUrl && (
            <img src={displayPost.imageUrl} alt="" className="w-full max-h-80 object-cover rounded-2xl mb-2 border border-border" />
          )}

          {/* Link card */}
          {displayPost.linkUrl && (
            <a href={displayPost.linkUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="block border border-border rounded-2xl overflow-hidden hover:bg-card/80 transition-colors mb-2">
              <div className="p-3">
                <div className="text-xs text-muted-foreground mb-1 truncate">{displayPost.linkUrl}</div>
                {displayPost.linkTitle && <div className="font-semibold text-[14px] truncate">{displayPost.linkTitle}</div>}
                {displayPost.linkDescription && <div className="text-muted-foreground text-[13px] line-clamp-2 mt-0.5">{displayPost.linkDescription}</div>}
              </div>
            </a>
          )}

          {/* Actions */}
          {!compact && (
            <div className="flex items-center gap-1 mt-1 -ml-2 text-muted-foreground">
              {/* Reply */}
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                aria-label="Reply" onClick={e => { e.stopPropagation(); setShowReplyBox(v => !v); }}>
                <div className="p-1.5 rounded-full group-hover:bg-primary/10">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </div>
                <span className="text-sm tabular-nums">{displayPost.repliesCount > 0 ? displayPost.repliesCount : ''}</span>
              </button>

              {/* Repost */}
              <button className={`flex items-center gap-1.5 transition-colors group ${isReposted ? 'text-green-500' : 'hover:text-green-500'}`}
                aria-label="Repost" onClick={handleRepost}>
                <div className="p-1.5 rounded-full group-hover:bg-green-500/10">
                  <Repeat2 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-sm tabular-nums">{displayPost.repostsCount > 0 ? displayPost.repostsCount : ''}</span>
              </button>

              {/* Like */}
              <button className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-destructive' : 'hover:text-destructive'}`}
                aria-label="Like" onClick={handleLike}>
                <div className="p-1.5 rounded-full group-hover:bg-destructive/10">
                  <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-sm tabular-nums">{displayPost.likesCount > 0 ? displayPost.likesCount : ''}</span>
              </button>

              {/* Views */}
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors group" aria-label="Views">
                <div className="p-1.5 rounded-full group-hover:bg-primary/10">
                  <Eye className="w-[18px] h-[18px]" />
                </div>
                <span className="text-sm tabular-nums">{displayPost.viewsCount > 0 ? displayPost.viewsCount : ''}</span>
              </button>

              {/* Share */}
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors group ml-auto"
                aria-label="Share" onClick={handleShare}>
                <div className="p-1.5 rounded-full group-hover:bg-primary/10">
                  <Share className="w-[18px] h-[18px]" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline reply box */}
      {showReplyBox && (
        <div className="px-4 pb-4 pl-[60px]">
          <form onSubmit={handleReplySubmit} className="flex flex-col gap-2">
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
              placeholder={t('compose.replyPlaceholder')} maxLength={280} autoFocus
              className="w-full bg-transparent text-[15px] border-b border-border outline-none resize-none min-h-[48px] placeholder:text-muted-foreground focus:border-primary transition-colors py-2" />
            <div className="flex justify-end items-center gap-2">
              <span className="text-xs text-muted-foreground">{280 - replyContent.length}</span>
              <button type="button" onClick={() => { setShowReplyBox(false); setReplyContent(''); }}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full transition-colors">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={!replyContent.trim() || createReply.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-4 py-1.5 text-sm disabled:opacity-50 transition-colors">
                {t('post.reply')}
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.article>
  );
}
