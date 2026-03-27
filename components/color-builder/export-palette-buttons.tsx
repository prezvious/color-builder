"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toJpeg, toPng } from "html-to-image";

import { slugifyFragment } from "@/lib/color-builder/utils";

type ExportPaletteButtonsProps = {
  targetId: string;
  paletteName: string;
};

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

export function ExportPaletteButtons({
  targetId,
  paletteName,
}: ExportPaletteButtonsProps) {
  const [pendingFormat, setPendingFormat] = useState<"png" | "jpg" | null>(null);

  const exportImage = async (format: "png" | "jpg") => {
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    setPendingFormat(format);

    try {
      const fileName = `${slugifyFragment(paletteName)}.${format === "png" ? "png" : "jpg"}`;
      const options = {
        cacheBust: true,
        pixelRatio: 2,
        canvasWidth: 1600,
        canvasHeight: 900,
        backgroundColor: "#F6EFE3",
      };

      if (format === "png") {
        const dataUrl = await toPng(target, options);
        downloadDataUrl(dataUrl, fileName);
      } else {
        const dataUrl = await toJpeg(target, {
          ...options,
          quality: 0.96,
        });
        downloadDataUrl(dataUrl, fileName);
      }
    } finally {
      setPendingFormat(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="studio-button studio-button-secondary"
        type="button"
        onClick={() => exportImage("png")}
        disabled={pendingFormat !== null}
      >
        <Download className="size-4" />
        {pendingFormat === "png" ? "Rendering PNG" : "Download PNG"}
      </button>
      <button
        className="studio-button studio-button-secondary"
        type="button"
        onClick={() => exportImage("jpg")}
        disabled={pendingFormat !== null}
      >
        <Download className="size-4" />
        {pendingFormat === "jpg" ? "Rendering JPG" : "Download JPG"}
      </button>
    </div>
  );
}
