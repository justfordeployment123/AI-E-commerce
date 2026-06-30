const MAX_BYTES = 1_048_576; // 1 MB — skip compression if under this
const MAX_DIM   = 1920;      // max px on longest side
const QUALITY   = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= MAX_BYTES) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIM);
          width  = MAX_DIM;
        } else {
          width  = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      // Preserve PNG for images that may have transparency; convert everything else to JPEG
      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          // If compression made it larger (can happen with PNG), send original
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          const ext  = outType === "image/png" ? ".png" : ".jpg";
          const name = file.name.replace(/\.[^.]+$/, ext);
          resolve(new File([blob], name, { type: outType, lastModified: Date.now() }));
        },
        outType,
        QUALITY,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
