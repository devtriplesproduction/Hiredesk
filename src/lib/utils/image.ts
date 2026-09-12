/**
 * Resizes and compresses an image on the client side using HTML5 Canvas.
 * Keeps output Base64 assets well below 100KB to fit safely under localStorage's 5MB limit.
 */
export async function compressImage(
  file: File,
  maxW: number = 400,
  maxH: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to raw base64 if canvas is not supported
          resolve(e.target?.result as string);
          return;
        }

        // Draw image onto canvas (downscales smoothly)
        ctx.drawImage(img, 0, 0, width, height);

        // Keep transparent background for PNGs, convert other formats to JPEG for excellent compression
        const type = file.type === "image/png" ? "image/png" : "image/jpeg";
        const quality = type === "image/jpeg" ? 0.75 : 0.8;
        
        try {
          const dataUrl = canvas.toDataURL(type, quality);
          resolve(dataUrl);
        } catch {
          // Fallback on canvas error
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
