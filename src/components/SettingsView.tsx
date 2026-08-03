import React, { useState } from 'react';
import { UserProfile, ThemeMode } from '../types';
import { saveUserProfile, deactivateOrDeleteAccount } from '../services/dbService';
import { compressImage } from '../utils/imageCompressor';
import { Settings, User, Bell, ShieldAlert, Camera, Save, Trash2, Check, Sun, Moon, Monitor, Palette } from 'lucide-react';

interface SettingsViewProps {
  currentUser: UserProfile;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onProfileUpdated: (updated: UserProfile) => void;
  onAccountDeleted: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  themeMode,
  onThemeChange,
  onProfileUpdated,
  onAccountDeleted,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [fursona, setFursona] = useState(currentUser.fursona || 'Лис');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyDMs, setNotifyDMs] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Danger Zone confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to compress avatar:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    const updated: UserProfile = {
      ...currentUser,
      displayName: displayName.trim(),
      fursona: fursona.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl,
    };

    const ok = await saveUserProfile(updated);
    setIsSaving(false);

    if (ok) {
      onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert('Помилка при збереженні налаштувань');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    const ok = await deactivateOrDeleteAccount(currentUser.uid);
    setIsDeleting(false);

    if (ok) {
      onAccountDeleted();
    } else {
      alert('Помилка при деактивації акаунта.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-sky-500 dark:text-sky-400" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Налаштування акаунта</h1>
        </div>
        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30">
            <Check className="w-4 h-4" />
            <span>Збережено!</span>
          </span>
        )}
      </div>

      {/* Theme Switcher Section */}
      <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
        <h2 className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <Palette className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <span>Тема оформлення (Theme)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Оберіть зручний режим відображення інтерфейсу FurHubUA:
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              themeMode === 'light'
                ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-102 font-bold'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-sky-300'
            }`}
          >
            <Sun className={`w-6 h-6 mb-2 ${themeMode === 'light' ? 'text-white' : 'text-amber-500'}`} />
            <span className="text-xs font-semibold">Світла</span>
            <span className="text-[10px] opacity-80 mt-0.5">За замовчуванням</span>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              themeMode === 'dark'
                ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-102 font-bold'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-sky-300'
            }`}
          >
            <Moon className={`w-6 h-6 mb-2 ${themeMode === 'dark' ? 'text-white' : 'text-indigo-400'}`} />
            <span className="text-xs font-semibold">Темна</span>
            <span className="text-[10px] opacity-80 mt-0.5">Для ночі</span>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              themeMode === 'system'
                ? 'bg-sky-500 text-white border-sky-500 shadow-md scale-102 font-bold'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-sky-300'
            }`}
          >
            <Monitor className={`w-6 h-6 mb-2 ${themeMode === 'system' ? 'text-white' : 'text-sky-500'}`} />
            <span className="text-xs font-semibold">Системна</span>
            <span className="text-[10px] opacity-80 mt-0.5">Авто-вибір</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg space-y-5">
        <h2 className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <User className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <span>Основна інформація профілю</span>
        </h2>

        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-sky-500/80 shadow-md"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full cursor-pointer shadow-md border border-white/20 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Фото профілю</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Автоматично стискається Canvas при завантаженні</p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Відображуване ім'я
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Username Read-only */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Юзернейм (@username)
          </label>
          <input
            type="text"
            disabled
            value={`@${currentUser.username}`}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm opacity-60 cursor-not-allowed font-medium"
          />
        </div>

        {/* Fursona */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Вид фурсони / Персонаж
          </label>
          <input
            type="text"
            value={fursona}
            onChange={(e) => setFursona(e.target.value)}
            placeholder="Лис, Вовк, Котик, Дракон..."
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Про себе
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-sky-500 outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Зберегти зміни</span>
            </>
          )}
        </button>
      </form>

      {/* Notifications Preferences */}
      <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
        <h2 className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
          <Bell className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <span>Сповіщення та приватність</span>
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl glass-card cursor-pointer border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Сповіщення про нові лайки</span>
            <input
              type="checkbox"
              checked={notifyLikes}
              onChange={(e) => setNotifyLikes(e.target.checked)}
              className="rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-sky-500 focus:ring-sky-400"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl glass-card cursor-pointer border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Сповіщення про коментарі</span>
            <input
              type="checkbox"
              checked={notifyComments}
              onChange={(e) => setNotifyComments(e.target.checked)}
              className="rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-sky-500 focus:ring-sky-400"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl glass-card cursor-pointer border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Сповіщення про особисті повідомлення (DMs)</span>
            <input
              type="checkbox"
              checked={notifyDMs}
              onChange={(e) => setNotifyDMs(e.target.checked)}
              className="rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-sky-500 focus:ring-sky-400"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/30 space-y-4 shadow-lg">
        <h2 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>Небезпечна зона (Danger Zone)</span>
        </h2>
        <p className="text-xs text-red-700 dark:text-red-300/80 leading-relaxed">
          Видалення чи деактивація акаунта призведе до деактивації вашого профілю у соціальній мережі FurHubUA та звільнення юзернейму.
        </p>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md border border-red-400/30 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Деактивувати / Видалити акаунт</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl shadow-2xl border border-red-500/30 p-6 space-y-4">
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl mx-auto flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Підтвердження видалення</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Ви дійсно бажаєте видалити акаунт <strong className="text-slate-900 dark:text-white">@{currentUser.username}</strong>? Цю дію неможливо скасувати.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/10"
              >
                Скасувати
              </button>
              <button
                onClick={handleDeleteAccountConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Так, видалити</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

