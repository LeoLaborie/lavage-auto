/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  experimental: {
    serverActions: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Only during development
  },
  eslint: {
    ignoreDuringBuilds: true, // Only during development
  },
  outputFileTracingRoot: __dirname,
}