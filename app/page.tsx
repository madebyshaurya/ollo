import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import VideoBackground from "@/components/video-background";
import { LayoutTextFlipText } from "@/components/layout-text-flip-text";
import { TextureButton } from "@/components/ui/texture-button";
import { ClerkTextureButton } from "@/components/ui/clerk-texture-button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-white">
      <VideoBackground
        src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/3ce795ad171c250112f6903187923b7a5a5b5248_video__1_.mp4"
      />

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
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12 min-w-[48px] min-h-[48px]",
                  userButtonAvatarBox: "w-12 h-12 min-w-[48px] min-h-[48px]",
                  userButtonAvatarImage: "w-12 h-12 min-w-[48px] min-h-[48px]",
                }
              }}
            />
          </div>
        </SignedIn>
      </header>

      <main className="relative z-20 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
          <h1 className="text-6xl font-medium italic tracking-tight text-transparent sm:text-7xl md:text-8xl font-editorial-new"
            style={{
              WebkitTextStroke: '1px rgba(255, 255, 255, 0.8)',
              textShadow: '0 0 2px rgba(255, 255, 255, 0.3)'
            }}>
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
