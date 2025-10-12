import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import VideoBackground from "@/components/video-background";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col text-white overflow-hidden">
      {/* Video Background */}
      <VideoBackground
        src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/3ce795ad171c250112f6903187923b7a5a5b5248_video__1_.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Lighter overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-5 z-20">
        <Image
          src="/logo.png"
          alt="Ollo logo"
          width={80}
          height={80}
          className="h-20 w-20"
        />
        <SignInButton mode="modal">
          <button className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:text-white/80">
            Sign In
          </button>
        </SignInButton>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center z-20">
        <div className="space-y-10">
          <div className="mx-auto max-w-2xl space-y-2">
            <h1 className="text-4xl font-bold italic tracking-tight sm:text-5xl font-editorial-new">
              Hardware?
            </h1>
            <div className="text-4xl font-light tracking-tight sm:text-5xl font-editorial-new">
              Now it's not so{" "}
              <LayoutTextFlip
                text=""
                words={["hard", "lonely", "frustrating", "complicated", "overwhelming"]}
                duration={2500}
              />
            </div>
          </div>
          <SignUpButton mode="modal">
            <button className="rounded-full border border-white/20 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:border-white/30 hover:bg-white/90">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </main>
    </div>
  );
}
