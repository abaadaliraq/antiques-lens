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
const REPORT_HEIGHT = 2000;
const DETAIL_REPORT_HEIGHT = 2000;
const PADDING = 64;

const FONT =
  'Arial, "Tahoma", "Segoe UI", "Noto Sans Arabic", sans-serif';

function isRtlLocale(locale: Locale) {
  return locale === "ar" || locale === "ku";
}

function safeText(value?: string | number | null) {
  if (value === undefined || value === null) return "—";
  const text = String(value).trim();
  return text.length ? text : "—";
}

function trimText(value?: string | number | null, max = 280) {
  const clean = safeText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[،,.؛:\s]+$/, "")}…`;
}

function compactText(value?: string | number | null, max = 900) {
  const clean = safeText(value).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/[ØŒ,.Ø›:\s]+$/, "")}...`;
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
      .replace(/[،,.؛:\s]+$/, "")
      .slice(0, 80)}…`;
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

  /*
    Background
  */
  ctx.fillStyle = "#f3eadf";
  ctx.fillRect(0, 0, REPORT_WIDTH, REPORT_HEIGHT);

  /*
    Main paper
  */
  roundedRect(ctx, 34, 34, REPORT_WIDTH - 68, REPORT_HEIGHT - 68, 42);
  ctx.fillStyle = "#fffaf4";
  ctx.fill();

  ctx.strokeStyle = "#e4d4bd";
  ctx.lineWidth = 2;
  ctx.stroke();

  /*
    Header
  */
  const logoX = rtl ? PADDING : REPORT_WIDTH - PADDING - 92;
  const titleX = rtl ? REPORT_WIDTH - PADDING : PADDING;

  roundedRect(ctx, logoX, 78, 92, 92, 27);
  ctx.fillStyle = "#211711";
  ctx.fill();

  ctx.fillStyle = "#d8a25d";
  ctx.font = `700 34px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("AL", logoX + 46, 135);

  ctx.textAlign = rtl ? "right" : "left";

  ctx.fillStyle = "#130f0b";
  ctx.font = `700 48px ${FONT}`;
  ctx.fillText("Antique Lens", titleX, 108);

  ctx.fillStyle = "#9a7447";
  ctx.font = `500 23px ${FONT}`;
  ctx.fillText("AI Antique Evaluation Report", titleX, 145);

  /*
    Item title
  */
  ctx.fillStyle = "#211711";
  ctx.font = `600 43px ${FONT}`;

  const titleEndY = drawWrappedText(
    ctx,
    safeText(result.title),
    titleX,
    235,
    REPORT_WIDTH - PADDING * 2,
    56,
    2,
    rtl,
  );

  /*
    Main layout
  */
  const topY = titleEndY + 48;
  const imageX = PADDING;
  const imageY = topY;
  const imageW = 475;
  const imageH = 520;

  const infoX = imageX + imageW + 58;
  const infoY = imageY + 4;
  const infoW = REPORT_WIDTH - PADDING - infoX;

  if (imagePreview) {
    try {
      const uploadedImage = await loadImage(imagePreview);
      drawCoverImage(ctx, uploadedImage, imageX, imageY, imageW, imageH, 32);
    } catch {
      roundedRect(ctx, imageX, imageY, imageW, imageH, 32);
      ctx.fillStyle = "#efe7da";
      ctx.fill();

      ctx.fillStyle = "#8a6a45";
      ctx.font = `500 28px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("Image unavailable", imageX + imageW / 2, imageY + imageH / 2);
    }
  } else {
    roundedRect(ctx, imageX, imageY, imageW, imageH, 32);
    ctx.fillStyle = "#efe7da";
    ctx.fill();

    ctx.fillStyle = "#8a6a45";
    ctx.font = `500 28px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("No image", imageX + imageW / 2, imageY + imageH / 2);
  }

  /*
    Details column
    ملاحظة: ألغينا نسبة الثقة نهائياً.
  */
  let cursorY = infoY;

  cursorY = drawInfoItem({
    ctx,
    label: labels.lookup,
    value: trimText(result.itemType || result.title || result.lookup, 95),
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
    label: labels.origin,
    value: trimText(result.origin, 85),
    x: infoX,
    y: cursorY,
    width: infoW,
    rtl,
    maxLines: 2,
  });

  cursorY = drawInfoItem({
    ctx,
    label: labels.value,
    value: trimText(result.estimatedValue || result.priceRange, 110),
    x: infoX,
    y: cursorY,
    width: infoW,
    rtl,
    maxLines: 2,
  });

  /*
    Three clean cards under image/details
  */
  const statsY = imageY + imageH + 42;
  const gap = 22;
  const statW = (REPORT_WIDTH - PADDING * 2 - gap * 2) / 3;

  drawMiniStat({
    ctx,
    label: labels.material,
    value: trimText(result.material, 70),
    x: PADDING,
    y: statsY,
    width: statW,
    rtl,
  });

  drawMiniStat({
    ctx,
    label: labels.condition,
    value: trimText(result.condition, 70),
    x: PADDING + statW + gap,
    y: statsY,
    width: statW,
    rtl,
  });

  drawMiniStat({
    ctx,
    label: labels.authenticity,
    value: trimText(result.authenticity, 70),
    x: PADDING + (statW + gap) * 2,
    y: statsY,
    width: statW,
    rtl,
  });

  /*
    First page is only a visual summary. Full paragraphs are on page 2.
  */
  const descY = statsY + 140;

  drawSectionCard({
    ctx,
    title: labels.description,
    body: trimText(
      result.lookup || result.history || result.description,
      1100,
    ),
    x: PADDING,
    y: descY,
    width: REPORT_WIDTH - PADDING * 2,
    height: 370,
    rtl,
    maxLines: 8,
  });

  drawSectionCard({
    ctx,
    title: labels.value,
    body: trimText(
      result.estimatedValue || result.priceRange || result.priceReasoning,
      720,
    ),
    x: PADDING,
    y: descY + 410,
    width: REPORT_WIDTH - PADDING * 2,
    height: 210,
    rtl,
    maxLines: 5,
  });

  /*
    Notice card - fixed position, not overlapping
  */
  const noticeY = descY + 660;

  roundedRect(ctx, PADDING, noticeY, REPORT_WIDTH - PADDING * 2, 128, 30);
  ctx.fillStyle = "#211711";
  ctx.fill();

  const noticeTextX = rtl
    ? REPORT_WIDTH - PADDING - 34
    : PADDING + 34;

  ctx.textAlign = rtl ? "right" : "left";

  ctx.fillStyle = "#d8a25d";
  ctx.font = `600 23px ${FONT}`;
  ctx.fillText(labels.notice, noticeTextX, noticeY + 44);

  ctx.fillStyle = "#f7ead8";
  ctx.font = `400 22px ${FONT}`;

  drawWrappedText(
    ctx,
    trimText(result.disclaimer || result.confidenceNote, 180),
    noticeTextX,
    noticeY + 82,
    REPORT_WIDTH - PADDING * 2 - 68,
    31,
    2,
    rtl,
  );

  /*
    Footer
  */
  ctx.textAlign = "center";
  ctx.fillStyle = "#9a7447";
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText(
    "Generated by KISHIB",
    REPORT_WIDTH / 2,
    REPORT_HEIGHT - 76,
  );

  const firstBlob = await canvasToBlob(canvas);

  files.push(new File([firstBlob], `kishib-report-page-1-${timestamp}.png`, {
    type: "image/png",
    lastModified: timestamp,
  }));

  const secondCanvas = document.createElement("canvas");
  secondCanvas.width = REPORT_WIDTH;
  secondCanvas.height = DETAIL_REPORT_HEIGHT;

  const secondCtx = secondCanvas.getContext("2d");

  if (!secondCtx) {
    throw new Error("Canvas is not supported");
  }

  secondCtx.direction = rtl ? "rtl" : "ltr";
  secondCtx.fillStyle = "#f3eadf";
  secondCtx.fillRect(0, 0, REPORT_WIDTH, DETAIL_REPORT_HEIGHT);

  roundedRect(secondCtx, 34, 34, REPORT_WIDTH - 68, DETAIL_REPORT_HEIGHT - 68, 42);
  secondCtx.fillStyle = "#fffaf4";
  secondCtx.fill();

  secondCtx.strokeStyle = "#e4d4bd";
  secondCtx.lineWidth = 2;
  secondCtx.stroke();

  const pageTwoTitleX = rtl ? REPORT_WIDTH - PADDING : PADDING;
  secondCtx.textAlign = rtl ? "right" : "left";

  secondCtx.fillStyle = "#9a7447";
  secondCtx.font = `600 24px ${FONT}`;
  secondCtx.fillText("KISHIB", pageTwoTitleX, 96);

  secondCtx.fillStyle = "#130f0b";
  secondCtx.font = `700 42px ${FONT}`;
  const pageTwoHeaderEnd = drawWrappedText(
    secondCtx,
    safeText(result.title),
    pageTwoTitleX,
    148,
    REPORT_WIDTH - PADDING * 2,
    52,
    2,
    rtl,
  );

  secondCtx.strokeStyle = "#dfc9ab";
  secondCtx.lineWidth = 2;
  secondCtx.beginPath();
  secondCtx.moveTo(PADDING, pageTwoHeaderEnd + 22);
  secondCtx.lineTo(REPORT_WIDTH - PADDING, pageTwoHeaderEnd + 22);
  secondCtx.stroke();

  const sectionWidth = REPORT_WIDTH - PADDING * 2;
  let pageTwoY = pageTwoHeaderEnd + 68;

  pageTwoY = drawPlainSection({
    ctx: secondCtx,
    title: labels.description,
    body: compactText(result.history || result.description || result.lookup, 1050),
    x: PADDING,
    y: pageTwoY,
    width: sectionWidth,
    rtl,
    maxLines: 7,
  });

  pageTwoY = drawPlainSection({
    ctx: secondCtx,
    title: labels.priceReason,
    body: compactText(result.priceReasoning || result.estimatedValue, 980),
    x: PADDING,
    y: pageTwoY,
    width: sectionWidth,
    rtl,
    maxLines: 7,
  });

  const halfGap = 30;
  const halfWidth = (sectionWidth - halfGap) / 2;

  drawPlainSection({
    ctx: secondCtx,
    title: labels.valueDrivers,
    body: compactText((result.valueDrivers || []).join("\n"), 540),
    x: PADDING,
    y: pageTwoY,
    width: halfWidth,
    rtl,
    maxLines: 6,
    bodySize: 23,
    lineHeight: 34,
  });

  drawPlainSection({
    ctx: secondCtx,
    title: labels.valueReducers,
    body: compactText((result.valueReducers || []).join("\n"), 540),
    x: PADDING + halfWidth + halfGap,
    y: pageTwoY,
    width: halfWidth,
    rtl,
    maxLines: 6,
    bodySize: 23,
    lineHeight: 34,
  });

  const pageTwoNoticeY = DETAIL_REPORT_HEIGHT - 250;
  roundedRect(secondCtx, PADDING, pageTwoNoticeY, sectionWidth, 130, 30);
  secondCtx.fillStyle = "#211711";
  secondCtx.fill();

  const pageTwoNoticeTextX = rtl
    ? REPORT_WIDTH - PADDING - 34
    : PADDING + 34;

  secondCtx.textAlign = rtl ? "right" : "left";
  secondCtx.fillStyle = "#d8a25d";
  secondCtx.font = `600 23px ${FONT}`;
  secondCtx.fillText(labels.notice, pageTwoNoticeTextX, pageTwoNoticeY + 44);

  secondCtx.fillStyle = "#f7ead8";
  secondCtx.font = `400 22px ${FONT}`;
  drawWrappedText(
    secondCtx,
    compactText(result.disclaimer || result.confidenceNote, 260),
    pageTwoNoticeTextX,
    pageTwoNoticeY + 82,
    sectionWidth - 68,
    31,
    2,
    rtl,
  );

  secondCtx.textAlign = "center";
  secondCtx.fillStyle = "#9a7447";
  secondCtx.font = `500 20px ${FONT}`;
  secondCtx.fillText("Generated by KISHIB", REPORT_WIDTH / 2, DETAIL_REPORT_HEIGHT - 76);

  const secondBlob = await canvasToBlob(secondCanvas);
  files.push(new File([secondBlob], `kishib-report-page-2-${timestamp}.png`, {
    type: "image/png",
    lastModified: timestamp,
  }));

  return files;
}
