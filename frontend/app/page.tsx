"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.push(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <KeyRound size={20} className="text-brass animate-pulse" />
    </div>
  );
}
