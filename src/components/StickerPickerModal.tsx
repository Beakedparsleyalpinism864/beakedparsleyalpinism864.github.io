import React, { useState, useEffect } from 'react';
import { Sticker } from '../types';
import { getStickersRealtime } from '../services/dbService';
import { Sticker as StickerIcon, Plus, X, Sparkles, TrendingUp, Bookmark } from 'lucide-react';

interface StickerPickerModalProps {
  userUid: string;
  onSelectSticker: (stickerUrl: string) => void;
  onClose: () => void;
  onOpenMaker: () => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  userUid,
  onSelectSticker,
  onClose,
  onOpenMaker,
}) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'trending'>('my');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = getStickersRealtime(userUid, (list) => {
      setStickers(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userUid]);

  const myStickers = stickers.filter((st) => st.creatorUid === userUid);
  const trendingStickers = stickers.filter((st) => st.isPublic && st.creatorUid !== userUid);
  const displayedStickers = activeTab === 'my' ? myStickers : trendingStickers;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <StickerIcon className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <span>Пакунок стікерів</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'my'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Збережені ({myStickers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'trending'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Трендові ({trendingStickers.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedStickers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 bg-sky-500/20 text-sky-500 dark:text-sky-400 rounded-2xl mx-auto flex items-center justify-center mb-3 border border-sky-400/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {activeTab === 'my' ? 'У вас ще немає збережених стікерів' : 'Трендових стікерів поки немає'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Створіть свій перший унікальний фуррі-стікер у конструкторі!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenMaker();
                }}
                className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md border border-white/10"
              >
                <Plus className="w-4 h-4" />
                <span>Створити стікер</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {displayedStickers.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    onSelectSticker(st.imageUrl);
                    onClose();
                  }}
                  className="group p-2 rounded-2xl glass hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-sky-400/50 transition-all flex items-center justify-center hover:scale-105 shadow-md aspect-square"
                >
                  <img
                    src={st.imageUrl}
                    alt="Стікер"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 glass flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">Всього: {stickers.length}</span>
          <button
            onClick={() => {
              onClose();
              onOpenMaker();
            }}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Створити стікер</span>
          </button>
        </div>
      </div>
    </div>
  );
};

