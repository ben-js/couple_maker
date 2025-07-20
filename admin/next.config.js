/** @type {import('next').NextConfig} */
const nextConfig = {
  // AWS Amplify Hosting 최적화
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  
  // 이미지 도메인 설정
  images: {
    domains: ['localhost', 'api.datesense.com', '*.amplifyapp.com'],
    unoptimized: true, // AWS Amplify에서 권장
  },
  
  // 환경 변수 설정
  env: {
    AWS_REGION: 'ap-northeast-2',
    AWS_ACCESS_KEY_ID: 'AKIAU2GJ5ZJPVVVU5C4W',
    AWS_SECRET_ACCESS_KEY: '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',
    NEXT_PUBLIC_API_BASE_URL: 'http://192.168.219.100:3001',
  },
  
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  // AWS Amplify에서 권장하는 설정
  trailingSlash: false,
  generateEtags: false,
  
  // 웹팩 설정 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 