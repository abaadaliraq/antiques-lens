export const DEFAULT_MALE_AVATAR = "/images/avatars/default-avatar-male.webp";
export const DEFAULT_FEMALE_AVATAR = "/images/avatars/default-avatar-female.webp";

const FEMALE_GENDER_VALUES = new Set([
  "female",
  "f",
  "woman",
  "women",
  "girl",
  "أنثى",
  "انثى",
  "مؤنث",
  "زن",
  "زنان",
  "خانم",
  "مێ",
  "jin",
  "kadin",
  "kadın",
  "femme",
  "женский",
  "женщина",
  "महिला",
  "स्त्री",
]);

export function normalizeProfileGender(gender?: string | null) {
  return String(gender || "")
    .trim()
    .toLowerCase();
}

export function isFemaleProfileGender(gender?: string | null) {
  return FEMALE_GENDER_VALUES.has(normalizeProfileGender(gender));
}

export function getDefaultProfileAvatar(gender?: string | null) {
  return isFemaleProfileGender(gender)
    ? DEFAULT_FEMALE_AVATAR
    : DEFAULT_MALE_AVATAR;
}

export function getProfileAvatarUrl({
  avatarUrl,
  gender,
  forceDefault = false,
}: {
  avatarUrl?: string | null;
  gender?: string | null;
  forceDefault?: boolean;
}) {
  const cleanAvatarUrl = String(avatarUrl || "").trim();

  if (!forceDefault && cleanAvatarUrl) {
    return cleanAvatarUrl;
  }

  return getDefaultProfileAvatar(gender);
}
