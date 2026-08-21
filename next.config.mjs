/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/auth/reset-password',
        destination: '/reset-password',
      },
      {
        source: '/auth/login',
        destination: '/login',
      },
      {
        source: '/auth/register',
        destination: '/register',
      },
      {
        source: '/auth/forgot-password',
        destination: '/forgot-password',
      },
      {
        source: '/auth/verify',
        destination: '/verify',
      },
      {
        source: '/auth/verify-phone',
        destination: '/verify-phone',
      },
    ]
  },
}

export default nextConfig
