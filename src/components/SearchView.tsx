import React, { useState, useEffect } from 'react';
import { UserProfile, Post, Group } from '../types';
import { searchPublicContent } from '../services/dbService';
import { Search, User, Compass, Users, MessageSquare, Send, Sparkles } from 'lucide-react';
import { PostCard } from './PostCard';

interface SearchViewProps {
  currentUser: UserProfile | null;
  onOpenDirectChat: (authorUid: string, authorName: string, authorAvatar: string, authorUsername: string) => void;
  onOpenStickerMakerWithImage: (imageUrl: string) => void;
  onOpenStickerPicker: (onSelect: (url: string) => void) => void;
  onSelectGroupTab: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  currentUser,
  onOpenDirectChat,
  onOpenStickerMakerWithImage,
  onOpenStickerPicker,
  onSelectGroupTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'users' | 'posts' | 'groups'>('all');
  const [results, setResults] = useState<{ users: UserProfile[]; posts: Post[]; groups: Group[] }>({
    users: [],
    posts: [],
    groups: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setResults({ users: [], posts: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchPublicContent(term);
      setResults(res);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const totalResults = results.users.length + results.posts.length + results.groups.length;

  return (
    <div className="space-y-6">
      
      {/* Search Header */}
      <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <Search className="w-5 h-5 text-sky-500 dark:text-sky-400" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Пошук у фуррі-мережі FurHubUA</h2>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введіть юзернейм, ім'я фурсони, опис поста або назву групи..."
            className="w-full pl-11 pr-10 py-3 rounded-xl glass-input text-sm focus:ring-1 focus:ring-sky-500 outline-none"
          />
          <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3.5" />
          {isSearching && (
            <span className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin absolute right-3.5 top-4" />
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: `Усі (${totalResults})` },
            { id: 'users', label: `Акаунти (${results.users.length})` },
            { id: 'posts', label: `Пости (${results.posts.length})` },
            { id: 'groups', label: `Групи (${results.groups.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filter === t.id
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                  : 'glass text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {!searchTerm.trim() ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-2">
          <div className="w-12 h-12 bg-sky-500/20 text-sky-500 dark:text-sky-400 rounded-2xl mx-auto flex items-center justify-center border border-sky-400/30">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Введіть запит для пошуку</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Шукайте публічні акаунти, пости чи групи у спільноті</p>
        </div>
      ) : totalResults === 0 && !isSearching ? (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/10 text-center space-y-2">
          <div className="w-12 h-12 bg-sky-500/20 text-sky-500 dark:text-sky-400 rounded-2xl mx-auto flex items-center justify-center border border-sky-400/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">За вашим запитом нічого не знайдено ✨</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Спробуйте змінити ключові слова "{searchTerm}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* User Results */}
          {(filter === 'all' || filter === 'users') && results.users.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Знайдені акаунти ({results.users.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.users.map((u) => (
                  <div key={u.uid} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.displayName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-500/80"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{u.displayName}</div>
                        <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">@{u.username} • {u.fursona || 'Фуррі'}</div>
                      </div>
                    </div>

                    {currentUser && currentUser.uid !== u.uid && (
                      <button
                        onClick={() => onOpenDirectChat(u.uid, u.displayName, u.avatarUrl, u.username)}
                        className="px-3 py-1.5 glass hover:bg-slate-100 dark:hover:bg-white/10 text-sky-600 dark:text-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-white/15 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                        <span>Написати</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups Results */}
          {(filter === 'all' || filter === 'groups') && results.groups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Знайдені групи ({results.groups.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.groups.map((g) => (
                  <div key={g.id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center font-bold border border-sky-400/30">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{g.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{g.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={onSelectGroupTab}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md border border-white/10 transition-colors cursor-pointer"
                    >
                      Відкрити
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {(filter === 'all' || filter === 'posts') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Знайдені пости ({results.posts.length})</span>
              </h3>
              <div className="space-y-4">
                {results.posts.map((p) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
