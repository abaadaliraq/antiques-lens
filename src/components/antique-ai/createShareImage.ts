import type {
  AnalysisResult,
  Locale,
  ShareCardSize,
  ShareCardVariant,
} from "./types";

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
  variant?: ShareCardVariant;
  size?: ShareCardSize;
};

const REPORT_WIDTH = 1200;
const REPORT_HEIGHT = 1600;
const DETAIL_REPORT_HEIGHT = 2000;
const PADDING = 64;

const FONT =
  '"Tajawal", "Arial", "Tahoma", "Segoe UI", "Noto Sans Arabic", sans-serif';

const SOCIAL_CARD_SIZES: Record<ShareCardSize, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

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

function drawSoftShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color = "rgba(0, 0, 0, 0.28)",
  blur = 34,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = 18;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fill();
  ctx.restore();
}

function drawDecorativeLines(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(78, 40, 31, 0.28)";
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * 22);
    ctx.bezierCurveTo(
      x + 38,
      y - 22 + i * 22,
      x + 78,
      y + 42 + i * 22,
      x + 124,
      y + i * 22,
    );
    ctx.stroke();
  }
  ctx.restore();
}

async function drawKishibMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rtl: boolean,
) {
  const size = 82;
  const left = rtl ? x - size : x;
  const centerX = left + size / 2;
  const centerY = y + size / 2;

  ctx.save();
  ctx.shadowColor = "rgba(50, 22, 16, 0.16)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 249, 238, 0.98)";
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 3, 0, Math.PI * 2);
  ctx.closePath();
  ctx.strokeStyle = "rgba(107, 38, 30, 0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  try {
    const logo = await loadImage("/brand/kishib-logo.png");
    const logoSize = 58;
    const logoX = centerX - logoSize / 2;
    const logoY = centerY - logoSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#4d1b17";
    ctx.font = `800 28px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("K", centerX, centerY + 10);
  }
}

async function drawStampBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.12);
  ctx.strokeStyle = "rgba(155, 29, 22, 0.78)";
  ctx.lineWidth = 5;
  ctx.setLineDash([20, 8, 4, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 250, 240, 0.86)";
  ctx.beginPath();
  ctx.arc(0, 0, radius - 16, 0, Math.PI * 2);
  ctx.fill();

  try {
    const logo = await loadImage("/brand/kishib-logo.png");
    const logoSize = radius * 1.05;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    ctx.restore();
  } catch {
    ctx.fillStyle = "#8c1d16";
    ctx.font = `800 ${Math.round(radius * 0.42)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("KISHIB", 0, 8);
  }

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

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawFittedWrappedText({
  ctx,
  text,
  x,
  y,
  maxWidth,
  maxHeight,
  rtl,
  color,
  weight = 400,
  maxFontSize,
  minFontSize,
  lineHeightRatio = 1.42,
}: {
  ctx: CanvasRenderingContext2D;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  maxHeight: number;
  rtl: boolean;
  color: string;
  weight?: number;
  maxFontSize: number;
  minFontSize: number;
  lineHeightRatio?: number;
}) {
  let fontSize = maxFontSize;
  let lines: string[] = [];
  let lineHeight = Math.round(fontSize * lineHeightRatio);

  while (fontSize >= minFontSize) {
    ctx.font = `${weight} ${fontSize}px ${FONT}`;
    lineHeight = Math.round(fontSize * lineHeightRatio);
    lines = wrapTextLines(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) break;
    fontSize -= 2;
  }

  ctx.fillStyle = color;
  ctx.textAlign = rtl ? "right" : "left";
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
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

function getShareLabels(locale: Locale) {
  const ar = locale === "ar";

  return {
    evaluatedBy: ar ? "تم التقييم عبر KISHIB" : "Evaluated by KISHIB",
    tryKishib: ar ? "جرّب KISHIB" : "Try KISHIB",
    withPrice: ar ? "القيمة التقديرية" : "Estimated value",
    noPrice: ar ? "تقييم أولي بدون عرض السعر" : "Evaluation without price",
    guess: ar ? "احزر قيمة هذه القطعة؟" : "Guess the value of this antique?",
    scan: ar ? "قيّم قطعتك عبر KISHIB" : "Scan yours with KISHIB",
    historical: ar ? "معلومة تاريخية" : "Historical note",
    before: ar ? "قبل كيشيب" : "Before KISHIB",
    after: ar ? "بعد كيشيب" : "After KISHIB",
    unknown: ar ? "قطعة غير معروفة" : "Unknown item",
    type: ar ? "النوع" : "Type",
    era: ar ? "الحقبة" : "Era",
    material: ar ? "الخامة" : "Material",
    value: ar ? "القيمة" : "Value",
    cta: ar
      ? "حمّل التطبيق لتقييم قطعك الثمينة"
      : "Download the app to evaluate your treasured pieces",
    low: ar ? "منخفضة" : "Low",
    medium: ar ? "متوسطة" : "Medium",
    high: ar ? "عالية" : "High",
  };
}

function getCurrentPriceText(result: AnalysisResult) {
  const scenario = result.valuation_scenarios?.[0] || result.valuationScenarios?.[0];
  if (
    scenario &&
    typeof scenario.min === "number" &&
    typeof scenario.max === "number"
  ) {
    const low = Math.min(scenario.min, scenario.max);
    const high = Math.max(scenario.min, scenario.max);
    const symbol =
      scenario.currency === "EUR" ? "€" : scenario.currency === "GBP" ? "£" : "$";
    return `${symbol}${low.toLocaleString("en-US")} - ${symbol}${high.toLocaleString("en-US")}`;
  }

  return safeText(result.estimatedValue || result.priceRange);
}

async function createSocialShareImage({
  result,
  imagePreview,
  locale,
  variant,
  size,
}: {
  result: AnalysisResult;
  imagePreview: string | null;
  locale: Locale;
  variant: ShareCardVariant;
  size: ShareCardSize;
}) {
  const rtl = isRtlLocale(locale);
  const labels = getShareLabels(locale);
  const dimensions = SOCIAL_CARD_SIZES[size];
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.fillStyle = "#f4eadb";
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  const vignette = ctx.createRadialGradient(
    dimensions.width * 0.88,
    dimensions.height * 0.06,
    10,
    dimensions.width * 0.68,
    dimensions.height * 0.26,
    dimensions.width * 1.1,
  );
  vignette.addColorStop(0, "rgba(198, 149, 110, 0.36)");
  vignette.addColorStop(0.42, "rgba(244, 234, 219, 0.72)");
  vignette.addColorStop(1, "rgba(127, 58, 43, 0.2)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  ctx.fillStyle = "rgba(92, 44, 33, 0.035)";
  for (let y = 0; y < dimensions.height; y += 34) {
    ctx.fillRect(0, y, dimensions.width, 1);
  }

  const margin = size === "story" ? 92 : 74;
  const imageY = size === "story" ? 245 : 150;
  const imageH = size === "story" ? 610 : 330;
  const textX = rtl ? dimensions.width - margin : margin;
  const contentW = dimensions.width - margin * 2;
  const brandX = rtl ? dimensions.width - margin : margin;

  ctx.fillStyle = "#351611";
  ctx.font = `600 ${size === "story" ? 32 : 25}px ${FONT}`;
  ctx.textAlign = rtl ? "right" : "left";
  ctx.fillText("KISHIB", brandX, size === "story" ? 116 : 82);

  ctx.fillStyle = "#351611";
  ctx.font = `400 ${size === "story" ? 25 : 18}px ${FONT}`;
  ctx.textAlign = rtl ? "left" : "right";
  ctx.fillText(
    labels.cta,
    rtl ? margin : dimensions.width - margin,
    size === "story" ? 116 : 82,
  );

  drawDecorativeLines(
    ctx,
    rtl ? margin + 8 : dimensions.width - margin - 132,
    size === "story" ? 156 : 130,
  );

  drawSoftShadow(ctx, margin, imageY, contentW, imageH, 30, "rgba(54, 24, 17, 0.18)", 22);
  if (imagePreview) {
    try {
      const image = await loadImage(imagePreview);
      drawCoverImage(ctx, image, margin, imageY, contentW, imageH, 30);
    } catch {
      roundedRect(ctx, margin, imageY, contentW, imageH, 30);
      ctx.fillStyle = "#e6d8c4";
      ctx.fill();
    }
  } else {
    roundedRect(ctx, margin, imageY, contentW, imageH, 30);
    ctx.fillStyle = "#e6d8c4";
    ctx.fill();
  }

  await drawStampBadge(
    ctx,
    rtl ? margin + 10 : dimensions.width - margin - 10,
    imageY + imageH - 18,
    size === "story" ? 54 : 42,
  );

  ctx.textAlign = rtl ? "right" : "left";

  const title = safeText(result.title || result.itemType || "Antique");
  const description = safeText(
    result.description ||
      result.lookup ||
      result.history ||
      result.priceReasoning ||
      result.material ||
      result.itemType,
  );
  const price = getCurrentPriceText(result);
  let cursorY = imageY + imageH + (size === "story" ? 105 : 54);

  ctx.fillStyle = "#351611";
  ctx.font = `600 ${size === "story" ? 48 : 33}px ${FONT}`;

  if (variant === "guess_value") {
    cursorY = drawWrappedText(ctx, labels.guess, textX, cursorY, contentW, 74, 3, rtl) + 12;
    ctx.fillStyle = "#f0cf83";
    ctx.font = `700 ${size === "story" ? 36 : 30}px ${FONT}`;
    drawWrappedText(ctx, labels.scan, textX, cursorY, contentW, 46, 2, rtl);
  } else if (variant === "before_after") {
    ctx.font = `800 ${size === "story" ? 48 : 38}px ${FONT}`;
    ctx.fillText(labels.before, textX, cursorY);
    ctx.font = `500 ${size === "story" ? 36 : 28}px ${FONT}`;
    ctx.fillText(labels.unknown, textX, cursorY + 58);
    cursorY += size === "story" ? 158 : 118;
    ctx.fillStyle = "#f0cf83";
    ctx.font = `800 ${size === "story" ? 48 : 38}px ${FONT}`;
    ctx.fillText(labels.after, textX, cursorY);
    ctx.fillStyle = "#fff4e2";
    ctx.font = `600 ${size === "story" ? 34 : 27}px ${FONT}`;
    const afterLines = [
      `${labels.type}: ${safeText(result.itemType || result.title)}`,
      `${labels.era}: ${safeText(result.timePeriod || result.period)}`,
      `${labels.material}: ${safeText(result.material)}`,
      `${labels.value}: ${price}`,
    ];
    drawWrappedText(ctx, afterLines.join(" / "), textX, cursorY + 58, contentW, 44, 4, rtl);
  } else {
    cursorY =
      drawWrappedText(
        ctx,
        title,
        textX,
        cursorY,
        contentW,
        size === "story" ? 60 : 42,
        size === "story" ? 3 : 2,
        rtl,
      ) + (size === "story" ? 28 : 16);

    if (variant === "with_price") {
      cursorY = drawFittedWrappedText({
        ctx,
        text: description,
        x: textX,
        y: cursorY,
        maxWidth: contentW,
        maxHeight: size === "story" ? 430 : 170,
        rtl,
        color: "rgba(53, 22, 17, 0.78)",
        weight: 400,
        maxFontSize: size === "story" ? 34 : 22,
        minFontSize: size === "story" ? 22 : 15,
      });
      ctx.fillStyle = "#7a241d";
      ctx.font = `700 ${size === "story" ? 42 : 30}px ${FONT}`;
      ctx.fillText(price, textX, cursorY + (size === "story" ? 48 : 32));
    } else if (variant === "without_price") {
      ctx.fillStyle = "#f0cf83";
      ctx.font = `700 ${size === "story" ? 34 : 28}px ${FONT}`;
      drawWrappedText(
        ctx,
        `${labels.type}: ${safeText(result.itemType || result.title)} / ${labels.material}: ${safeText(result.material)} / ${labels.era}: ${safeText(result.timePeriod || result.period)}`,
        textX,
        cursorY + 42,
        contentW,
        44,
        3,
        rtl,
      );
    } else {
      ctx.fillStyle = "#f0cf83";
      ctx.font = `700 ${size === "story" ? 34 : 28}px ${FONT}`;
      drawWrappedText(
        ctx,
        `${labels.historical}: ${trimText(result.history || result.lookup || result.description, 170)}`,
        textX,
        cursorY + 42,
        contentW,
        44,
        4,
        rtl,
      );
    }
  }

  ctx.textAlign = rtl ? "right" : "left";
  ctx.strokeStyle = "rgba(80, 36, 27, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, dimensions.height - margin - 82);
  ctx.lineTo(dimensions.width - margin, dimensions.height - margin - 82);
  ctx.stroke();

  ctx.fillStyle = "rgba(53, 22, 17, 0.72)";
  ctx.font = `600 ${size === "story" ? 25 : 20}px ${FONT}`;
  ctx.fillText(labels.evaluatedBy, textX, dimensions.height - margin - 40);
  ctx.font = `500 ${size === "story" ? 22 : 18}px ${FONT}`;
  ctx.fillText("kishibapp.com", textX, dimensions.height - margin);

  const blob = await canvasToBlob(canvas);
  const privacySafe = variant === "with_price" || variant === "before_after";
  const fileName = privacySafe
    ? `kishib-${variant}-${size}-${Date.now()}.png`
    : `kishib-share-${variant}-${size}-${Date.now()}.png`;

  return new File([blob], fileName, { type: "image/png" });
}

export async function createShareImage({
  result,
  imagePreview,
  labels,
  locale,
  variant,
  size = "story",
}: CreateShareImageArgs): Promise<File[]> {
  if (variant) {
    return [
      await createSocialShareImage({
        result,
        imagePreview,
        locale,
        variant,
        size,
      }),
    ];
  }

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
  ctx.fillText("Evaluated by KISHIB", REPORT_WIDTH / 2, REPORT_HEIGHT - 86);

  const blob = await canvasToBlob(canvas);
  files.push(new File([blob], `kishib-report-${timestamp}.png`, {
    type: "image/png",
    lastModified: timestamp,
  }));

  return files;
}
