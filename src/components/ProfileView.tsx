import React, { useState, useEffect } from 'react';
import { UserProfile, Post, Sticker } from '../types';
import { getPostsRealtime, getStickersRealtime, deleteSticker } from '../services/dbService';
import { PostCard } from './PostCard';
import { User, Sticker as StickerIcon, Compass, Sparkles, Plus, Settings, AlertTriangle, Trash2 } from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  onOpenStickerMaker: () => void;
  onOpenSettings: () => void;
  onOpenDirectChat: (authorUid: string, authorName: string, authorAvatar: string, authorUsername: string) => void;
  onOpenStickerMakerWithImage: (imageUrl: string) => void;
  onOpenStickerPicker: (onSelect: (url: string) => void) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenStickerMaker,
  onOpenSettings,
  onOpenDirectChat,
  onOpenStickerMakerWithImage,
  onOpenStickerPicker,
}) => {
  const [tab, setTab] = useState<'posts' | 'stickers'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userStickers, setUserStickers] = useState<Sticker[]>([]);

  // Real-time user posts
  useEffect(() => {
    const unsub = getPostsRealtime((allPosts) => {
      setUserPosts(allPosts.filter((p) => p.authorUid === currentUser.uid));
    });
    return () => unsub();
  }, [currentUser.uid]);

  // Real-time user stickers
  useEffect(() => {
    const unsub = getStickersRealtime(currentUser.uid, (stickers) => {
      setUserStickers(stickers.filter((s) => s.creatorUid === currentUser.uid));
    });
    return () => unsub();
  }, [currentUser.uid]);

  const handleDeleteSticker = async (stickerId: string) => {
    if (confirm('Ви впевнені, що хочете видалити цей стікер?')) {
      await deleteSticker(stickerId);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Card Header */}
      <div className="glass rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Cover Banner */}
        <div className="h-40 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 relative">
          <button
            onClick={onOpenSettings}
            className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-md rounded-xl border border-white/20 transition-colors cursor-pointer"
            title="Налаштування акаунта"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
              alt={currentUser.displayName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-500 shadow-xl bg-slate-900"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">{currentUser.displayName}</h1>
                <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-semibold rounded-full border border-sky-300 dark:border-sky-400/30">
                  {currentUser.fursona || 'Фуррі'}
                </span>
              </div>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium mt-0.5">@{currentUser.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStickerMaker}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border border-white/10 transition-colors cursor-pointer"
            >
              <StickerIcon className="w-4 h-4" />
              <span>Створити стікер</span>
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-2 glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/15 transition-colors cursor-pointer"
            >
              Налаштування
            </button>
          </div>
        </div>

        {/* Bio */}
        {currentUser.bio && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentUser.bio}
          </div>
        )}

        {/* Profile Tabs */}
        <div className="flex border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          <button
            onClick={() => setTab('posts')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              tab === 'posts'
                ? 'border-sky-500 text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-white/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Мої пости ({userPosts.length})</span>
          </button>
          <button
            onClick={() => setTab('stickers')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              tab === 'stickers'
                ? 'border-sky-500 text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-white/10'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <StickerIcon className="w-4 h-4" />
            <span>Мої стікери ({userStickers.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'posts' ? (
        userPosts.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-2">
            <div className="w-12 h-12 bg-sky-500/20 text-sky-500 dark:text-sky-400 rounded-2xl mx-auto flex items-center justify-center border border-sky-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Тут поки порожньо ✨</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ви ще не створили жодного поста</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUser={currentUser}
                onOpenDirectChat={onOpenDirectChat}
                onOpenStickerMakerWithImage={onOpenStickerMakerWithImage}
                onOpenStickerPicker={onOpenStickerPicker}
              />
            ))}
          </div>
        )
      ) : userStickers.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-3">
          <div className="w-12 h-12 bg-sky-500/20 text-sky-500 dark:text-sky-400 rounded-2xl mx-auto flex items-center justify-center border border-sky-400/30">
            <StickerIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Тут поки порожньо ✨</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Створіть свій власний стікерпак у TikTok-стилі!</p>
          <button
            onClick={onOpenStickerMaker}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md border border-white/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Створити перший стікер</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {userStickers.map((st) => (
            <div key={st.id} className="glass-card p-3 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center group relative shadow-md">
              <img src={st.imageUrl} alt={st.title} className="w-28 h-28 object-contain" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-2 truncate w-full text-center">
                {st.title}
              </span>
              <button
                onClick={() => handleDeleteSticker(st.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-600 transition-opacity shadow-md cursor-pointer"
                title="Видалити стікер"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
