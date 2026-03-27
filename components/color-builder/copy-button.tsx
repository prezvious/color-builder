"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

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

  const handleClick = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button className={className} type="button" onClick={handleClick}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? successLabel : label}
    </button>
  );
}
