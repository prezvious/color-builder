"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";

type CopyButtonProps = {
  value: string;
  label?: string;
  successLabel?: string;
  className?: string;
};

export function CopyButton({
  value,
  label = "Copy",
  successLabel = "Copied",
  className = "studio-button studio-button-secondary",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1800);
    }
  };

  return (
    <button className={className} type="button" onClick={handleClick}>
      {failed ? <AlertTriangle className="size-4" /> : copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {failed ? "Failed" : copied ? successLabel : label}
    </button>
  );
}
