import { NextResponse } from "next/server";

const DEFAULT_VERSION_CODE = 16;
const DEFAULT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kishib.app";

function readVersionCode(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const versionCode = Number.parseInt(value, 10);
  return Number.isFinite(versionCode) && versionCode > 0
    ? versionCode
    : fallback;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const latestVersionCode = readVersionCode(
    process.env.KISHIB_LATEST_VERSION_CODE,
    DEFAULT_VERSION_CODE,
  );
  const minimumRequiredVersionCode = readVersionCode(
    process.env.KISHIB_MINIMUM_REQUIRED_VERSION_CODE,
    DEFAULT_VERSION_CODE,
  );
  const playStoreUrl =
    process.env.KISHIB_PLAY_STORE_URL?.trim() || DEFAULT_PLAY_STORE_URL;

  return NextResponse.json({
    latestVersionCode,
    minimumRequiredVersionCode,
    playStoreUrl,
  });
}
