"use client";

import { useEffect, useState } from "react";

interface WelcomeModalProps {
  onGetStarted: () => void;
}

const steps = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="5" cy="7" r="1.5" fill="currentColor" fillOpacity="0.5" />
        <circle cx="19" cy="7" r="1.5" fill="currentColor" fillOpacity="0.5" />
        <circle cx="5" cy="17" r="1.5" fill="currentColor" fillOpacity="0.5" />
        <circle cx="19" cy="17" r="1.5" fill="currentColor" fillOpacity="0.5" />
        <circle cx="12" cy="3" r="1.5" fill="currentColor" fillOpacity="0.3" />
        <circle cx="12" cy="21" r="1.5" fill="currentColor" fillOpacity="0.3" />
      </svg>
    ),
    title: "Living particles",
    desc: "Thousands of tiny dots drift freely through space, each with its own velocity and life.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 10h10M4 14h13M4 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Type any text",
    desc: "Enter up to 20 characters and watch every particle snap into the shape of your words.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.85" />
      </svg>
    ),
    title: "Pick your colour",
    desc: "Choose from 48 curated shades — the whole swarm shifts hue in real time.",
  },
];

export default function WelcomeModal({ onGetStarted }: WelcomeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // 4 s delay, then fade in
  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 5000);
    const fadeTimer  = setTimeout(() => setVisible(true),  5080);
    return () => { clearTimeout(mountTimer); clearTimeout(fadeTimer); };
  }, []);

  // Cycle through steps
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => {
      setMounted(false);
      onGetStarted();
    }, 420);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
        visible && !leaving ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.65)" }}
    >
      {/* Glow orbs behind the card */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, #8b5cf640 0%, transparent 70%)",
          top: "calc(50% - 220px)",
          left: "calc(50% - 180px)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, #06b6d430 0%, transparent 70%)",
          top: "calc(50% + 60px)",
          left: "calc(50% + 80px)",
          filter: "blur(40px)",
        }}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md rounded-3xl border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden transition-all duration-500 ${
          visible && !leaving
            ? "scale-100 translate-y-0"
            : "scale-95 translate-y-4"
        }`}
        style={{ background: "rgba(10,10,14,0.85)", backdropFilter: "blur(32px)" }}
      >
        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(6,182,212,0.6), transparent)",
          }}
        />

        <div className="px-8 pt-10 pb-8 space-y-7">
          {/* Header */}
          <div className="space-y-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}
              />
              <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                Particle Flow
              </span>
            </div>

            <h1
              className="text-3xl font-bold leading-tight"
              style={{
                background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.45))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Georgia', serif",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome to<br />Particle Flow
            </h1>

            <p className="text-white/40 text-sm leading-relaxed font-light">
              An interactive canvas where thousands of particles collapse into
              any word you type — in whatever colour you choose.
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-2.5">
            <p className="text-white/20 text-[9px] font-medium tracking-[0.2em] uppercase">
              How it works
            </p>

            <div className="space-y-1.5">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full flex items-start gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all duration-300 ${
                    activeStep === i
                      ? "border-white/15 bg-white/6"
                      : "border-transparent bg-transparent hover:bg-white/3"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeStep === i ? "text-white" : "text-white/30"
                    }`}
                    style={
                      activeStep === i
                        ? {
                            background:
                              "linear-gradient(135deg, #8b5cf620, #06b6d420)",
                            boxShadow: "0 0 16px #8b5cf625",
                            border: "1px solid rgba(139,92,246,0.25)",
                          }
                        : { background: "rgba(255,255,255,0.04)" }
                    }
                  >
                    {step.icon}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold mb-0.5 transition-colors duration-300 ${
                        activeStep === i ? "text-white" : "text-white/35"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-xs leading-relaxed transition-colors duration-300 ${
                        activeStep === i ? "text-white/50" : "text-white/20"
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>

                  {/* Active indicator dot */}
                  {activeStep === i && (
                    <div
                      className="shrink-0 mt-1.5 w-1 h-1 rounded-full"
                      style={{ background: "linear-gradient(135deg,#8b5cf6,#06b6d4)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 pt-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`rounded-full transition-all duration-300 ${
                    activeStep === i ? "w-4 h-1" : "w-1 h-1 bg-white/20"
                  }`}
                  style={
                    activeStep === i
                      ? { background: "linear-gradient(90deg,#8b5cf6,#06b6d4)" }
                      : {}
                  }
                />
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="group relative w-full py-3.5 rounded-2xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              boxShadow: "0 4px 24px rgba(139,92,246,0.4)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 36px rgba(139,92,246,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 24px rgba(139,92,246,0.4)";
            }}
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

            <span className="relative flex items-center justify-center gap-2">
              Let's get started
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Bottom shimmer line */}
        <div
          className="absolute bottom-0 left-8 right-8 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)",
          }}
        />
      </div>
    </div>
  );
}