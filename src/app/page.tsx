'use client';
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ParticleScene from "@/components/ParticleScene";
import WelcomeModal from "@/components/WelcomeModal";

function HomeInner() {
  const searchParams = useSearchParams();
  const hasShareData = !!searchParams.get("data");

  // If opened via share link, hold the modal until the slideshow finishes
  const [modalCanShow, setModalCanShow] = useState(!hasShareData);
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      {showWelcome && (
        <WelcomeModal
          canShow={modalCanShow}
          onGetStarted={() => setShowWelcome(false)}
        />
      )}
      <ParticleScene
        inputVisible={!showWelcome}
        onSlideshowComplete={hasShareData ? () => setModalCanShow(true) : undefined}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
