/** Vercel serverless request bodies are capped at ~4.5MB — compress before upload. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2048;

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
  if (file.size <= MAX_UPLOAD_BYTES && /^image\/jpe?g$/i.test(file.type)) {
    return file;
  }

  const img = await loadImageElement(file);
  const longestEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longestEdge > MAX_DIMENSION ? MAX_DIMENSION / longestEdge : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not prepare photo for upload');
  }

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.88;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('Photo is too large even after compression — try a closer crop or lower resolution.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
