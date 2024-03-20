/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      fallback: { ...config.resolve.fallback, fs: false },
    },
  }),
};

module.exports = nextConfig;
