import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import AntiqueReportDocument from "./AntiqueReportDocument";
import type { AnalysisResult, Locale } from "./types";

type ShareLabels = {
  result: string;
  age: string;
  value: string;
  material: string;
  origin: string;
  lookup: string;
  description: string;
  condition: string;
  authenticity: string;
  priceReason: string;
  valueDrivers: string;
  valueReducers: string;
  similar: string;
  similarHint: string;
  soon: string;
  neededPhotos: string;
  followUp: string;
  confidence: string;
  notice: string;
};

type CreateShareImageArgs = {
  result: AnalysisResult;
  imagePreview: string | null;
  labels: ShareLabels;
  locale: Locale;
};

const SHARE_CAPTURE_WIDTH = 1080;
const SHARE_BACKGROUND = "#f7f0e6";
const UNSUPPORTED_COLOR_FUNCTION = /(?:color-mix|oklab|oklch|lab|lch)\(/i;
const COLOR_PROPERTIES = [
  ["background-color", "transparent"],
  ["background-image", "none"],
  ["border-block-color", "#e5d4ba"],
  ["border-bottom-color", "#e5d4ba"],
  ["border-color", "#e5d4ba"],
  ["border-inline-color", "#e5d4ba"],
  ["border-left-color", "#e5d4ba"],
  ["border-right-color", "#e5d4ba"],
  ["border-top-color", "#e5d4ba"],
  ["box-shadow", "none"],
  ["caret-color", "#241913"],
  ["color", "#241913"],
  ["column-rule-color", "#e5d4ba"],
  ["fill", "#241913"],
  ["outline-color", "#e5d4ba"],
  ["stroke", "#241913"],
  ["text-decoration-color", "currentColor"],
  ["text-emphasis-color", "#241913"],
  ["text-shadow", "none"],
  ["-webkit-text-fill-color", "#241913"],
  ["-webkit-text-stroke-color", "#241913"],
] as const;

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create share image"));
          return;
        }

        resolve(blob);
      },
      "image/png",
      0.96,
    );
  });
}

async function waitForReportImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
  );
}

function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const value =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;
  const parsed = Number.parseInt(value, 16);

  if (Number.isNaN(parsed)) return null;

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function replaceOklabColorMix(value: string) {
  return value.replace(
    /color-mix\(in\s+oklab,\s*(#[0-9a-f]{3,8})\s+([0-9.]+)%?,\s*transparent\)/gi,
    (_match, hex: string, percent: string) => {
      const rgb = hexToRgb(hex);
      const alpha = Math.max(0, Math.min(1, Number(percent) / 100));

      if (!rgb || Number.isNaN(alpha)) return "rgba(0, 0, 0, 0)";

      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    },
  );
}

function sanitizeUnsupportedColors(element: HTMLElement) {
  const nodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];

  nodes.forEach((node) => {
    const styles = getComputedStyle(node);

    COLOR_PROPERTIES.forEach(([property, fallback]) => {
      const value = styles.getPropertyValue(property);

      if (!value || !UNSUPPORTED_COLOR_FUNCTION.test(value)) return;

      const normalized = replaceOklabColorMix(value);

      node.style.setProperty(
        property,
        UNSUPPORTED_COLOR_FUNCTION.test(normalized) ? fallback : normalized,
        "important",
      );
    });
  });
}

function inlineComputedStylesForCapture(element: HTMLElement) {
  const nodes = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];

  nodes.forEach((node) => {
    if (node.tagName.toLowerCase() === "style") return;

    const styles = getComputedStyle(node);

    for (const property of styles) {
      if (property.startsWith("--")) continue;

      const value = styles.getPropertyValue(property);

      if (!value) continue;

      node.style.setProperty(property, value, styles.getPropertyPriority(property));
    }

    node.removeAttribute("class");
  });

  element.querySelectorAll("style").forEach((style) => style.remove());
}

function createHiddenCaptureHost(left: string) {
  const host = document.createElement("div");

  Object.assign(host.style, {
    position: "fixed",
    left,
    top: "0",
    width: `${SHARE_CAPTURE_WIDTH}px`,
    height: "auto",
    overflow: "visible",
    maxHeight: "none",
    background: SHARE_BACKGROUND,
    zIndex: "-1",
    pointerEvents: "none",
  });

  return host;
}

function prepareCaptureClone(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;

  Object.assign(clone.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${SHARE_CAPTURE_WIDTH}px`,
    height: "auto",
    overflow: "visible",
    maxHeight: "none",
    background: SHARE_BACKGROUND,
  });
  clone.setAttribute("data-kishib-share-capture", "true");

  const style = document.createElement("style");
  style.textContent = `
    .antique-report-document,
    .antique-report-document .report-page {
      width: ${SHARE_CAPTURE_WIDTH}px !important;
      max-width: none !important;
      height: auto !important;
      overflow: visible !important;
      max-height: none !important;
      background: ${SHARE_BACKGROUND} !important;
    }

    .antique-report-document .report-page > .relative {
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
      max-height: none !important;
    }
  `;

  clone.prepend(style);

  return clone;
}

export async function createShareImage({
  result,
  imagePreview,
  locale,
}: CreateShareImageArgs): Promise<File[]> {
  const timestamp = Date.now();
  const sourceHost = createHiddenCaptureHost("-20000px");
  let clone: HTMLElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  document.body.appendChild(sourceHost);

  try {
    root = createRoot(sourceHost);

    flushSync(() => {
      root?.render(
        createElement(AntiqueReportDocument, {
          locale,
          result,
          imageUrl: imagePreview || undefined,
          imageUrls: imagePreview ? [imagePreview] : [],
          variant: "preview",
        }),
      );
    });

    await nextFrame();
    await nextFrame();

    const reportElement = sourceHost.firstElementChild as HTMLElement | null;

    if (!reportElement) {
      throw new Error("Unable to render report image");
    }

    clone = prepareCaptureClone(reportElement);
    document.body.appendChild(clone);

    await document.fonts?.ready;
    await waitForReportImages(clone);
    inlineComputedStylesForCapture(clone);
    sanitizeUnsupportedColors(clone);
    await nextFrame();

    const width = clone.scrollWidth;
    const height = clone.scrollHeight;
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: SHARE_BACKGROUND,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      onclone: (clonedDocument) => {
        const clonedCapture = clonedDocument.querySelector<HTMLElement>(
          "[data-kishib-share-capture='true']",
        );

        if (!clonedCapture) return;

        inlineComputedStylesForCapture(clonedCapture);
        sanitizeUnsupportedColors(clonedCapture);
      },
    });
    const blob = await canvasToBlob(canvas);

    return [
      new File([blob], `kishib-report-${timestamp}.png`, {
        type: "image/png",
        lastModified: timestamp,
      }),
    ];
  } finally {
    clone?.remove();
    root?.unmount();
    sourceHost.remove();
  }
}
