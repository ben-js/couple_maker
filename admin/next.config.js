/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    AWS_REGION: 'ap-northeast-2',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  images: {
    domains: ['date-sense-profile-images.s3.ap-northeast-2.amazonaws.com'],
  },
}

module.exports = nextConfig 