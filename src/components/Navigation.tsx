import React from 'react';
import { ActiveTab } from '../types';
import { Compass, Search, MessageSquare, User, Settings, PlusCircle, Sticker } from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreatePost: () => void;
  onOpenStickerMaker?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreatePost,
}) => {
  const navItems = [
    { id: 'feed' as ActiveTab, label: 'Стрічка', icon: Compass },
    { id: 'search' as ActiveTab, label: 'Пошук', icon: Search },
    { id: 'chats' as ActiveTab, label: 'Чати & Групи', icon: MessageSquare },
    { id: 'profile' as ActiveTab, label: 'Профіль', icon: User },
    { id: 'settings' as ActiveTab, label: 'Налаштування', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white rounded-3xl p-4 min-h-[calc(100vh-6rem)] sticky top-20 shadow-xl border border-slate-200">
        <div className="space-y-2 mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md border border-sky-400'
                    : 'text-[#111111] hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#111111]'}`} />
                <span className={isActive ? 'text-white' : 'text-[#111111]'}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Action Button */}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <button
            onClick={onOpenCreatePost}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all border border-sky-400 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>Створити пост</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-2xl backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-xs transition-colors cursor-pointer ${
                isActive ? 'text-sky-600 font-black' : 'text-[#111111] font-bold hover:text-black'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-sky-100 text-sky-600' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-[#111111]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-sky-600 font-black' : 'text-[#111111] font-bold'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

