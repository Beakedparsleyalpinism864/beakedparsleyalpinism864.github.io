import React, { useState, useEffect, useRef } from 'react';
import { generateSticker, StickerOptions } from '../utils/imageCompressor';
import { saveSticker } from '../services/dbService';
import { Sticker as StickerIcon, Upload, Sparkles, Check, X, Sliders, Type } from 'lucide-react';

interface StickerMakerModalProps {
  userUid: string;
  initialImageUrl?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Океан', hex: '#0284c7' },
  { label: 'Блакитний', hex: '#38bdf8' },
  { label: 'Білий', hex: '#ffffff' },
  { label: 'Рожевий', hex: '#ec4899' },
  { label: 'Золотий', hex: '#eab308' },
  { label: 'Смарагдовий', hex: '#10b981' },
];

export const StickerMakerModal: React.FC<StickerMakerModalProps> = ({
  userUid,
  initialImageUrl,
  onClose,
  onSaved,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(
    initialImageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'
  );
  const [title, setTitle] = useState('Мій стікер');
  const [shape, setShape] = useState<'circle' | 'rounded' | 'square'>('rounded');
  const [strokeColor, setStrokeColor] = useState('#0284c7');
  const [strokeWidth, setStrokeWidth] = useState(14);
  const [caption, setCaption] = useState('Няв!');
  const [isPublic, setIsPublic] = useState(true);

  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Generate real-time sticker preview
  useEffect(() => {
    if (!imageSrc) return;
    let isCancelled = false;

    const runGen = async () => {
      setIsGenerating(true);
      try {
        const result = await generateSticker(imageSrc, {
          shape,
          strokeColor,
          strokeWidth,
          caption,
        });
        if (!isCancelled) {
          setPreviewDataUrl(result);
        }
      } catch (err) {
        console.error('Error generating sticker preview:', err);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    };

    runGen();
    return () => {
      isCancelled = true;
    };
  }, [imageSrc, shape, strokeColor, strokeWidth, caption]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageSrc(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!previewDataUrl || isSaving) return;
    setIsSaving(true);

    const docId = await saveSticker({
      creatorUid: userUid,
      title: title.trim() || 'Стікер',
      imageUrl: previewDataUrl,
      isPublic: isPublic,
    });

    setIsSaving(false);
    if (docId) {
      if (onSaved) onSaved();
      onClose();
    } else {
      alert('Не вдалося зберегти стікер. Спробуйте ще раз.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-6">
        
        {/* Header */}
        <div className="glass p-4 text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5 font-black text-lg">
            <StickerIcon className="w-6 h-6 text-sky-500 dark:text-sky-400" />
            <span>Конструктор стікерів та GIF</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Preview & Upload Grid */}
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center glass p-6 rounded-2xl border border-slate-200 dark:border-white/10">
            {/* Real-time Preview */}
            <div className="relative w-44 h-44 flex items-center justify-center bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner p-2">
              {isGenerating ? (
                <span className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              ) : previewDataUrl ? (
                <img src={previewDataUrl} alt="Попередній перегляд" className="max-w-full max-h-full object-contain" />
              ) : null}
              <span className="absolute -bottom-2.5 px-3 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-full shadow-md border border-white/10">
                Preview
              </span>
            </div>

            {/* Upload Selector */}
            <div className="flex flex-col items-center sm:items-start space-y-3">
              <label className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md border border-white/10 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Завантажити фото або GIF</span>
                <input type="file" accept="image/*,image/gif" onChange={handleFileChange} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs text-center sm:text-left">
                Завантажте фото, арт або GIF-анімацію фурсона для створення власного стікера!
              </p>
            </div>
          </div>


          {/* Controls Form */}
          <div className="space-y-4">
            
            {/* Title & Caption */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Назва стікера
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Мій супер стікер"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500 outline-none border border-slate-200 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Текст на стікері (Капшн)</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="наприклад: Няв! / Хуг!"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-sky-500 outline-none border border-slate-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Shape Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Форма стікера
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['rounded', 'circle', 'square'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setShape(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer ${
                      shape === s
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                        : 'glass text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {s === 'rounded' ? 'Закруглений' : s === 'circle' ? 'Круглий' : 'Квадратний'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Color Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-2">
                Колір обводки
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setStrokeColor(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform cursor-pointer ${
                      strokeColor === c.hex ? 'scale-110 ring-2 ring-sky-500 border-white' : 'border-slate-300 dark:border-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {strokeColor === c.hex && (
                      <Check className={`w-4 h-4 ${c.hex === '#ffffff' ? 'text-slate-900' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Width Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-1">
                <span>Товщина обводки</span>
                <span className="text-sky-600 dark:text-sky-400">{strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={28}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 glass border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-slate-800 text-sky-500 focus:ring-sky-400"
            />
            <span>Зробити стікер публічним для всіх</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isGenerating || !previewDataUrl}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border border-white/10 transition-colors cursor-pointer"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Зберегти стікер</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
