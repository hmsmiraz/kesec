"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import PasswordInput from "./PasswordInput";
import type { Secret, SecretInput } from "@/lib/types";

const fieldClass =
  "w-full rounded-lg bg-ink-900 border border-ink-700 px-3 py-2 text-sm text-parchment placeholder:text-ink-600 focus:border-brass outline-none transition-colors";

interface SecretFormModalProps {
  initial?: Secret | null;
  onSave: (data: SecretInput) => Promise<void>;
  onClose: () => void;
}

export default function SecretFormModal({ initial, onSave, onClose }: SecretFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(initial);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        username: username.trim() || undefined,
        password,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-ink-900 border border-ink-800 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800 shrink-0">
          <h2 id="secret-form-title" className="font-display font-semibold text-parchment">
            {isEdit ? "Edit credential" : "Add credential"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-parchment-dim hover:text-parchment transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="title" className="block text-sm text-parchment-dim mb-1.5">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gmail"
              required
              autoFocus
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm text-parchment-dim mb-1.5">
              Username or email
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@gmail.com"
              className={`${fieldClass} font-mono`}
            />
          </div>

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter or generate a password"
            required
          />

          <div>
            <label htmlFor="url" className="block text-sm text-parchment-dim mb-1.5">
              Website <span className="text-ink-600">(optional)</span>
            </label>
            <input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://gmail.com"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm text-parchment-dim mb-1.5">
              Notes <span className="text-ink-600">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rust-bright">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-ink-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm text-parchment-dim hover:text-parchment hover:bg-ink-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brass text-ink-950 hover:bg-brass-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add credential"}
          </button>
        </div>
      </form>
    </div>
  );
}
