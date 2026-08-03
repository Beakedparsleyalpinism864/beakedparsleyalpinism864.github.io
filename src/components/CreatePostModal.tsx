import React, { useState } from 'react';
import { UserProfile } from '../types';
import { createPost } from '../services/dbService';
import { compressImage } from '../utils/imageCompressor';
import { Send, Image as ImageIcon, X, Pin, Sparkles, Upload } from 'lucide-react';

interface CreatePostModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onPostCreated?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
}) => {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setIsPublishing(true);
    let compressedImageUrl = '';

    if (selectedFile) {
      try {
        compressedImageUrl = await compressImage(selectedFile, 1200, 1200, 0.82);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    const newPostId = await createPost({
      authorUid: currentUser.uid,
      authorName: currentUser.displayName,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      content: content.trim(),
      imageUrl: compressedImageUrl || undefined,
      isPinned: isPinned,
    });

    setIsPublishing(false);

    if (newPostId) {
      if (onPostCreated) onPostCreated();
      onClose();
    } else {
      alert('Помилка при публікації поста. Спробуйте ще раз.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/5">
          <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
            <Sparkles className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            <span>Створити новий пост</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Author Chip */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/80"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.displayName}</div>
              <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">@{currentUser.username}</div>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            rows={4}
            required={!selectedFile}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Про що думаєте? Поділіться думками, артом чи новинами з пухнастою спільнотою..."
            className="w-full p-3.5 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-sky-500 outline-none resize-none border border-slate-200 dark:border-white/10"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/30 max-h-56 flex items-center justify-center">
              <img src={imagePreview} alt="Попередній перегляд" className="max-h-56 object-contain" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors border border-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions & Checkbox */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-3 py-1.5 glass hover:bg-slate-100 dark:hover:bg-white/10 text-sky-600 dark:text-sky-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-slate-200 dark:border-white/15">
                <ImageIcon className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <span>Додати фото</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-sky-500 focus:ring-sky-400"
                />
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                <span>Закріпити пост</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPublishing || (!content.trim() && !selectedFile)}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all border border-white/10 ${
                content.trim() || selectedFile
                  ? 'bg-sky-500 hover:bg-sky-600 cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {isPublishing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Опублікувати</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
