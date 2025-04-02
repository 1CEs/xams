/** @type {import('next').NextConfig} */
const nextConfig = {
  crossOrigin: "anonymous",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*", // Allows any hostname with https, not recommended for production
        // Or use a more specific pattern like:
        // hostname: "example.com",
        // Or allow wildcard subdomains with:
        // hostname: "*.example.com",
      },
    ],
  },
  env: {
    DEVELOPMENT_BASE_API: 'http://localhost:3000/api/',
    PRODUCTION_BASE_API: 'https://api.xams.online/api/',
    MODE: 'Development',
  },
};

export default nextConfig;
