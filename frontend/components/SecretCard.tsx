"use client";

import { useState } from "react";
import { Clock, Eye, EyeOff, ExternalLink, Pencil, StickyNote, Trash2, User as UserIcon } from "lucide-react";
import CopyButton from "./CopyButton";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/formatDate";
import type { Secret } from "@/lib/types";

interface SecretCardProps {
  secret: Secret;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SecretCard({ secret, onEdit, onDelete }: SecretCardProps) {
  const [revealed, setRevealed] = useState(false);

  let hostname = "";
  if (secret.url) {
    try {
      hostname = new URL(secret.url).hostname.replace(/^www\./, "");
    } catch {
      hostname = secret.url;
    }
  }

  return (
    <div className="rounded-xl bg-ink-900 border border-ink-800 p-4 hover:border-ink-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-parchment truncate">{secret.title}</h3>
          {secret.url && (
            <a
              href={secret.url.startsWith("http") ? secret.url : `https://${secret.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-parchment-dim hover:text-brass transition-colors truncate"
            >
              {hostname}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${secret.title}`}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-parchment-dim hover:text-brass hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${secret.title}`}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-parchment-dim hover:text-rust-bright hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {secret.username && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-ink-850 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon size={13} className="text-ink-600 shrink-0" />
              <span className="font-mono text-sm text-parchment-dim truncate">{secret.username}</span>
            </div>
            <CopyButton value={secret.username} label="username" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 rounded-lg bg-ink-850 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Hide password" : "Show password"}
              className="text-ink-600 hover:text-brass transition-colors cursor-pointer shrink-0"
            >
              {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <span className="font-mono text-sm text-parchment-dim truncate">
              {revealed ? secret.password : "•".repeat(Math.min(secret.password.length, 16))}
            </span>
          </div>
          <CopyButton value={secret.password} label="password" />
        </div>
      </div>

      {secret.notes && (
        <div className="mt-2.5 flex items-start gap-2 px-1">
          <StickyNote size={12} className="text-ink-600 shrink-0 mt-0.5" />
          <p className="text-xs text-parchment-dim leading-relaxed">{secret.notes}</p>
        </div>
      )}

      <div
        className="mt-2.5 flex items-center gap-1.5 px-1 text-xs text-ink-600"
        title={`Last updated ${formatAbsoluteTime(secret.updated_at)}`}
      >
        <Clock size={11} />
        <span>Updated {formatRelativeTime(secret.updated_at)}</span>
      </div>
    </div>
  );
}
