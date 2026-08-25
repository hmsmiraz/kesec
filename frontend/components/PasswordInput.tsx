"use client";

import { useId, useState } from "react";
import { Dices, Eye, EyeOff } from "lucide-react";
import { generatePassword } from "@/lib/generatePassword";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  allowGenerate?: boolean;
}

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  allowGenerate = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-parchment-dim mb-1.5">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            className="w-full rounded-lg bg-ink-900 border border-ink-700 px-3 py-2 pr-10 font-mono text-sm text-parchment placeholder:text-ink-600 focus:border-brass outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-parchment-dim hover:text-brass transition-colors cursor-pointer"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {allowGenerate && (
          <button
            type="button"
            onClick={() => {
              onChange(generatePassword());
              setVisible(true);
            }}
            title="Generate a strong password"
            aria-label="Generate a strong password"
            className="shrink-0 inline-flex items-center justify-center w-10 rounded-lg border border-ink-700 text-parchment-dim hover:text-brass hover:border-brass transition-colors cursor-pointer"
          >
            <Dices size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
