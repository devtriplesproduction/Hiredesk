/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) {
      // Disable Webpack filesystem caching in dev to prevent hot-reload "Cannot find module" errors
      config.cache = false;
    }
    return config;
  },
};
export default nextConfig;
