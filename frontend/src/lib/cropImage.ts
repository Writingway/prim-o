import type { Area } from 'react-easy-crop';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Images are served same-origin (/api/uploads), so this keeps the canvas untainted.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = src;
  });
}

// Crops `src` to the pixel `area` as a square capped at 800px and returns a JPEG file ready to
// upload. Used by the admin image cropper (react-easy-crop).
export async function cropToFile(src: string, area: Area, name = 'offer.jpg'): Promise<File> {
  const image = await loadImage(src);
  const MAX = 800;
  const size = Math.min(Math.round(area.width), MAX);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non supporté');

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export image échoué'))),
      'image/jpeg',
      0.9,
    ),
  );
  return new File([blob], name, { type: 'image/jpeg' });
}
