"use client";

import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { useParticles } from "./useParticles";

// ── Colour palette ──────────────────────────────────────────────────────────
const COLORS = [
  // Reds & Pinks (0–7)
  { label: "Crimson", hex: "#ef4444", from: "#ef4444", to: "#991b1b" },
  { label: "Red", hex: "#dc2626", from: "#dc2626", to: "#7f1d1d" },
  { label: "Rose", hex: "#f43f5e", from: "#f43f5e", to: "#be123c" },
  { label: "Ruby", hex: "#e11d48", from: "#e11d48", to: "#881337" },
  { label: "Pink", hex: "#ec4899", from: "#ec4899", to: "#9d174d" },
  { label: "Hot Pink", hex: "#f472b6", from: "#f472b6", to: "#be185d" },
  { label: "Fuchsia", hex: "#d946ef", from: "#d946ef", to: "#86198f" },
  { label: "Magenta", hex: "#c026d3", from: "#e879f9", to: "#86198f" },

  // Purples (8–15)
  { label: "Purple", hex: "#a855f7", from: "#a855f7", to: "#6b21a8" },
  { label: "Grape", hex: "#9333ea", from: "#c084fc", to: "#581c87" },
  { label: "Violet", hex: "#8b5cf6", from: "#8b5cf6", to: "#5b21b6" },
  { label: "Lavender", hex: "#a78bfa", from: "#c4b5fd", to: "#6d28d9" },
  { label: "Indigo", hex: "#6366f1", from: "#6366f1", to: "#3730a3" },
  { label: "Iris", hex: "#818cf8", from: "#818cf8", to: "#4338ca" },
  { label: "Periwinkle", hex: "#7c3aed", from: "#a5b4fc", to: "#4338ca" },
  { label: "Plum", hex: "#7e22ce", from: "#d8b4fe", to: "#4c1d95" },

  // Blues (16–23)
  { label: "Blue", hex: "#3b82f6", from: "#3b82f6", to: "#1e3a8a" },
  { label: "Royal", hex: "#2563eb", from: "#60a5fa", to: "#1e3a8a" },
  { label: "Sky", hex: "#0ea5e9", from: "#0ea5e9", to: "#0c4a6e" },
  { label: "Cerulean", hex: "#38bdf8", from: "#7dd3fc", to: "#0369a1" },
  { label: "Cyan", hex: "#06b6d4", from: "#06b6d4", to: "#164e63" },
  { label: "Azure", hex: "#22d3ee", from: "#67e8f9", to: "#0e7490" },
  { label: "Teal", hex: "#14b8a6", from: "#14b8a6", to: "#134e4a" },
  { label: "Ocean", hex: "#0891b2", from: "#2dd4bf", to: "#164e63" },

  // Greens (24–31)
  { label: "Emerald", hex: "#10b981", from: "#10b981", to: "#064e3b" },
  { label: "Jade", hex: "#059669", from: "#34d399", to: "#065f46" },
  { label: "Green", hex: "#22c55e", from: "#22c55e", to: "#14532d" },
  { label: "Forest", hex: "#16a34a", from: "#4ade80", to: "#14532d" },
  { label: "Lime", hex: "#84cc16", from: "#84cc16", to: "#365314" },
  { label: "Chartreuse", hex: "#a3e635", from: "#d9f99d", to: "#4d7c0f" },
  { label: "Mint", hex: "#4ade80", from: "#4ade80", to: "#166534" },
  { label: "Sage", hex: "#86efac", from: "#bbf7d0", to: "#15803d" },

  // Ambers (32–39)
  { label: "Yellow", hex: "#eab308", from: "#eab308", to: "#713f12" },
  { label: "Lemon", hex: "#facc15", from: "#fef08a", to: "#a16207" },
  { label: "Amber", hex: "#f59e0b", from: "#f59e0b", to: "#78350f" },
  { label: "Honey", hex: "#fcd34d", from: "#fde68a", to: "#b45309" },
  { label: "Orange", hex: "#f97316", from: "#f97316", to: "#7c2d12" },
  { label: "Tangerine", hex: "#fb923c", from: "#fed7aa", to: "#c2410c" },
  { label: "Coral", hex: "#f87171", from: "#fca5a5", to: "#b91c1c" },
  { label: "Peach", hex: "#fdba74", from: "#ffedd5", to: "#ea580c" },

  // Special (40–47)
  { label: "White", hex: "#f1f5f9", from: "#f1f5f9", to: "#94a3b8" },
  { label: "Silver", hex: "#94a3b8", from: "#94a3b8", to: "#334155" },
  { label: "Slate", hex: "#64748b", from: "#cbd5e1", to: "#1e293b" },
  { label: "Smoke", hex: "#9ca3af", from: "#e5e7eb", to: "#374151" },
  { label: "Gold", hex: "#fbbf24", from: "#fde68a", to: "#d97706" },
  { label: "Bronze", hex: "#d97706", from: "#fcd34d", to: "#92400e" },
  { label: "Neon", hex: "#a3e635", from: "#a3e635", to: "#65a30d" },
  { label: "Electric", hex: "#22d3ee", from: "#a5f3fc", to: "#0e7490" },
];

const GROUPS = [
  { name: "Reds & Pinks", range: [0, 8] },
  { name: "Purples", range: [8, 16] },
  { name: "Blues", range: [16, 24] },
  { name: "Greens", range: [24, 32] },
  { name: "Ambers", range: [32, 40] },
  { name: "Special", range: [40, 48] },
];

// ── hex → HSL ───────────────────────────────────────────────────────────────
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h, s, l };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ParticleScene({ inputVisible = true }: { inputVisible?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState(COLORS[10]); // Violet default
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const hsl = hexToHsl(selected.hex);
  const { morphToText } = useParticles(containerRef, {
    hueBase: hsl.h,
    hueRange: 0.05,
    saturation: hsl.s,
    lightnessBase: hsl.l,
    lightnessRange: 0.25,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    morphToText("Hello, World!");
  }, [morphToText]);

  const handleSubmit = () => {
    const text = inputValue.trim();
    if (text) morphToText(text);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 w-full h-full" id="container" />

      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-xl
    transition-all duration-800 ease-[cubic-bezier(0.34,1.56,0.64,1)]
    ${inputVisible
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-8 scale-95 pointer-events-none"
          }`}
        ref={pickerRef}
      >

        {/* ── Picker popover ── */}
        <div className={`absolute bottom-full mb-3 left-0 right-0 transition-all duration-300 ${pickerOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
          }`}>
          <div className="rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-4 space-y-3">

            {/* Grouped swatches */}
            {GROUPS.map((group) => (
              <div key={group.name}>
                <p className="text-white/20 text-[9px] font-medium tracking-[0.18em] uppercase mb-1.5">
                  {group.name}
                </p>
                <div className="grid grid-cols-8 gap-1.5">
                  {COLORS.slice(group.range[0], group.range[1]).map((color) => {
                    const isActive = color.hex === selected.hex;
                    return (
                      <button
                        key={color.hex}
                        onClick={() => { setSelected(color); setPickerOpen(false); }}
                        title={color.label}
                        className="group flex flex-col items-center gap-1"
                      >
                        <div
                          className={`relative w-8 h-8 rounded-xl transition-all duration-150 group-hover:scale-110 group-hover:brightness-110 ${isActive ? "scale-110 ring-2 ring-white/50 ring-offset-2 ring-offset-black/50" : ""
                            }`}
                          style={{
                            background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                            boxShadow: isActive ? `0 0 16px ${color.hex}90` : undefined,
                          }}
                        >
                          {isActive && (
                            <svg className="absolute inset-0 m-auto" width="11" height="11" viewBox="0 0 24 24" fill="none">
                              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-white/20 text-[8px] leading-none">{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* HSL readout */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <div
                className="w-3.5 h-3.5 rounded-md shrink-0"
                style={{ background: `linear-gradient(135deg, ${selected.from}, ${selected.to})` }}
              />
              <span className="text-white/25 text-[10px] font-mono">{selected.hex.toUpperCase()}</span>
              <span className="text-white/10 text-[10px]">→</span>
              <span className="text-white/40 text-[10px] font-mono">
                hsl({Math.round(hsl.h * 360)}°, {Math.round(hsl.s * 100)}%, {Math.round(hsl.l * 100)}%)
              </span>
              <span className="ml-auto text-white/20 text-[10px] font-medium">{selected.label}</span>
            </div>
          </div>
        </div>

        {/* ── Input bar ── */}
        <div className="relative flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

          {/* Colour trigger */}
          <button
            onClick={() => setPickerOpen((p) => !p)}
            className={`relative shrink-0 w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${pickerOpen ? "ring-2 ring-white/30 ring-offset-1 ring-offset-transparent" : ""
              }`}
            style={{
              background: `linear-gradient(135deg, ${selected.from}, ${selected.to})`,
              boxShadow: `0 2px 14px ${selected.hex}70`,
            }}
            title="Pick particle colour"
          >
            <svg className="absolute inset-0 m-auto" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <path d="M12 2C6.48 2 2 6.48 2 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.9" />
              <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.85" />
            </svg>
          </button>

          <div className="w-px h-6 bg-white/10 shrink-0" />

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type something..."
            maxLength={20}
            className="flex-1 bg-transparent border-none outline-none px-3 py-3.5 text-white text-sm tracking-wide placeholder:text-white/30 font-light min-w-0"
          />

          <span className="text-white/20 text-xs font-mono pr-2 tabular-nums shrink-0">
            {inputValue.length}/20
          </span>

          <button
            onClick={handleSubmit}
            className="group relative flex items-center gap-2 px-5 py-3 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${selected.from}, ${selected.to})`,
              boxShadow: `0 2px 12px ${selected.hex}50`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 24px ${selected.hex}90`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 12px ${selected.hex}50`;
            }}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200 group-hover:translate-x-0.5 relative">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline relative">Create</span>
          </button>
        </div>
      </div>
    </>
  );
}