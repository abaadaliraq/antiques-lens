import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type SupabaseAdminClient = SupabaseClient;

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function deleteRows(
  supabase: SupabaseAdminClient,
  table: string,
  column: string,
  value: string,
) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw error;
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = user.id;

    // TODO: Delete Cloudinary assets by cloudinary_public_id if a server-side
    // Cloudinary destroy integration is added. For now, database records are
    // deleted and external image URLs are no longer linked to the account.

    await Promise.all([
      deleteRows(supabase, "evaluations", "user_id", userId),
      deleteRows(supabase, "profiles", "id", userId),
    ]);

    const { error: deleteUserError } =
      await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) throw deleteUserError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed", error);

    return NextResponse.json(
      { error: "Unable to delete account. Please try again later." },
      { status: 500 },
    );
  }
}
