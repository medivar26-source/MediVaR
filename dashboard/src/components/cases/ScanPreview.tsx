"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ImageOff } from "lucide-react";

const DicomViewer = dynamic(() => import("./DicomViewer"), { ssr: false });

/** True for DICOM files, judged by the path (query string and signed-URL tokens ignored). */
export function isDicomUrl(src: string): boolean {
  const path = src.split("?")[0].toLowerCase();
  return path.endsWith(".dcm") || path.endsWith(".dcim");
}

/**
 * A scan thumbnail that works for both ordinary images and DICOM. A browser cannot show a
 * .dcm in an <img>, so those go through the Cornerstone viewer; anything that fails to load
 * shows a labelled placeholder instead of an empty box.
 */
export function ScanPreview({
  src,
  alt,
  height = 220,
  className,
}: {
  src: string;
  alt: string;
  height?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} could not be loaded`}
        className={className}
        style={{
          height,
          display: "grid",
          placeItems: "center",
          background: "var(--surface-sunken)",
          color: "var(--text-muted)",
          fontSize: "var(--t-caption)",
          borderRadius: "var(--r-sm)",
          border: "var(--bw) solid var(--border)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}>
          <ImageOff width={16} height={16} aria-hidden="true" /> Scan could not be loaded
        </span>
      </div>
    );
  }

  if (isDicomUrl(src)) {
    return (
      <div className={className} style={{ height, width: "100%", borderRadius: "var(--r-sm)", overflow: "hidden", border: "var(--bw) solid var(--border)", background: "#000" }}>
        <DicomViewer src={src} alt={alt} style={{ height: "100%", width: "100%" }} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        height,
        objectFit: "contain",
        background: "#000",
        borderRadius: "var(--r-sm)",
        border: "var(--bw) solid var(--border)",
      }}
    />
  );
}
