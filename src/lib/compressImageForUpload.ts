import imageCompression from "browser-image-compression";

const MAX_IMAGE_DIMENSION = 2560;
const IMAGE_QUALITY = 0.9;

type ImageDimensions = {
  width: number;
  height: number;
};

async function readImageDimensions(file: File): Promise<ImageDimensions> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to read image dimensions."));
      image.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function compressImageForUpload(file: File): Promise<File> {
  const startedAt = performance.now();

  try {
    const before = await readImageDimensions(file);
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: MAX_IMAGE_DIMENSION,
      initialQuality: IMAGE_QUALITY,
      useWebWorker: true,
      preserveExif: true,
      fileType: file.type || undefined,
      // Do not chase a size target: preserving fine antique details has priority.
      maxSizeMB: Number.POSITIVE_INFINITY,
      maxIteration: 1,
      alwaysKeepResolution:
        Math.max(before.width, before.height) <= MAX_IMAGE_DIMENSION,
    });
    const requiresResize =
      Math.max(before.width, before.height) > MAX_IMAGE_DIMENSION;
    const output =
      requiresResize || compressed.size < file.size ? compressed : file;
    const after =
      output === file ? before : await readImageDimensions(output);

    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[KISHIB TIMING] compression: ${Math.round(performance.now() - startedAt)}ms`,
      );
      console.info("[KISHIB image compression] complete", {
        originalSize: formatBytes(file.size),
        compressedSize: formatBytes(output.size),
        originalDimensions: `${before.width}x${before.height}`,
        compressedDimensions: `${after.width}x${after.height}`,
        durationMs: Math.round(performance.now() - startedAt),
        usedOriginal: output === file,
      });
    }

    return output;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[KISHIB TIMING] compression: ${Math.round(performance.now() - startedAt)}ms`,
        { outcome: "fallback-to-original" },
      );
      console.warn("[KISHIB image compression] failed; using original", {
        originalSize: formatBytes(file.size),
        durationMs: Math.round(performance.now() - startedAt),
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return file;
  }
}
