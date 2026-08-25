"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg bg-ink-900 border border-ink-700 px-3 py-2 text-sm text-parchment placeholder:text-ink-600 focus:border-brass outline-none transition-colors";

export default function RegisterPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.register(email, password);
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-ink-900 border border-ink-800 flex items-center justify-center mb-3">
            <KeyRound size={20} className="text-brass" />
          </div>
          <h1 className="font-display text-lg font-semibold text-parchment">kesec</h1>
          <p className="text-sm text-parchment-dim mt-1">Create your vault</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-ink-900 border border-ink-800 p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-parchment-dim mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-parchment-dim mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={fieldClass}
            />
            <p className="text-xs text-ink-600 mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm text-parchment-dim mb-1.5">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={fieldClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rust-bright">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-lg text-sm font-medium bg-brass text-ink-950 hover:bg-brass-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-parchment-dim mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-brass hover:text-brass-bright transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
