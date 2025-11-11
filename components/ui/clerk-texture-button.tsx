"use client";

import { forwardRef, type ReactNode } from "react";
import { TextureButton, type UnifiedButtonProps } from "@/components/ui/texture-button";

type ClerkInjectedProps = {
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
  redirectUrl?: string;
  signUpForceRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
  forceRedirectUrl?: string;
  fallbackRedirectUrl?: string;
};

type Props = UnifiedButtonProps &
  ClerkInjectedProps & {
    className?: string;
    children: ReactNode;
  };

export const ClerkTextureButton = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  const { children, ...rest } = props;

  const sanitizedButtonProps = { ...rest } as UnifiedButtonProps & Partial<ClerkInjectedProps>;

  delete sanitizedButtonProps.afterSignInUrl;
  delete sanitizedButtonProps.afterSignUpUrl;
  delete sanitizedButtonProps.redirectUrl;
  delete sanitizedButtonProps.signUpForceRedirectUrl;
  delete sanitizedButtonProps.signUpFallbackRedirectUrl;
  delete sanitizedButtonProps.forceRedirectUrl;
  delete sanitizedButtonProps.fallbackRedirectUrl;

  return (
    <TextureButton ref={ref} {...(sanitizedButtonProps as UnifiedButtonProps)}>
      {children}
    </TextureButton>
  );
});

ClerkTextureButton.displayName = "ClerkTextureButton";
