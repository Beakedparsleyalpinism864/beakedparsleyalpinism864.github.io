import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { UserProfile, ActiveTab, Post } from './types';
import { getUserProfile, getPostsRealtime } from './services/dbService';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { OnboardingModal } from './components/OnboardingModal';
import { PostCard } from './components/PostCard';
import { CreatePostModal } from './components/CreatePostModal';
import { StickerMakerModal } from './components/StickerMakerModal';
import { StickerPickerModal } from './components/StickerPickerModal';
import { ChatSystem } from './components/ChatSystem';
import { SearchView } from './components/SearchView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';

import { Sparkles, PlusCircle, Compass, LogIn, Users, MessageSquare, Sticker as StickerIcon, ShieldCheck } from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Modals
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showStickerMaker, setShowStickerMaker] = useState(false);
  const [stickerMakerInitialImage, setStickerMakerInitialImage] = useState<string | undefined>();
  const [stickerPickerOnSelect, setStickerPickerOnSelect] = useState<((url: string) => void) | null>(null);
  const [directChatTargetId, setDirectChatTargetId] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile && profile.onboarded && !profile.deactivated) {
          setCurrentUser(profile);
          setNeedsOnboarding(false);
        } else {
          setCurrentUser(null);
          setNeedsOnboarding(true);
        }
      } else {
        setCurrentUser(null);
        setNeedsOnboarding(false);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to Posts Stream
  useEffect(() => {
    const unsub = getPostsRealtime((list) => {
      setPosts(list);
      setPostsLoading(false);
    });
    return () => unsub();
  }, []);

  // Google Auth Sign-in
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setNeedsOnboarding(false);
  };

  const handleOpenDirectChat = (authorUid: string, authorName: string, authorAvatar: string, authorUsername: string) => {
    setDirectChatTargetId(authorUid);
    setActiveTab('chats');
  };

  const handleOpenStickerMakerWithImage = (imageUrl: string) => {
    setStickerMakerInitialImage(imageUrl);
    setShowStickerMaker(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-[#111111]">Завантаження FurHubUA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col pb-20 lg:pb-0">
      
      {/* Mandatory Onboarding Modal for First-time Google Users */}
      {firebaseUser && needsOnboarding && (
        <OnboardingModal
          userUid={firebaseUser.uid}
          defaultDisplayName={firebaseUser.displayName || ''}
          defaultAvatarUrl={firebaseUser.photoURL || ''}
          onComplete={(profile) => {
            setCurrentUser(profile);
            setNeedsOnboarding(false);
          }}
        />
      )}

      {/* App Header */}
      <Header
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-8">
        
        {/* Navigation Sidebar / Mobile Bottom Nav */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreatePost={() => setShowCreatePost(true)}
          onOpenStickerMaker={() => {
            setStickerMakerInitialImage(undefined);
            setShowStickerMaker(true);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* Guest Landing Hero if not logged in */}
          {!currentUser && !needsOnboarding && (
            <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white rounded-3xl p-8 mb-8 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-sky-100" />
                  <span>Українська фуррі-соцмережа</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ласкаво просимо в FurHubUA!</h1>
                <p className="text-sky-50 text-sm leading-relaxed font-medium">
                  Публікуйте пости з авто-стисканням фото, спілкуйтесь у публічних групах та приватних чатах, створюйте унікальні стікери в TikTok-стилі!
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <button
                    onClick={handleGoogleSignIn}
                    className="px-5 py-3 bg-white text-sky-700 hover:bg-sky-50 font-black rounded-2xl shadow-lg flex items-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer"
                  >
                    <LogIn className="w-5 h-5 text-sky-600" />
                    <span>Увійти через Google</span>
                  </button>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center">
                  <Compass className="w-6 h-6 mx-auto mb-1 text-sky-100" />
                  <span className="text-xs font-bold block">Публічна стрічка</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center">
                  <MessageSquare className="w-6 h-6 mx-auto mb-1 text-sky-100" />
                  <span className="text-xs font-bold block">Чати & Групи</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center">
                  <StickerIcon className="w-6 h-6 mx-auto mb-1 text-sky-100" />
                  <span className="text-xs font-bold block">Стікермейкер</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-sky-100" />
                  <span className="text-xs font-bold block">Безпечно</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {currentUser && (
                <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-300"
                    />
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="w-full text-left px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-bold text-[#111111] transition-colors cursor-pointer"
                    >
                      Поділіться думками або артом з пухнастою спільнотою...
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Опублікувати</span>
                  </button>
                </div>
              )}

              {/* Feed Items */}
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <span className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-300 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-sky-600" />
                  </div>
                  <p className="text-base font-black text-[#111111]">Тут поки порожньо, стань першим! ✨</p>
                  <p className="text-xs font-extrabold text-[#111111]">Опублікуйте перший пост у соцмережі FurHubUA!</p>
                  {currentUser && (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Створити пост</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onOpenDirectChat={handleOpenDirectChat}
                      onOpenStickerMakerWithImage={handleOpenStickerMakerWithImage}
                      onOpenStickerPicker={(cb) => setStickerPickerOnSelect(() => cb)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {activeTab === 'search' && (
            <SearchView
              currentUser={currentUser}
              onOpenDirectChat={handleOpenDirectChat}
              onOpenStickerMakerWithImage={handleOpenStickerMakerWithImage}
              onOpenStickerPicker={(cb) => setStickerPickerOnSelect(() => cb)}
              onSelectGroupTab={() => setActiveTab('chats')}
            />
          )}

          {/* TAB 3: CHATS & GROUPS */}
          {activeTab === 'chats' && (
            currentUser ? (
              <ChatSystem
                currentUser={currentUser}
                activeChatIdParam={directChatTargetId}
                onOpenStickerPicker={(cb) => setStickerPickerOnSelect(() => cb)}
              />
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-sky-100 text-center text-slate-500 space-y-3">
                <MessageSquare className="w-10 h-10 text-sky-500 mx-auto" />
                <p className="text-sm font-bold">Будь ласка, увійдіть через Google для доступу до чатів</p>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  Увійти
                </button>
              </div>
            )
          )}

          {/* TAB 4: STICKERS */}
          {activeTab === 'stickers' && (
            <div className="bg-white p-8 rounded-2xl border border-sky-100 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl mx-auto flex items-center justify-center">
                <StickerIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Конструктор фуррі-стікерів (TikTok-style)</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Завантажуйте власні малюнки чи фото персонажів, додавайте кольорову обводку, текст-капшн та використовуйте їх в усіх чатах!
              </p>
              {currentUser ? (
                <button
                  onClick={() => {
                    setStickerMakerInitialImage(undefined);
                    setShowStickerMaker(true);
                  }}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Відкрити конструктор стікерів</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  Увійти через Google
                </button>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            currentUser ? (
              <ProfileView
                currentUser={currentUser}
                onOpenStickerMaker={() => {
                  setStickerMakerInitialImage(undefined);
                  setShowStickerMaker(true);
                }}
                onOpenSettings={() => setActiveTab('settings')}
                onOpenDirectChat={handleOpenDirectChat}
                onOpenStickerMakerWithImage={handleOpenStickerMakerWithImage}
                onOpenStickerPicker={(cb) => setStickerPickerOnSelect(() => cb)}
              />
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-sky-100 text-center text-slate-500 space-y-3">
                <p className="text-sm font-bold">Будь ласка, увійдіть через Google для доступу до профілю</p>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  Увійти
                </button>
              </div>
            )
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            currentUser ? (
              <SettingsView
                currentUser={currentUser}
                onProfileUpdated={(updated) => setCurrentUser(updated)}
                onAccountDeleted={handleSignOut}
              />
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-sky-100 text-center text-slate-500 space-y-3">
                <p className="text-sm font-bold">Увійдіть через Google для доступу до налаштувань</p>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-semibold"
                >
                  Увійти
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Global Modals */}
      {showCreatePost && currentUser && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setShowCreatePost(false)}
        />
      )}

      {showStickerMaker && currentUser && (
        <StickerMakerModal
          userUid={currentUser.uid}
          initialImageUrl={stickerMakerInitialImage}
          onClose={() => setShowStickerMaker(false)}
        />
      )}

      {stickerPickerOnSelect && currentUser && (
        <StickerPickerModal
          userUid={currentUser.uid}
          onSelectSticker={(url) => {
            stickerPickerOnSelect(url);
            setStickerPickerOnSelect(null);
          }}
          onClose={() => setStickerPickerOnSelect(null)}
          onOpenMaker={() => {
            setStickerMakerInitialImage(undefined);
            setShowStickerMaker(true);
          }}
        />
      )}
    </div>
  );
}
