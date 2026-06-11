import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type SupabaseAdminClient = ReturnType<typeof createClient<any>>;

const MARKETPLACE_STORAGE_BUCKET = "marketplace-items";
const COLLECTION_STORAGE_BUCKET = "collection-items";

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

async function selectIds(
  supabase: SupabaseAdminClient,
  table: string,
  column: string,
  value: string,
) {
  const { data, error } = await supabase.from(table).select("id").eq(column, value);
  if (error) throw error;

  return ((data || []) as Array<{ id?: string }>)
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));
}

async function selectImageStoragePaths(
  supabase: SupabaseAdminClient,
  table: string,
  foreignKey: string,
  ids: string[],
) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from(table)
    .select("storage_path")
    .in(foreignKey, ids);

  if (error) throw error;

  return ((data || []) as Array<{ storage_path?: string | null }>)
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));
}

async function removeStoragePaths(
  supabase: SupabaseAdminClient,
  bucket: string,
  paths: string[],
) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(uniquePaths);
  if (error) {
    console.error(`Failed to remove files from ${bucket}`, error);
  }
}

async function clearReviewedByReferences(
  supabase: SupabaseAdminClient,
  table: string,
  userId: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ reviewed_by: null })
    .eq("reviewed_by", userId);

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
    const [collectionItemIds, marketplaceItemIds] = await Promise.all([
      selectIds(supabase, "collection_items", "owner_id", userId),
      selectIds(supabase, "marketplace_items", "seller_id", userId),
    ]);

    const [collectionStoragePaths, marketplaceStoragePaths] = await Promise.all([
      selectImageStoragePaths(
        supabase,
        "collection_item_images",
        "collection_item_id",
        collectionItemIds,
      ),
      selectImageStoragePaths(
        supabase,
        "marketplace_item_images",
        "item_id",
        marketplaceItemIds,
      ),
    ]);

    await Promise.all([
      removeStoragePaths(
        supabase,
        COLLECTION_STORAGE_BUCKET,
        collectionStoragePaths,
      ),
      removeStoragePaths(
        supabase,
        MARKETPLACE_STORAGE_BUCKET,
        marketplaceStoragePaths,
      ),
    ]);

    // TODO: Delete Cloudinary assets by cloudinary_public_id if a server-side
    // Cloudinary destroy integration is added. For now, database records are
    // deleted and external image URLs are no longer linked to the account.

    await Promise.all([
      clearReviewedByReferences(supabase, "marketplace_items", userId),
      clearReviewedByReferences(supabase, "collection_items", userId),
    ]);

    await Promise.all([
      deleteRows(supabase, "marketplace_notifications", "user_id", userId),
      deleteRows(supabase, "marketplace_orders", "buyer_id", userId),
      deleteRows(supabase, "marketplace_orders", "seller_id", userId),
      deleteRows(supabase, "collection_items", "owner_id", userId),
      deleteRows(supabase, "marketplace_items", "seller_id", userId),
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
