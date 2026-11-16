import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Em dev o SW fica off (HMR). Para testar push local: ENABLE_PWA_DEV=true no .env
  disable:
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_PWA_DEV !== "true",
  register: true,
  customWorkerSrc: "worker",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/(s\.glbimg\.com|s\.sde\.globo\.com)\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "escudos-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.glbimg.com',
        pathname: '/es/sde/f/**',
      },
      {
        protocol: 'https',
        hostname: 's.sde.globo.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
