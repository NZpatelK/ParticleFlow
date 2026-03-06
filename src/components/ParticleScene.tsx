"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { useParticles } from "./useParticles";

export default function ParticleScene() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { morphToText } = useParticles(containerRef);
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = () => {
        const text = inputValue.trim();
        if (text) {
            morphToText(text);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSubmit();
    };

    return (
        <>
            <div ref={containerRef} className="fixed inset-0 w-full h-full" id="container" />

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-xl px-4">
                <div className="flex gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)] hover:bg-white/15 hover:border-white/30 hover:shadow-[0_4px_30px_-1px_rgba(0,0,0,0.3)] transition-all duration-300">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type something..."
                        maxLength={20}
                        className="flex-1 bg-transparent border-none outline-none px-5 py-4 text-white text-base font-medium placeholder:text-white/50"
                    />
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-red-500 bg-linear-to-br from-indigo-500 to-indigo-600 border-none px-6 py-3 text-white rounded-xl font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-px hover:shadow-[0_4px_20px_-2px_rgba(79,70,229,0.5)] active:translate-y-px"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:translate-x-1">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
            </div>
        </>
    );
}