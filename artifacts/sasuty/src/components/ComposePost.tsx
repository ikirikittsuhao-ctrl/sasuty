import React, { useState, useRef } from 'react';
import { useCreatePost, useCreateReply } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

export function ComposePost({ replyToId, placeholder }: { replyToId?: number, placeholder?: string }) {
  const { t } = useTranslation();
  const placeholderText = placeholder || t('compose.placeholder');
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const createPost = useCreatePost();
  const createReply = useCreateReply();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 280) return;

    if (replyToId) {
      createReply.mutate({ id: replyToId, data: { content: content.trim() } }, {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${replyToId}/replies`] });
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${replyToId}`] });
        }
      });
    } else {
      createPost.mutate({ data: { content: content.trim() } }, {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        }
      });
    }
  };

  const avatarFallback = user?.user_metadata?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.avatarUrl;

  return (
    <div className="flex gap-4 p-4 border-b border-border">
      <div className="shrink-0 pt-1">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Me" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold">
            {avatarFallback}
          </div>
        )}
      </div>
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholderText}
            className="w-full bg-transparent text-xl border-none outline-none resize-none min-h-[50px] placeholder:text-muted-foreground overflow-hidden"
            maxLength={280}
            rows={content.split('\n').length > 1 ? content.split('\n').length : 2}
            data-testid="input-compose"
          />
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
            </div>
            <div className="flex items-center gap-4">
              {content.length > 0 && (
                <span className={`text-sm ${content.length > 260 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {content.length}/280
                </span>
              )}
              <button
                type="submit"
                disabled={!content.trim() || content.length > 280 || createPost.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-5 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="button-post"
              >
                {replyToId ? t('post.reply') : t('compose.postBtn')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ComposeModal({ open, onClose, replyToId }: { open: boolean, onClose: () => void, replyToId?: number }) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const createPost = useCreatePost();
  const queryClient = useQueryClient();

  if (!open) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, { upsert: true });

      if (error) {
        if (error.message.includes('daily_image_limit') || error.message.includes('429')) {
          setUploadError(t('compose.dailyImageLimit'));
        } else {
          setUploadError(error.message);
        }
      } else if (data) {
        const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
        setImageUrl(publicUrlData.publicUrl);
      }
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageUrl && !linkUrl) || content.length > 280) return;

    createPost.mutate({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        linkUrl: linkUrl || undefined,
        linkTitle: linkTitle || undefined,
        linkDescription: linkDescription || undefined,
      }
    }, {
      onSuccess: () => {
        setContent('');
        setImageUrl('');
        setLinkUrl('');
        setLinkTitle('');
        setLinkDescription('');
        setShowLinkForm(false);
        queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
        if (replyToId) {
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${replyToId}/replies`] });
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${replyToId}`] });
        }
        onClose();
      }
    });
  };

  const avatarFallback = user?.user_metadata?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 bg-background/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <div className="flex gap-4">
            <div className="shrink-0">
              {avatar ? (
                <img src={avatar} alt="Me" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold">
                  {avatarFallback}
                </div>
              )}
            </div>
            
            <form id="compose-form" onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={replyToId ? t('compose.replyPlaceholder') : t('compose.placeholder')}
                className="w-full bg-transparent text-xl border-none outline-none resize-none min-h-[100px] placeholder:text-muted-foreground"
                maxLength={280}
              />

              {imageUrl && (
                <div className="relative rounded-2xl overflow-hidden mt-2">
                  <button 
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 backdrop-blur-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img src={imageUrl} alt="Upload preview" className="w-full max-h-80 object-cover" />
                </div>
              )}

              {uploadError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl mt-2">
                  {uploadError}
                  <div className="mt-2 text-muted-foreground text-xs">
                    You can input an image URL instead:
                    <input 
                      type="url" 
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1 bg-background border border-border rounded px-2 py-1"
                    />
                  </div>
                </div>
              )}

              {showLinkForm && (
                <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-xl border border-border mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-muted-foreground">{t('compose.addLink')}</span>
                    <button type="button" onClick={() => {setShowLinkForm(false); setLinkUrl(''); setLinkTitle(''); setLinkDescription('');}} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder={t('compose.linkUrl')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" />
                  <input type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder={t('compose.linkTitle')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" />
                  <input type="text" value={linkDescription} onChange={e => setLinkDescription(e.target.value)} placeholder={t('compose.linkDescription')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="p-3 border-t border-border flex items-center justify-between bg-card mt-auto">
          <div className="flex items-center gap-1 text-primary pl-12">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-primary/10 transition-colors"
              title={t('compose.addImage')}
              disabled={isUploading}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            
            <button 
              type="button"
              onClick={() => setShowLinkForm(!showLinkForm)}
              className="p-2 rounded-full hover:bg-primary/10 transition-colors"
              title={t('compose.addLink')}
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {content.length > 0 && (
              <span className={`text-sm ${content.length > 260 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/280
              </span>
            )}
            <button
              form="compose-form"
              type="submit"
              disabled={(!content.trim() && !imageUrl && !linkUrl) || content.length > 280 || createPost.isPending || isUploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-5 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {replyToId ? t('post.reply') : t('compose.postBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}