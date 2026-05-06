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
import { join, resolve } from 'path';

const helperDirName = join(process.cwd(), 'app/lib/email', 'helpersHbs');
// const nextConfig: NextConfig = {
//   reactStrictMode: true,
//   // swcMinify is no longer needed – it's enabled by default in Next.js 15+
//   // Remove the eslint option entirely – it belongs in ESLint config files now
//   // If you need to ignore ESLint during builds, use:
//   // eslint: { ignoreDuringBuilds: true } // But this is also deprecated; better to fix ESLint separately
// };
const nextConfig: NextConfig = {
  webpack: (config, { isServer: _isServer }) => {
    config.module.rules.push({
      test: /\.hbs$/,
      use: [
        {
          loader: 'handlebars-loader',
          options: {
            strict: true,
            noEscape: true,
            helperDirs: [resolve(helperDirName)],
          },
        },
      ],
    });
    return config;
  },

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
        hostname: '*.ufs.sh',
        port: '',
        pathname: '/**',
      },
      // Add the following for Pexels images
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      // ADD THIS BLOCK
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  turbopack: {
    rules: {
      '*.hbs': {
        loaders: [
          {
            loader: 'handlebars-loader',
            options: {
              strict: true,
              noEscape: true,
              helperDirs: [resolve(helperDirName)],
            },
          },
        ],
        as: '*.js',   // ← required: output JavaScript
      },
    },
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
