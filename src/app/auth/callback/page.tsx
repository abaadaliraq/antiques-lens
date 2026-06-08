"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = getSupabaseBrowserClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } finally {
        router.replace("/");
      }
    }

    void handleCallback();
  }, [router]);

  return <main className="min-h-dvh kishib-bg-auth" />;
}
