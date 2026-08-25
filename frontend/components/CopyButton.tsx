"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) - fail silently, nothing to recover.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-parchment-dim hover:text-brass hover:bg-ink-800 transition-colors cursor-pointer"
    >
      {copied ? <Check size={14} className="text-sage-bright" /> : <Copy size={14} />}
    </button>
  );
}
