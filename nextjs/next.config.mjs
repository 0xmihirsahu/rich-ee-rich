/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty");
    return config;
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;
