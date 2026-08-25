"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import SecretCard from "@/components/SecretCard";
import SecretFormModal from "@/components/SecretFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Secret, SecretInput } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [secrets, setSecrets] = useState<Secret[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [modalState, setModalState] = useState<"closed" | "add" | Secret>("closed");
  const [pendingDelete, setPendingDelete] = useState<Secret | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getSecrets()
      .then(setSecrets)
      .catch(() => setLoadError("Couldn't load your vault. Check that the API is running and try again."));
  }, [user]);

  const filtered = useMemo(() => {
    if (!secrets) return [];
    const q = query.trim().toLowerCase();
    if (!q) return secrets;
    return secrets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.username ?? "").toLowerCase().includes(q) ||
        (s.url ?? "").toLowerCase().includes(q) ||
        (s.notes ?? "").toLowerCase().includes(q)
    );
  }, [secrets, query]);

  const handleSave = async (data: SecretInput) => {
    if (modalState === "add") {
      const created = await api.addSecret(data);
      setSecrets((prev) => [created, ...(prev ?? [])]);
    } else if (modalState !== "closed") {
      const updated = await api.updateSecret(modalState.id, data);
      setSecrets((prev) => (prev ?? []).map((s) => (s.id === updated.id ? updated : s)));
    }
    setModalState("closed");
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteSecret(pendingDelete.id);
      setSecrets((prev) => (prev ?? []).filter((s) => s.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      setLoadError("Couldn't delete that credential. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <KeyRound size={20} className="text-brass animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-parchment">Your vault</h1>
            <p className="text-sm text-parchment-dim mt-0.5">
              {secrets ? `${secrets.length} credential${secrets.length === 1 ? "" : "s"} stored` : "Loading…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalState("add")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brass text-ink-950 hover:bg-brass-bright transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Add credential
          </button>
        </div>

        {secrets && secrets.length > 0 && (
          <div className="relative mb-5">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
            <input
              type="text"
              name="kesec-vault-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your vault"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              className="w-full rounded-lg bg-ink-900 border border-ink-700 pl-9 pr-3 py-2 text-sm text-parchment placeholder:text-ink-600 focus:border-brass outline-none transition-colors"
            />
          </div>
        )}

        {loadError && <p className="text-sm text-rust-bright mb-4">{loadError}</p>}

        {secrets === null && !loadError && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-ink-900 border border-ink-800 animate-pulse" />
            ))}
          </div>
        )}

        {secrets && secrets.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-ink-800">
            <KeyRound size={22} className="mx-auto text-brass mb-3" />
            <p className="text-parchment font-medium">No credentials yet</p>
            <p className="text-sm text-parchment-dim mt-1">Add your first one to get started.</p>
          </div>
        )}

        {secrets && secrets.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-parchment-dim text-center py-16">No credentials match &ldquo;{query}&rdquo;.</p>
        )}

        {filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((secret) => (
              <SecretCard
                key={secret.id}
                secret={secret}
                onEdit={() => setModalState(secret)}
                onDelete={() => setPendingDelete(secret)}
              />
            ))}
          </div>
        )}
      </main>

      {modalState !== "closed" && (
        <SecretFormModal
          initial={modalState === "add" ? null : modalState}
          onSave={handleSave}
          onClose={() => setModalState("closed")}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete ${pendingDelete.title}?`}
          description="This can't be undone. The credential will be permanently removed from your vault."
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}
