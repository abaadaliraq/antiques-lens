"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import CompleteProfileModal from "@/components/antique-ai/CompleteProfileModal";
import {
  ensureCurrentUserProfile,
  PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/profilesSupabase";
import type { Locale } from "./types";

export default function ProfileCompletionGate({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const [complete, setComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  async function refreshProfile() {
    try {
      setReady(false);
      const result = await ensureCurrentUserProfile();
      setHasUser(Boolean(result.user));
      setProfile(result.profile);
      setComplete(result.complete);
    } catch (error) {
      console.error("Failed to load required profile", error);
      setHasUser(false);
      setProfile(null);
      setComplete(false);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void refreshProfile();

    function handleProfileUpdated() {
      void refreshProfile();
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, []);

  if (!ready) {
    return <main className="min-h-dvh bg-[#130d0a]" />;
  }

  if (hasUser && !complete) {
    return (
      <main className="relative min-h-dvh overflow-hidden kishib-bg-auth">
        <CompleteProfileModal
          locale={locale}
          profile={profile}
          onCompleted={() => void refreshProfile()}
        />
      </main>
    );
  }

  return <>{children}</>;
}
