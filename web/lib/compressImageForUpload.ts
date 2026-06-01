/** Prepare listing photos for direct Supabase upload (bypasses Vercel body limit). */
const MAX_DIRECT_UPLOAD_BYTES = 15 * 1024 * 1024;

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

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not prepare photo for upload'));
      },
      'image/jpeg',
      quality
    );
  });
}

/** Convert HEIC/HEIF to JPEG at full resolution for AI + storage compatibility. */
async function convertToJpeg(file: File): Promise<File> {
  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not prepare photo for upload');
  }
  ctx.drawImage(img, 0, 0);
  const blob = await canvasToJpeg(canvas, 0.92);
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
}

export async function prepareImageForStorageUpload(file: File): Promise<{ file: File; contentType: string }> {
  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error('Photo must be less than 15MB. Try a closer crop or lower resolution in camera settings.');
  }

  if (isHeic(file)) {
    const converted = await convertToJpeg(file);
    return { file: converted, contentType: 'image/jpeg' };
  }

  const contentType = file.type || 'image/jpeg';
  return { file, contentType };
}

export async function uploadListingImageToStorage(
  file: File,
  upload: (path: string, body: File, options: { contentType: string }) => Promise<{ error: Error | null }>,
  getPublicUrl: (path: string) => string
): Promise<string> {
  const { file: uploadFile, contentType } = await prepareImageForStorageUpload(file);
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  const filename = `original-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  const { error } = await upload(filename, uploadFile, { contentType });
  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }
  return getPublicUrl(filename);
}
