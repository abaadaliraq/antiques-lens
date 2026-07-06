const STAGING_SUPABASE_HOST = "hvjwjbomfsuwaauolgyh.supabase.co";

export function shouldForceStagingAiFailure(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.NODE_ENV === "production") return false;
  if (env.STAGING_FORCE_AI_FAILURE?.trim().toLowerCase() !== "true") return false;

  try {
    const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return supabaseUrl.protocol === "https:" && supabaseUrl.hostname === STAGING_SUPABASE_HOST;
  } catch {
    return false;
  }
}
