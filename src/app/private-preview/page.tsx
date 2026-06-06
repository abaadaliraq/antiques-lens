import { Suspense } from "react";
import PasswordGateClient from "@/components/antique-ai/PasswordGateClient";

export default function PrivatePreviewPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#efe3cf]" />}>
      <PasswordGateClient />
    </Suspense>
  );
}
