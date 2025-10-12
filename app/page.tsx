import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import VideoBackground from "@/components/video-background";
import { LayoutTextFlipText } from "@/components/layout-text-flip-text";
import { TextureButton } from "@/components/ui/texture-button";
import { ClerkTextureButton } from "@/components/ui/clerk-texture-button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col text-white overflow-hidden">
      {/* Video Background */}
      <VideoBackground
        src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/3ce795ad171c250112f6903187923b7a5a5b5248_video__1_.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Lighter overlay for better text readability */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-sky-900/10 backdrop-blur-[2px] z-10" /> */}

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6">
        <Image
          src="/logo.png"
          alt="Ollo logo"
          width={48}
          height={48}
          className="h-20 w-20"
        />
        <SignedOut>
          <SignInButton
            mode="modal"
            forceRedirectUrl="/dashboard"
            signUpForceRedirectUrl="/dashboard"
          >
            <ClerkTextureButton className="w-auto" variant="minimal">Sign In</ClerkTextureButton>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </header>

      <main className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
          <h1 className="text-6xl font-medium italic tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl font-editorial-new">
            Hardware?
          </h1>
          <LayoutTextFlipText />
        </div>
        <div>
          <SignedOut>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/dashboard"
              signInForceRedirectUrl="/dashboard"
            >
              <ClerkTextureButton className="mt-10 w-[30vw]" variant="primary">
                Get Started
              </ClerkTextureButton>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <TextureButton asChild className="mt-10 w-[30vw]" variant="primary">
              <Link href="/dashboard">Go to Dashboard</Link>
            </TextureButton>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
