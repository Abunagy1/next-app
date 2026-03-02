// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   typescript: {
//     ignoreBuildErrors: true,
//   },
// };
// module.exports = nextConfig;
// next.config.ts

import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   reactStrictMode: true,
//   // swcMinify is no longer needed – it's enabled by default in Next.js 15+
//   // Remove the eslint option entirely – it belongs in ESLint config files now
//   // If you need to ignore ESLint during builds, use:
//   // eslint: { ignoreDuringBuilds: true } // But this is also deprecated; better to fix ESLint separately
// };



const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh',        // ✅ This wildcard covers your subdomain and any future ones
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
// const nextConfig: NextConfig = {
//   /* config options here */
//   eslint: {
//     // Only run ESLint on these directories during production builds (next build)
//     dirs: ['app', 'components', 'lib', 'pages'],
//   },
// };


// export default nextConfig;
