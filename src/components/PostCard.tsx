import React, { useState, useEffect } from 'react';
import { Post, Comment, UserProfile } from '../types';
import { toggleLikePost, getUserLikesRealtime, getPostCommentsRealtime, addComment } from '../services/dbService';
import { Heart, MessageSquare, Pin, Sticker, Send, Share2, Sparkles } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: UserProfile | null;
  onOpenStickerMakerWithImage?: (imageUrl: string) => void;
  onOpenStickerPicker?: (onSelect: (url: string) => void) => void;
  onOpenDirectChat?: (authorUid: string, authorName: string, authorAvatar: string, authorUsername: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onOpenStickerMakerWithImage,
  onOpenStickerPicker,
  onOpenDirectChat,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Check if liked in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = getUserLikesRealtime(post.id, currentUser.uid, (liked) => {
      setIsLiked(liked);
    });
    return () => unsub();
  }, [post.id, currentUser]);

  // Real-time comments
  useEffect(() => {
    if (!showComments) return;
    const unsub = getPostCommentsRealtime(post.id, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [post.id, showComments]);

  const handleToggleLike = () => {
    if (!currentUser) return;
    toggleLikePost(
      post.id,
      currentUser.uid,
      post.authorUid,
      currentUser.displayName,
      currentUser.avatarUrl
    );
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!commentText.trim() && !selectedSticker)) return;

    setIsSubmittingComment(true);
    await addComment(
      post.id,
      {
        authorUid: currentUser.uid,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatarUrl,
        content: commentText.trim(),
        stickerUrl: selectedSticker || undefined,
      },
      post.authorUid
    );

    setCommentText('');
    setSelectedSticker(null);
    setIsSubmittingComment(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <article className={`glass-card rounded-3xl border shadow-lg overflow-hidden transition-all ${
      post.isPinned ? 'border-amber-400/50 border-l-4 border-l-amber-400 bg-amber-500/5' : 'border-white/10 hover:border-white/20'
    }`}>
      
      {/* Pinned Global Badge */}
      {post.isPinned && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-300 px-4 py-2 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
          <Pin className="w-4 h-4 fill-amber-300" />
          <span>Закріплено адміністрацією</span>
        </div>
      )}

      {/* Post Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={post.authorName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/80 dark:ring-sky-400/60 cursor-pointer"
            onClick={() => {
              if (onOpenDirectChat && currentUser && currentUser.uid !== post.authorUid) {
                onOpenDirectChat(post.authorUid, post.authorName, post.authorAvatar, post.authorUsername);
              }
            }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => {
                  if (onOpenDirectChat && currentUser && currentUser.uid !== post.authorUid) {
                    onOpenDirectChat(post.authorUid, post.authorName, post.authorAvatar, post.authorUsername);
                  }
                }}
                className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
              >
                {post.authorName}
              </span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">@{post.authorUsername}</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Stickerize Action Button if post has image */}
        {post.imageUrl && onOpenStickerMakerWithImage && (
          <button
            onClick={() => onOpenStickerMakerWithImage(post.imageUrl!)}
            className="flex items-center gap-1 px-3 py-1.5 glass hover:bg-slate-100 dark:hover:bg-white/10 text-sky-600 dark:text-sky-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/15 transition-colors shadow-2xs cursor-pointer"
            title="Перетворити фото на стікер"
          >
            <Sticker className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="hidden sm:inline">Зробити стікер</span>
          </button>
        )}
      </div>

      {/* Post Body Text */}
      {post.content && (
        <div className="px-4 sm:px-5 pb-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      )}

      {/* Post Compressed Image */}
      {post.imageUrl && (
        <div className="px-4 sm:px-5 pb-3">
          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 max-h-[480px] flex items-center justify-center">
            <img
              src={post.imageUrl}
              alt="Зображення поста"
              className="w-full object-cover max-h-[480px] hover:scale-101 transition-transform"
            />
          </div>
        </div>
      )}

      {/* Post Action Bar */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-white/5">
        <div className="flex items-center gap-4">
          
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              isLiked
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                : 'hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>{post.likesCount || 0}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              showComments
                ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30'
                : 'hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <span>{post.commentsCount || 0}</span>
          </button>
        </div>

        {/* Direct Chat Quick Button */}
        {currentUser && currentUser.uid !== post.authorUid && onOpenDirectChat && (
          <button
            onClick={() => onOpenDirectChat(post.authorUid, post.authorName, post.authorAvatar, post.authorUsername)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-white/5 hover:bg-sky-100 dark:hover:bg-white/10 font-semibold transition-colors border border-sky-200 dark:border-white/10 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Написати в ЛС</span>
          </button>
        )}
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 p-4 space-y-4">
          
          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
              Поки немає коментарів. Напишіть першим!
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 items-start glass p-3 rounded-2xl border border-slate-200 dark:border-white/10">
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{c.authorName}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(c.createdAt)}</span>
                    </div>
                    {c.content && <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{c.content}</p>}
                    {c.stickerUrl && (
                      <img src={c.stickerUrl} alt="Стікер" className="w-16 h-16 object-contain mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          {currentUser && (
            <form onSubmit={handleAddComment} className="space-y-2">
              {selectedSticker && (
                <div className="relative inline-block glass p-1 rounded-xl border border-sky-400/50">
                  <img src={selectedSticker} alt="Обраний стікер" className="w-12 h-12 object-contain" />
                  <button
                    type="button"
                    onClick={() => setSelectedSticker(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center shadow-md cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Залишити коментар..."
                  className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs focus:ring-1 focus:ring-sky-500 outline-none"
                />

                {/* Sticker Picker Button */}
                {onOpenStickerPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenStickerPicker((url) => setSelectedSticker(url))}
                    className="p-2 glass hover:bg-slate-100 dark:hover:bg-white/10 text-sky-500 dark:text-sky-400 rounded-xl transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                    title="Обрати стікер"
                  >
                    <Sticker className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingComment || (!commentText.trim() && !selectedSticker)}
                  className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-md border border-white/10 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </article>
  );
};
