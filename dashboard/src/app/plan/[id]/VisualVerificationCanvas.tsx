"use client";

import React from "react";

interface VisualVerificationCanvasProps {
  assessment: Record<string, any>;
  femoral: Record<string, any>;
  tibial: Record<string, any>;
}

export function VisualVerificationCanvas({ assessment: _assessment, femoral, tibial }: VisualVerificationCanvasProps) {
  // Demo canvas showing summary visualization
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", backgroundColor: "#e2e8f0", borderRadius: "1rem", marginRight: "0.5rem" }}>
            Femoral: Size {femoral?.size || "-"}
          </span>
          <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", backgroundColor: "#e2e8f0", borderRadius: "1rem", marginRight: "0.5rem" }}>
            Tibial: Size {tibial?.traySize || "-"}
          </span>
          <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", backgroundColor: "#e2e8f0", borderRadius: "1rem" }}>
            Poly: {tibial?.polyThickness || "-"} mm
          </span>
        </div>
        <svg width="120" height="200" viewBox="0 0 120 200" style={{ margin: "0 auto" }}>
           {/* Abstract Femur */}
           <path d="M 40 20 C 40 50, 45 80, 45 100 C 45 120, 30 130, 30 140 C 30 155, 45 160, 50 160 C 55 160, 60 155, 60 150 C 60 145, 55 140, 55 130 C 55 110, 60 80, 60 50 L 40 20" fill="#cbd5e1" />
           <path d="M 80 20 C 80 50, 75 80, 75 100 C 75 120, 90 130, 90 140 C 90 155, 75 160, 70 160 C 65 160, 60 155, 60 150 C 60 145, 65 140, 65 130 C 65 110, 60 80, 60 50 L 80 20" fill="#cbd5e1" />
           {/* Femoral Implant */}
           <path d="M 25 140 C 25 170, 50 165, 60 155 C 70 165, 95 170, 95 140 L 90 135 C 90 155, 75 155, 60 145 C 45 155, 30 155, 30 135 Z" fill="#64748b" />
           
           {/* Abstract Tibia */}
           <path d="M 35 170 L 85 170 L 75 250 L 45 250 Z" fill="#cbd5e1" />
           {/* Tibial Tray + Poly */}
           <rect x="30" y="170" width="60" height="6" fill="#334155" rx="1" />
           <rect x="32" y="163" width="56" height="7" fill="#94a3b8" rx="2" />
        </svg>
      </div>
    </div>
  );
}
