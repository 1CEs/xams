/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        DEVELOPMENT_BASE_API: 'http://localhost:3000/api/',
        PRODUCTION_BASE_API: 'http://api.xams.online/api/',
        MODE: 'Development'
    }
};

export default nextConfig;
