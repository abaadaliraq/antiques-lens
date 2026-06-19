import {
  genderLabel,
  getCountryByCode,
  getProvinceByCode,
  normalizeCountry,
  normalizeProvince,
} from "@/lib/locationOptions";
import type { Locale } from "@/components/antique-ai/types";

export type DashboardUserLocationRow = {
  country?: string | null;
  country_code?: string | null;
  country_name_en?: string | null;
  user_country?: string | null;
  user_country_code?: string | null;
  user_country_name_en?: string | null;
  province?: string | null;
  province_code?: string | null;
  province_name_en?: string | null;
  city?: string | null;
  user_city?: string | null;
  user_province?: string | null;
  user_province_code?: string | null;
  user_province_name_en?: string | null;
  gender?: string | null;
  user_gender?: string | null;
};

export type DashboardBucket = {
  code: string;
  label: string;
  count: number;
};

function addBucket(map: Map<string, DashboardBucket>, code: string, label: string) {
  const current = map.get(code);
  if (current) {
    current.count += 1;
    return;
  }

  map.set(code, { code, label, count: 1 });
}

function buckets(map: Map<string, DashboardBucket>) {
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function getTopCountries(rows: DashboardUserLocationRow[]) {
  const map = new Map<string, DashboardBucket>();

  rows.forEach((row) => {
    const country =
      getCountryByCode(row.country_code || row.user_country_code) ||
      normalizeCountry(row.country || row.user_country);

    if (!country) return;
    addBucket(
      map,
      country.code,
      row.country_name_en || row.user_country_name_en || country.nameEn,
    );
  });

  return buckets(map);
}

export function getTopProvinces(rows: DashboardUserLocationRow[]) {
  const map = new Map<string, DashboardBucket>();

  rows.forEach((row) => {
    const province =
      getProvinceByCode(row.province_code || row.user_province_code) ||
      normalizeProvince(row.province || row.city || row.user_province || row.user_city);

    if (!province) return;
    addBucket(
      map,
      province.code,
      row.province_name_en || row.user_province_name_en || province.nameEn,
    );
  });

  return buckets(map);
}

export function getUsersByGender(
  rows: DashboardUserLocationRow[],
  locale: Locale = "en",
) {
  const map = new Map<string, DashboardBucket>();

  rows.forEach((row) => {
    const gender = row.gender || row.user_gender;
    if (!gender) return;
    addBucket(map, gender, genderLabel(gender, locale) || gender);
  });

  return buckets(map);
}
