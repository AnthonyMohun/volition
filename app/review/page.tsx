"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/select");
  }, [router]);

  return null;
}
