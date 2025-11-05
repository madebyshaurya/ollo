import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.mouser.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.digikey.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.jlcpcb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lcsc.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pcbway.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sparkfun.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
