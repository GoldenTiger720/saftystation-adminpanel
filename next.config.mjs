/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase the body size limit for server actions to handle large PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
