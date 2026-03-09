'use client';
import ParticleScene from "@/components/ParticleScene";
import WelcomeModal from "@/components/WelcomeModal";
import { useState } from "react";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      <WelcomeModal onGetStarted={() => setShowWelcome(false)} />
      <ParticleScene inputVisible={!showWelcome} />
    </main>
  );
}