/** Vercel serverless request bodies are capped at ~4.5MB — always compress for storage + AI. */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 1600;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo format'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not compress photo'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function compressImageForUpload(file: File): Promise<File> {
  const img = await loadImageElement(file);
  let width = Math.max(1, img.naturalWidth);
  let height = Math.max(1, img.naturalHeight);

  const longestEdge = Math.max(width, height);
  if (longestEdge > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longestEdge;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const render = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not prepare photo for upload');
    }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  };

  let canvas = render(width, height);
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  while (blob.size > MAX_UPLOAD_BYTES && Math.max(width, height) > 800) {
    width = Math.max(800, Math.round(width * 0.85));
    height = Math.max(800, Math.round(height * 0.85));
    canvas = render(width, height);
    quality = 0.75;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Photo is too large even after compression — try a closer crop or lower resolution.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export async function uploadListingImageToStorage(
  file: File,
  upload: (path: string, body: File, options: { contentType: string }) => Promise<{ error: Error | null }>,
  getPublicUrl: (path: string) => string
): Promise<string> {
  const compressed = await compressImageForUpload(file);
  const filename = `original-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { error } = await upload(filename, compressed, { contentType: 'image/jpeg' });
  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }
  return getPublicUrl(filename);
}
