"use client";

import { KeyRound, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-brass" />
          <span className="font-display font-semibold tracking-tight text-parchment">kesec</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-parchment-dim font-mono">{user.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-sm text-parchment-dim hover:text-brass transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
