"use client";

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toBlob } from "html-to-image";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const A4_RATIO = A4_HEIGHT_PT / A4_WIDTH_PT;

type ShareFileInput = {
  blob: Blob;
  fileName: string;
  title: string;
  text: string;
  dialogTitle: string;
  mimeType: string;
  action?: "share" | "pdf" | "print";
};

type ReportExportStage =
  | "DOM"
  | "Fonts"
  | "Images"
  | "Canvas"
  | "PDF"
  | "Blob"
  | "Filesystem"
  | "Native Share"
  | "Web Share"
  | "Download";

function logReportExportError(stage: ReportExportStage, error: unknown) {
  console.error(`[Report Export][${stage}]`, error);
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export function buildReportFileName(extension: "png" | "pdf") {
  const date = new Date().toISOString().slice(0, 10);
  return sanitizeFileName(`kishib-report-${date}.${extension}`);
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(blob);
  });
}

function isRemoteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isLocalAssetUrl(value: string) {
  return value.startsWith("/");
}

function makeReportImagePlaceholder(label = "KISHIB") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720" viewBox="0 0 1080 720">
    <rect width="1080" height="720" fill="#efe3d2"/>
    <rect x="60" y="60" width="960" height="600" rx="36" fill="#f7f0e6" stroke="#d2b98f" stroke-width="4"/>
    <text x="540" y="330" text-anchor="middle" font-family="serif" font-size="54" font-weight="700" fill="#735f4b">${label}</text>
    <text x="540" y="398" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#9a7441">Image unavailable</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to convert image"));
    reader.readAsDataURL(blob);
  });
}

async function resolveImageForCanvas(src: string) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (!isRemoteHttpUrl(src) && !isLocalAssetUrl(src)) return src;

  try {
    const response = await fetch(src, {
      mode: isRemoteHttpUrl(src) ? "cors" : "same-origin",
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Image fetch failed with ${response.status}`);
    }

    return await blobToDataUrl(await response.blob());
  } catch (error) {
    logReportExportError("Images", { src, error });
    return makeReportImagePlaceholder("KISHIB");
  }
}

async function decodeImage(image: HTMLImageElement) {
  if (image.decode) {
    await image.decode();
    return;
  }

  if (image.complete && image.naturalWidth > 0) return;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image failed to load"));
  });
}

export async function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      const originalSrc = image.currentSrc || image.src || image.getAttribute("src") || "";

      try {
        image.crossOrigin = image.crossOrigin || "anonymous";

        const safeSrc = await resolveImageForCanvas(originalSrc);
        if (safeSrc && safeSrc !== image.src) {
          image.src = safeSrc;
        }

        await decodeImage(image);

        if (!image.naturalWidth) {
          image.src = makeReportImagePlaceholder("KISHIB");
          await decodeImage(image);
        }
      } catch (error) {
        logReportExportError("Images", { src: originalSrc, error });
        image.src = makeReportImagePlaceholder("KISHIB");

        try {
          await decodeImage(image);
        } catch (placeholderError) {
          logReportExportError("Images", placeholderError);
        }
      }
    }),
  );
}

async function waitForReportAssets(report: HTMLElement) {
  if (!report) {
    throw new Error("Report export DOM is missing");
  }

  try {
    await document.fonts?.ready;
  } catch (error) {
    logReportExportError("Fonts", error);
  }

  await waitForImages(report);
}

export async function createReportPngBlob(report: HTMLElement) {
  try {
    await waitForReportAssets(report);
  } catch (error) {
    logReportExportError("DOM", error);
    throw error;
  }

  const width = Math.max(794, report.scrollWidth || 794);
  const height = Math.max(report.scrollHeight, report.offsetHeight, 1123);

  let blob: Blob | null = null;

  try {
    blob = await toBlob(report, {
      backgroundColor: "#f7f0e6",
      cacheBust: true,
      pixelRatio: Math.max(2, 1080 / width),
      width,
      height,
      style: {
        transform: "none",
        opacity: "1",
      },
    });
  } catch (error) {
    logReportExportError("Canvas", error);
    throw error;
  }

  if (!blob) throw new Error("Unable to create report image");
  return blob;
}

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, "\\$&");
}

function makePdfFromJpegPages(pages: Uint8Array[]) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  function write(value: string | Uint8Array) {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  }

  function startObject(id: number) {
    offsets[id] = length;
    write(`${id} 0 obj\n`);
  }

  write("%PDF-1.4\n%KISHIB\n");

  startObject(1);
  write("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  write(
    `<< /Type /Pages /Kids ${pages
      .map((_, index) => `${3 + index * 3} 0 R`)
      .join(" ")} /Count ${pages.length} >>\nendobj\n`,
  );

  pages.forEach((jpegBytes, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const imageName = `Im${index + 1}`;
    const content = `q\n${A4_WIDTH_PT} 0 0 ${A4_HEIGHT_PT} 0 0 cm\n/${imageName} Do\nQ\n`;

    startObject(pageObject);
    write(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>\nendobj\n`,
    );

    startObject(imageObject);
    write(
      `<< /Type /XObject /Subtype /Image /Width 1240 /Height ${Math.round(
        1240 * A4_RATIO,
      )} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    );
    write(jpegBytes);
    write("\nendstream\nendobj\n");

    startObject(contentObject);
    const contentBytes = encoder.encode(content);
    write(`<< /Length ${contentBytes.length} >>\nstream\n`);
    write(contentBytes);
    write("endstream\nendobj\n");
  });

  const infoObject = 3 + pages.length * 3;
  startObject(infoObject);
  write(
    `<< /Title (${escapePdfText("KISHIB Report")}) /Creator (${escapePdfText(
      "KISHIB",
    )}) >>\nendobj\n`,
  );

  const xrefOffset = length;
  write(`xref\n0 ${infoObject + 1}\n0000000000 65535 f \n`);
  for (let objectId = 1; objectId <= infoObject; objectId += 1) {
    write(`${String(offsets[objectId] || 0).padStart(10, "0")} 00000 n \n`);
  }
  write(
    `trailer\n<< /Size ${infoObject + 1} /Root 1 0 R /Info ${infoObject} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

async function createA4JpegPagesFromPngBlob(blob: Blob) {
  const image = new Image();
  image.decoding = "async";
  const objectUrl = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to load report image"));
      image.src = objectUrl;
    });

    const pageWidth = 1240;
    const pageHeight = Math.round(pageWidth * A4_RATIO);
    const scale = image.naturalWidth ? pageWidth / image.naturalWidth : 1;
    const sourcePageHeight = Math.floor(pageHeight / scale);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create PDF canvas");

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    const pages: Uint8Array[] = [];
    let sourceY = 0;

    while (sourceY < image.naturalHeight) {
      const sliceHeight = Math.min(sourcePageHeight, image.naturalHeight - sourceY);
      context.fillStyle = "#f7f0e6";
      context.fillRect(0, 0, pageWidth, pageHeight);
      context.drawImage(
        image,
        0,
        sourceY,
        image.naturalWidth,
        sliceHeight,
        0,
        0,
        pageWidth,
        Math.round(sliceHeight * scale),
      );
      pages.push(dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)));
      sourceY += sliceHeight;
    }

    return pages.length ? pages : [dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92))];
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function createReportPdfBlob(report: HTMLElement) {
  try {
    const pngBlob = await createReportPngBlob(report);
    const jpegPages = await createA4JpegPagesFromPngBlob(pngBlob);
    return makePdfFromJpegPages(jpegPages);
  } catch (error) {
    logReportExportError("PDF", error);
    throw error;
  }
}

async function shareNativeFile(input: ShareFileInput) {
  let writtenFile: { uri: string };

  try {
    const base64 = await blobToBase64(input.blob);
    writtenFile = await Filesystem.writeFile({
      path: input.fileName,
      data: base64,
      directory: Directory.Cache,
    });
  } catch (error) {
    logReportExportError("Filesystem", error);
    throw error;
  }

  try {
    await Share.share({
      title: input.title,
      text: input.text,
      files: [writtenFile.uri],
      dialogTitle: input.dialogTitle,
    });
  } catch (error) {
    logReportExportError("Native Share", error);
    throw error;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
}

export async function shareOrDownloadFile(input: ShareFileInput) {
  if (Capacitor.isNativePlatform()) {
    await shareNativeFile(input);
    return;
  }

  const file = new File([input.blob], input.fileName, { type: input.mimeType });
  const shareData = { title: input.title, text: input.text, files: [file] };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      logReportExportError("Web Share", error);
      throw error;
    }
  }

  try {
    downloadBlob(input.blob, input.fileName);
  } catch (error) {
    logReportExportError("Download", error);
    throw error;
  }
}
