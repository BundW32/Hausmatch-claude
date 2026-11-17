/** Verkleinert ein Bild im Browser auf ein quadratisches JPEG (Standard 256 px) und liefert eine Data-URL. */
export const resizeImage = (file: File, size = 256, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Bitte wählen Sie eine Bilddatei.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Das Bild konnte nicht verarbeitet werden.'));
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Das Bild konnte nicht gelesen werden.'));
    };
    img.src = url;
  });
