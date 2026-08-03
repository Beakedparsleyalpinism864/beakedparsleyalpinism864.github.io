/**
 * Canvas-based image compression and sticker rendering utility for furhubua.
 */

export async function compressImage(
  source: File | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadHandler = () => {
      let width = img.width;
      let height = img.height;

      // Calculate scale ratio while keeping aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context non-supported'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

export interface StickerOptions {
  shape?: 'circle' | 'rounded' | 'square';
  strokeColor?: string;
  strokeWidth?: number;
  caption?: string;
  badgeColor?: string;
}

export async function generateSticker(
  imageSrc: string,
  options: StickerOptions = {}
): Promise<string> {
  const {
    shape = 'rounded',
    strokeColor = '#0284c7', // Sky blue default accent
    strokeWidth = 12,
    caption = '',
    badgeColor = '#38bdf8'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const size = 512; // Standard HD sticker size
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2d context'));
        return;
      }

      ctx.clearRect(0, 0, size, size);

      // Save baseline for clipping
      ctx.save();
      const margin = strokeWidth + 10;
      const drawSize = size - margin * 2;

      // Draw clip shape
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(size / 2, size / 2 - (caption ? 20 : 0), drawSize / 2, 0, Math.PI * 2);
      } else if (shape === 'rounded') {
        const radius = 40;
        const x = margin;
        const y = margin - (caption ? 15 : 0);
        ctx.roundRect(x, y, drawSize, drawSize, radius);
      } else {
        ctx.rect(margin, margin - (caption ? 15 : 0), drawSize, drawSize);
      }
      ctx.clip();

      // Draw original image scaled inside clip
      const scale = Math.max(drawSize / img.width, drawSize / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2 - (caption ? 15 : 0);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // Draw outer sticker border stroke
      if (strokeWidth > 0) {
        ctx.save();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(size / 2, size / 2 - (caption ? 20 : 0), drawSize / 2, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
          const radius = 40;
          ctx.roundRect(margin, margin - (caption ? 15 : 0), drawSize, drawSize, radius);
        } else {
          ctx.rect(margin, margin - (caption ? 15 : 0), drawSize, drawSize);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw caption text if present
      if (caption.trim()) {
        ctx.save();
        ctx.fillStyle = badgeColor;
        const textHeight = 44;
        const textY = size - margin - textHeight;

        ctx.beginPath();
        ctx.roundRect(margin, textY, drawSize, textHeight, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(caption.trim(), size / 2, textY + textHeight / 2);
        ctx.restore();
      }

      // Return sticker image PNG DataURL
      resolve(canvas.toDataURL('image/png', 0.95));
    };

    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}
