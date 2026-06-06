"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TEMP_ACCESS_KEY = "kishib_temp_access";
const TEMP_ACCESS_VALUE = "preview_v2";
const PASSWORD_GATE_PATH = "/private-preview";

function hasAccessCookie() {
  if (typeof document === "undefined") return false;

  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === `${TEMP_ACCESS_KEY}=${TEMP_ACCESS_VALUE}`);
}

export default function TempAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith(PASSWORD_GATE_PATH)) {
      setCanRender(true);
      return;
    }

    if (hasAccessCookie()) {
      setCanRender(true);
      return;
    }

    setCanRender(false);
    const query = searchParams.toString();
    const nextPath = `${pathname || "/"}${query ? `?${query}` : ""}`;
    router.replace(
      `${PASSWORD_GATE_PATH}?next=${encodeURIComponent(nextPath)}`,
    );
  }, [pathname, router, searchParams]);

  if (!canRender) {
    return <main className="min-h-dvh bg-[#efe3cf]" />;
  }

  return <>{children}</>;
}
