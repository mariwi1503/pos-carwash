import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  serverExternalPackages: ['mongodb'],
};

export default nextConfig;
