/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  /**
   * Proxy /api/* → FastAPI backend (localhost:8000).
   * This means the worker can use relative URLs like '/api/ml/embed'
   * and Next.js forwards them to Python — no CORS issues.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
