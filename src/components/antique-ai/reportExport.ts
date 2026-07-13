"use client";

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toBlob, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

const STORY_REPORT_WIDTH = 1080;
const STORY_REPORT_HEIGHT = 1920;

type ShareFileInput = {
  blob: Blob;
  fileName: string;
  title: string;
  text: string;
  dialogTitle: string;
  mimeType: string;
  action?: "share" | "pdf" | "print";
};

type ReportExportStageName =
  | "export_started"
  | "platform_detected"
  | "report_dom_not_found"
  | "export_dom_found"
  | "fonts_ready"
  | "fonts_failed"
  | "images_ready"
  | "images_failed"
  | "canvas_failed"
  | "canvas_created"
  | "image_data_created"
  | "pdf_generation_failed"
  | "pdf_data_created"
  | "blob_read_failed"
  | "file_write_failed"
  | "file_written"
  | "file_uri_failed"
  | "native_uri_resolved"
  | "native_share_failed"
  | "share_sheet_opened"
  | "web_share_failed"
  | "download_failed";

type ReportExportPlatform = {
  platform: string;
  isNative: boolean;
};

type PdfJpegPage = {
  imageData: string;
  width: number;
  height: number;
};

const REPORT_STAGE_LABELS: Partial<Record<ReportExportStageName, string>> = {
  export_started: "[REPORT][1] export started",
  platform_detected: "[REPORT][2] platform detected",
  export_dom_found: "[REPORT][3] export DOM found",
  fonts_ready: "[REPORT][4] fonts ready",
  images_ready: "[REPORT][5] images ready",
  canvas_created: "[REPORT][6] canvas created",
  image_data_created: "[REPORT][7] image/pdf data created",
  pdf_data_created: "[REPORT][7] image/pdf data created",
  file_written: "[REPORT][8] file written",
  native_uri_resolved: "[REPORT][9] native URI resolved",
  share_sheet_opened: "[REPORT][10] share sheet opened",
};

function getReportPlatform(): ReportExportPlatform {
  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
  };
}

function getErrorDetails(error: unknown) {
  return {
    error,
    message:
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : String(error || ""),
    stack:
      error && typeof error === "object" && "stack" in error
        ? String((error as { stack?: unknown }).stack || "")
        : "",
  };
}

function logReportStage(stage: ReportExportStageName, details?: Record<string, unknown>) {
  const label = REPORT_STAGE_LABELS[stage] || `[REPORT][${stage}]`;
  console.info(label, {
    ...getReportPlatform(),
    ...(details || {}),
  });
}

function logReportExportError(
  stage: ReportExportStageName,
  error: unknown,
  details?: Record<string, unknown>,
) {
  console.error(`[REPORT][FAILED][${stage}]`, {
    ...getReportPlatform(),
    ...getErrorDetails(error),
    ...(details || {}),
  });
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export function buildReportFileName(extension: "jpg" | "png" | "pdf") {
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
    logReportExportError("images_failed", error, { src: redactImageSource(src) });
    return makeReportImagePlaceholder("KISHIB");
  }
}

function redactImageSource(src: string) {
  if (src.startsWith("data:")) return src.slice(0, 42);
  if (src.startsWith("blob:")) return "blob:";
  return src;
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
    images.map(async (image, index) => {
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
        logReportExportError("images_failed", error, {
          index,
          src: redactImageSource(originalSrc),
          kind: originalSrc.startsWith("data:")
            ? "data"
            : originalSrc.startsWith("blob:")
              ? "blob"
              : isRemoteHttpUrl(originalSrc)
                ? "remote"
                : isLocalAssetUrl(originalSrc)
                  ? "local"
                  : "unknown",
        });
        image.src = makeReportImagePlaceholder("KISHIB");

        try {
          await decodeImage(image);
        } catch (placeholderError) {
          logReportExportError("images_failed", placeholderError, { index, placeholder: true });
        }
      }
    }),
  );
}

async function waitForReportAssets(report: HTMLElement) {
  if (!report) {
    logReportExportError("report_dom_not_found", new Error("Report export DOM is missing"));
    throw new Error("Report export DOM is missing");
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const rect = report.getBoundingClientRect();
  const computedStyle = getComputedStyle(report);
  const textLength = report.innerText.trim().length;
  const domDetails = {
    width: rect.width,
    height: rect.height,
    scrollWidth: report.scrollWidth,
    scrollHeight: report.scrollHeight,
    textLength,
  };

  console.info("[REPORT_LAYOUT]", {
    rectWidth: rect.width,
    rectHeight: rect.height,
    scrollWidth: report.scrollWidth,
    scrollHeight: report.scrollHeight,
    direction: computedStyle.direction,
    fontFamily: computedStyle.fontFamily,
    devicePixelRatio: window.devicePixelRatio,
  });
  console.info("[REPORT_FONT]", computedStyle.fontFamily);

  if (!rect.width || !rect.height || !report.scrollWidth || !report.scrollHeight || !textLength) {
    logReportExportError("report_dom_not_found", new Error("Report export DOM has zero size"), domDetails);
    throw new Error("pdf_content_empty");
  }

  logReportStage("export_dom_found", domDetails);

  try {
    await document.fonts?.ready;
    logReportStage("fonts_ready");
  } catch (error) {
    logReportExportError("fonts_failed", error);
  }

  await waitForImages(report);
  logReportStage("images_ready");
}

function getReportRasterSize(report: HTMLElement, pixelRatioOverride?: number) {
  const width = report.scrollWidth || report.offsetWidth;
  const height = report.scrollHeight || report.offsetHeight;
  const isNative = Capacitor.isNativePlatform();
  const pixelRatio = pixelRatioOverride ?? (isNative ? 1.5 : 2);

  return { width, height, pixelRatio };
}

async function createReportImageBlob(
  report: HTMLElement,
  imageType: "jpeg" | "png",
  pixelRatioOverride?: number,
) {
  logReportStage("export_started", { output: imageType });
  logReportStage("platform_detected");

  try {
    await waitForReportAssets(report);
  } catch (error) {
    throw error;
  }

  const { width, height, pixelRatio } = getReportRasterSize(report, pixelRatioOverride);

  let blob: Blob | null = null;

  try {
    const options = {
      backgroundColor: "#f7f0e6",
      cacheBust: true,
      pixelRatio,
      width,
      height,
      style: {
        transform: "none",
        opacity: "1",
      },
    };

    if (imageType === "jpeg") {
      const dataUrl = await toJpeg(report, { ...options, quality: 0.97 });
      blob = new Blob([dataUrlToBytes(dataUrl)], { type: "image/jpeg" });
    } else {
      blob = await toBlob(report, options);
    }

    logReportStage("canvas_created", { width, height, pixelRatio, type: blob?.type });
    console.info("[REPORT_QUALITY]", {
      scale: pixelRatio,
      canvasWidth: Math.round(width * pixelRatio),
      canvasHeight: Math.round(height * pixelRatio),
      imageMime: blob?.type,
      imageDataLength: blob?.size,
    });
  } catch (error) {
    logReportExportError("canvas_failed", error, { width, height, pixelRatio });
    throw error;
  }

  if (!blob) throw new Error("Unable to create report image");
  logReportStage("image_data_created", { size: blob.size, type: blob.type });
  return blob;
}

export async function createReportPngBlob(report: HTMLElement) {
  return createReportImageBlob(report, Capacitor.isNativePlatform() ? "jpeg" : "png");
}

export async function createShareImageBlob(report: HTMLElement) {
  return createReportImageBlob(
    report,
    Capacitor.isNativePlatform() ? "jpeg" : "png",
    1,
  );
}

async function createStoryJpegPagesFromBlob(blob: Blob) {
  const image = new Image();
  image.decoding = "async";
  const objectUrl = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to load report image"));
      image.src = objectUrl;
    });

    const pageWidth = STORY_REPORT_WIDTH;
    const pageHeight = STORY_REPORT_HEIGHT;
    const scale = image.naturalWidth ? pageWidth / image.naturalWidth : 1;
    const sourcePageHeight = Math.floor(pageHeight / scale);
    const pages: PdfJpegPage[] = [];
    let sourceY = 0;
    const sliceCount = Math.ceil(image.naturalHeight / sourcePageHeight);

    console.info("[PDF][1] source canvas dimensions", {
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    console.info("[PDF][2] slice count", { count: sliceCount });

    while (sourceY < image.naturalHeight) {
      const pageIndex = pages.length;
      const sliceHeight = Math.min(sourcePageHeight, image.naturalHeight - sourceY);
      const renderedHeight = Math.max(1, Math.round(sliceHeight * scale));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = pageWidth;
      pageCanvas.height = renderedHeight;
      const context = pageCanvas.getContext("2d");
      if (!context || !pageCanvas.width || !pageCanvas.height || !sliceHeight) {
        throw new Error("pdf_content_empty");
      }

      context.fillStyle = "#f7f0e6";
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        image,
        0,
        sourceY,
        image.naturalWidth,
        sliceHeight,
        0,
        0,
        pageWidth,
        renderedHeight,
      );
      const imageData = pageCanvas.toDataURL("image/jpeg", 0.95);
      console.info("[PDF][3] slice dimensions", {
        pageIndex,
        sourceWidth: image.naturalWidth,
        sourceHeight: sliceHeight,
        canvasWidth: pageCanvas.width,
        canvasHeight: pageCanvas.height,
      });
      console.info("[PDF][4] jpeg data length", { pageIndex, length: imageData.length });
      if (imageData.length <= 1_000) throw new Error("pdf_content_empty");

      pages.push({
        imageData,
        width: pageCanvas.width,
        height: pageCanvas.height,
      });
      sourceY += sliceHeight;
    }

    if (!pages.length) throw new Error("pdf_content_empty");
    return {
      pages,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function createReportPdfBlob(report: HTMLElement) {
  try {
    logReportStage("export_started", { output: "pdf" });
    logReportStage("platform_detected");
    const rasterBlob = await createReportPngBlob(report);
    const raster = await createStoryJpegPagesFromBlob(rasterBlob);
    if (!raster.sourceWidth || !raster.sourceHeight || !raster.pages.length) {
      throw new Error("pdf_content_empty");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [STORY_REPORT_WIDTH, STORY_REPORT_HEIGHT],
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    raster.pages.forEach((page, pageIndex) => {
      if (!page.width || !page.height || page.imageData.length <= 1_000) {
        throw new Error("pdf_content_empty");
      }
      if (pageIndex > 0) pdf.addPage();
      const imageHeight = Math.min(pageHeight, (page.height * pageWidth) / page.width);
      pdf.addImage(page.imageData, "JPEG", 0, 0, pageWidth, imageHeight, undefined, "FAST");
      console.info("[PDF][5] page added", { pageIndex, pageWidth, imageHeight });
    });

    const pagesCount = pdf.getNumberOfPages();
    console.info("[PDF][6] pdf pages count", { pages: pagesCount });
    if (!pagesCount) throw new Error("pdf_content_empty");

    const pdfArrayBuffer = pdf.output("arraybuffer");
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const headerBytes = new TextDecoder("ascii").decode(pdfBytes.slice(0, 8));
    const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
    console.info("[PDF][7] pdf blob size", { size: pdfBlob.size });
    console.info("[PDF][8] pdf header bytes", { headerBytes });

    if (
      !headerBytes.startsWith("%PDF-") ||
      pdfBlob.type !== "application/pdf" ||
      pdfBlob.size <= 10 * 1024
    ) {
      throw new Error("pdf_content_empty");
    }

    logReportStage("pdf_data_created", { pages: raster.pages.length, size: pdfBlob.size });
    return pdfBlob;
  } catch (error) {
    logReportExportError("pdf_generation_failed", error);
    throw error;
  }
}

async function shareNativeFile(input: ShareFileInput) {
  let nativeUri: string;

  try {
    const base64 = await blobToBase64(input.blob);
    await Filesystem.writeFile({
      path: input.fileName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    logReportStage("file_written", {
      path: input.fileName,
      directory: Directory.Cache,
      size: input.blob.size,
      mimeType: input.mimeType,
    });
  } catch (error) {
    logReportExportError("file_write_failed", error, {
      path: input.fileName,
      directory: Directory.Cache,
    });
    throw error;
  }

  try {
    const uriResult = await Filesystem.getUri({
      path: input.fileName,
      directory: Directory.Cache,
    });
    nativeUri = uriResult.uri;
    logReportStage("native_uri_resolved", {
      path: input.fileName,
      directory: Directory.Cache,
      uri: nativeUri,
    });
  } catch (error) {
    logReportExportError("file_uri_failed", error, {
      path: input.fileName,
      directory: Directory.Cache,
    });
    throw error;
  }

  try {
    await Share.share({
      title: input.title,
      text: input.text,
      files: [nativeUri],
      dialogTitle: input.dialogTitle,
    });
    logReportStage("share_sheet_opened", {
      path: input.fileName,
      uri: nativeUri,
      action: input.action,
    });
  } catch (error) {
    logReportExportError("native_share_failed", error, {
      path: input.fileName,
      uri: nativeUri,
      action: input.action,
    });
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
      logReportExportError("web_share_failed", error);
      throw error;
    }
  }

  try {
    downloadBlob(input.blob, input.fileName);
  } catch (error) {
    logReportExportError("download_failed", error);
    throw error;
  }
}
