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

const REPORT_WIDTH = 1200;
const REPORT_HEIGHT = 1600;
const DETAIL_REPORT_HEIGHT = 2000;
const PADDING = 64;

const FONT =
  'Arial, "Tahoma", "Segoe UI", "Noto Sans Arabic", sans-serif';

function isRtlLocale(locale: Locale) {
  return locale === "ar" || locale === "ku";
}

function safeText(value?: string | number | null) {
  if (value === undefined || value === null) return "-";
  const text = String(value).trim();
  return text.length ? text : "-";
}

function trimText(value?: string | number | null, max = 280) {
  const clean = safeText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[,.;:\s]+$/, "")}...`;
}

function compactText(value?: string | number | null, max = 900) {
  const clean = safeText(value).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[,.;:\s]+$/, "")}...`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load report image"));
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > boxRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    offsetX = (width - drawWidth) / 2;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();

  ctx.fillStyle = "#efe7da";
  ctx.fillRect(x, y, width, height);
  ctx.drawImage(image, x + offsetX, y + offsetY, drawWidth, drawHeight);

  ctx.restore();
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > boxRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
  }

  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();

  ctx.fillStyle = "#211711";
  ctx.fillRect(x, y, width, height);
  ctx.drawImage(image, x + offsetX, y + offsetY, drawWidth, drawHeight);

  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  rtl: boolean,
) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line) {
      lines.push(line);
      line = word;

      if (lines.length >= maxLines) break;
    } else {
      line = testLine;
    }
  }

  if (lines.length < maxLines && line) {
    lines.push(line);
  }

  const finalLines = lines.slice(0, maxLines);

  if (false && lines.length >= maxLines && finalLines.length) {
    const lastIndex = finalLines.length - 1;
    finalLines[lastIndex] = `${finalLines[lastIndex]
      .replace(/[,.;:\s]+$/, "")
      .slice(0, 80)}...`;
  }

  ctx.textAlign = rtl ? "right" : "left";

  finalLines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });

  return y + finalLines.length * lineHeight;
}

function drawInfoItem({
  ctx,
  label,
  value,
  x,
  y,
  width,
  rtl,
  maxLines = 2,
}: {
  ctx: CanvasRenderingContext2D;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  rtl: boolean;
  maxLines?: number;
}) {
  const textX = rtl ? x + width : x;

  ctx.textAlign = rtl ? "right" : "left";

  ctx.fillStyle = "#9a7447";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(label, textX, y);

  ctx.fillStyle = "#241912";
  ctx.font = `500 29px ${FONT}`;

  const endY = drawWrappedText(
    ctx,
    value,
    textX,
    y + 38,
    width,
    38,
    maxLines,
    rtl,
  );

  return endY + 26;
}

function drawMiniStat({
  ctx,
  label,
  value,
  x,
  y,
  width,
  rtl,
}: {
  ctx: CanvasRenderingContext2D;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  rtl: boolean;
}) {
  roundedRect(ctx, x, y, width, 104, 24);
  ctx.fillStyle = "#fffaf3";
  ctx.fill();

  ctx.strokeStyle = "#eadcc8";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const textX = rtl ? x + width - 24 : x + 24;

  ctx.textAlign = rtl ? "right" : "left";

  ctx.fillStyle = "#9a7447";
  ctx.font = `600 19px ${FONT}`;
  ctx.fillText(label, textX, y + 35);

  ctx.fillStyle = "#211711";
  ctx.font = `500 25px ${FONT}`;
  drawWrappedText(ctx, value, textX, y + 70, width - 48, 30, 1, rtl);
}

function drawSectionCard({
  ctx,
  title,
  body,
  x,
  y,
  width,
  height,
  rtl,
  maxLines = 5,
}: {
  ctx: CanvasRenderingContext2D;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rtl: boolean;
  maxLines?: number;
}) {
  roundedRect(ctx, x, y, width, height, 30);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.strokeStyle = "#eadcc8";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const textX = rtl ? x + width - 34 : x + 34;

  ctx.textAlign = rtl ? "right" : "left";

  ctx.fillStyle = "#9a7447";
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(title, textX, y + 48);

  ctx.fillStyle = "#241912";
  ctx.font = `400 28px ${FONT}`;

  drawWrappedText(
    ctx,
    body,
    textX,
    y + 96,
    width - 68,
    43,
    maxLines,
    rtl,
  );
}

function drawPlainSection({
  ctx,
  title,
  body,
  x,
  y,
  width,
  rtl,
  maxLines,
  bodySize = 25,
  lineHeight = 38,
}: {
  ctx: CanvasRenderingContext2D;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  rtl: boolean;
  maxLines: number;
  bodySize?: number;
  lineHeight?: number;
}) {
  const textX = rtl ? x + width : x;

  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#9a7447";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(title, textX, y);

  ctx.fillStyle = "#241912";
  ctx.font = `400 ${bodySize}px ${FONT}`;
  const endY = drawWrappedText(
    ctx,
    body,
    textX,
    y + 42,
    width,
    lineHeight,
    maxLines,
    rtl,
  );

  ctx.strokeStyle = "#eadcc8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, endY + 22);
  ctx.lineTo(x + width, endY + 22);
  ctx.stroke();

  return endY + 58;
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

export async function createShareImage({
  result,
  imagePreview,
  labels,
  locale,
}: CreateShareImageArgs): Promise<File[]> {
  const rtl = isRtlLocale(locale);
  const timestamp = Date.now();
  const files: File[] = [];

  const canvas = document.createElement("canvas");
  canvas.width = REPORT_WIDTH;
  canvas.height = REPORT_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported");
  }

  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.fillStyle = "#f3eadf";
  ctx.fillRect(0, 0, REPORT_WIDTH, REPORT_HEIGHT);

  roundedRect(ctx, 54, 54, REPORT_WIDTH - 108, REPORT_HEIGHT - 108, 34);
  ctx.fillStyle = "#fffaf4";
  ctx.fill();
  ctx.strokeStyle = "#e4d4bd";
  ctx.lineWidth = 2;
  ctx.stroke();

  const contentX = PADDING;
  const contentW = REPORT_WIDTH - PADDING * 2;
  const titleX = rtl ? REPORT_WIDTH - PADDING : PADDING;

  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillStyle = "#9a7447";
  ctx.font = `700 25px ${FONT}`;
  ctx.fillText("KISHIB Report", titleX, 118);

  ctx.fillStyle = "#130f0b";
  ctx.font = `700 48px ${FONT}`;
  const titleEndY = drawWrappedText(
    ctx,
    trimText(result.title || labels.result, 120),
    titleX,
    184,
    contentW,
    58,
    2,
    rtl,
  );

  const topY = titleEndY + 38;
  const imageX = contentX;
  const imageY = topY;
  const imageW = 470;
  const imageH = 430;
  const infoX = imageX + imageW + 46;
  const infoW = REPORT_WIDTH - PADDING - infoX;

  if (imagePreview) {
    try {
      const uploadedImage = await loadImage(imagePreview);
      drawContainImage(ctx, uploadedImage, imageX, imageY, imageW, imageH, 26);
    } catch {
      roundedRect(ctx, imageX, imageY, imageW, imageH, 26);
      ctx.fillStyle = "#efe7da";
      ctx.fill();
    }
  } else {
    roundedRect(ctx, imageX, imageY, imageW, imageH, 26);
    ctx.fillStyle = "#efe7da";
    ctx.fill();
  }

  let cursorY = imageY + 6;
  cursorY = drawInfoItem({
    ctx,
    label: labels.value,
    value: trimText(result.estimatedValue || result.priceRange, 120),
    x: infoX,
    y: cursorY,
    width: infoW,
    rtl,
    maxLines: 2,
  });

  cursorY = drawInfoItem({
    ctx,
    label: labels.age,
    value: trimText(result.timePeriod || result.period, 95),
    x: infoX,
    y: cursorY,
    width: infoW,
    rtl,
    maxLines: 2,
  });

  cursorY = drawInfoItem({
    ctx,
    label: labels.material,
    value: trimText(result.material, 95),
    x: infoX,
    y: cursorY,
    width: infoW,
    rtl,
    maxLines: 2,
  });

  const statsY = imageY + imageH + 34;
  const gap = 22;
  const statW = (contentW - gap * 1) / 2;

  drawMiniStat({
    ctx,
    label: labels.condition,
    value: trimText(result.condition, 85),
    x: contentX,
    y: statsY,
    width: statW,
    rtl,
  });

  drawMiniStat({
    ctx,
    label: labels.authenticity,
    value: trimText(result.authenticity, 85),
    x: contentX + statW + gap,
    y: statsY,
    width: statW,
    rtl,
  });

  const reasonY = statsY + 138;
  drawSectionCard({
    ctx,
    title: labels.priceReason,
    body: trimText(
      result.priceReasoning || result.description || result.history || result.estimatedValue,
      360,
    ),
    x: contentX,
    y: reasonY,
    width: contentW,
    height: 210,
    rtl,
    maxLines: 4,
  });

  const listY = reasonY + 246;
  const halfW = (contentW - gap) / 2;
  const drivers = (result.valueDrivers || [])
    .slice(0, 4)
    .map((item) => `- ${trimText(item, 80)}`)
    .join(" ");
  const reducers = (result.valueReducers || [])
    .slice(0, 4)
    .map((item) => `- ${trimText(item, 80)}`)
    .join(" ");

  drawSectionCard({
    ctx,
    title: labels.valueDrivers,
    body: drivers || "-",
    x: contentX,
    y: listY,
    width: halfW,
    height: 245,
    rtl,
    maxLines: 5,
  });

  drawSectionCard({
    ctx,
    title: labels.valueReducers,
    body: reducers || "-",
    x: contentX + halfW + gap,
    y: listY,
    width: halfW,
    height: 245,
    rtl,
    maxLines: 5,
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#9a7447";
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText("Generated by KISHIB", REPORT_WIDTH / 2, REPORT_HEIGHT - 86);

  const blob = await canvasToBlob(canvas);
  files.push(new File([blob], `kishib-report-${timestamp}.png`, {
    type: "image/png",
    lastModified: timestamp,
  }));

  return files;
}
