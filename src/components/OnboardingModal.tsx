import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { checkUsernameAvailable, saveUserProfile } from '../services/dbService';
import { compressImage } from '../utils/imageCompressor';
import { Sparkles, Check, X, Camera, User, Tag, HeartHandshake, Upload } from 'lucide-react';

interface OnboardingModalProps {
  userUid: string;
  defaultDisplayName: string;
  defaultAvatarUrl: string;
  onComplete: (profile: UserProfile) => void;
}

const FURSONA_PRESETS = [
  'Лис',
  'Вовк',
  'Котик',
  'Дракон',
  'Єнот',
  'Заєць',
  'Рись',
  'Ведмідь',
  'Грифон',
  'Інше'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userUid,
  defaultDisplayName,
  defaultAvatarUrl,
  onComplete,
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(defaultDisplayName || '');
  const [fursona, setFursona] = useState('Лис');
  const [customFursona, setCustomFursona] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300');
  
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check username uniqueness
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameValid(null);
      setUsernameError('');
      return;
    }
    if (clean.length < 3) {
      setUsernameValid(false);
      setUsernameError('Юзернейм має містити як мінімум 3 символи');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameValid(false);
      setUsernameError('Тільки латинські літери, цифри та _');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const isFree = await checkUsernameAvailable(clean, userUid);
      setIsCheckingUsername(false);
      if (isFree) {
        setUsernameValid(true);
        setUsernameError('');
      } else {
        setUsernameValid(false);
        setUsernameError('Цей юзернейм вже зайнятий!');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, userUid]);

  // Compress uploaded avatar
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingAvatar(true);
      const compressed = await compressImage(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Failed to compress avatar:', err);
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameValid || !displayName.trim()) return;

    setIsSaving(true);
    const finalFursona = fursona === 'Інше' ? (customFursona.trim() || 'Пухнастик') : fursona;

    const profile: UserProfile = {
      uid: userUid,
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
      avatarUrl: avatarUrl,
      bio: bio.trim(),
      fursona: finalFursona,
      onboarded: true,
      createdAt: new Date().toISOString(),
    };

    const success = await saveUserProfile(profile);
    setIsSaving(false);

    if (success) {
      onComplete(profile);
    } else {
      alert('Не вдалося зберегти профіль. Будь ласка, спробуйте ще раз.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-sky-100 dark:border-white/10 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-3 backdrop-blur-xs">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Ласкаво просимо в FurHubUA!</h2>
          <p className="text-sky-100 text-sm mt-1">
            Заповніть інформацію про вашого фурсону для створення акаунта
          </p>
        </div>


        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Аватарка"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-200 shadow-md"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-sky-500" />
              {isCompressingAvatar ? 'Стискаємо фото...' : 'Натисніть на іконку для завантаження аватарки'}
            </span>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
              Унікальний юзернейм (@username) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-medium text-sm">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="наприклад: fluffy_tail"
                className={`w-full pl-8 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 dark:text-slate-100 transition-colors focus:outline-hidden focus:ring-2 ${
                  usernameValid === true
                    ? 'border-emerald-500 focus:ring-emerald-200'
                    : usernameValid === false
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-slate-300 dark:border-white/20 focus:ring-sky-200 focus:border-sky-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isCheckingUsername ? (
                  <span className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                ) : usernameValid === true ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : usernameValid === false ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : null}
              </div>
            </div>
            {usernameError && (
              <p className="text-xs text-red-500 font-semibold mt-1">{usernameError}</p>
            )}
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
              Відображуване ім'я *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="наприклад: Рексі"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Fursona Species Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
              Вид вашого персонажа / Фурсона
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {FURSONA_PRESETS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFursona(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    fursona === item
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-sky-50 hover:border-sky-300'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {fursona === 'Інше' && (
              <input
                type="text"
                value={customFursona}
                onChange={(e) => setCustomFursona(e.target.value)}
                placeholder="Введіть свій унікальний вид..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-900 dark:text-slate-100 text-sm mt-1 focus:outline-hidden focus:ring-2 focus:ring-sky-200"
              />
            )}
          </div>

          {/* Bio Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
              Про себе (Біографічний опис)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Розкажіть декілька слів про ваші захоплення, фурсону або творчість..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-200 focus:border-sky-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!usernameValid || !displayName.trim() || isSaving}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              usernameValid && displayName.trim() && !isSaving
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HeartHandshake className="w-5 h-5" />
                <span>Завершити та увійти у спільноту</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
