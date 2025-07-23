/**
 * AWS 공통 설정
 * @module config/aws
 * @description Admin에서 모든 AWS 서비스에서 공통으로 사용하는 설정
 */
export const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
}; 