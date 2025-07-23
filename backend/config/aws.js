/**
 * AWS 공통 설정
 * @module config/aws
 * @description 모든 AWS 서비스에서 공통으로 사용하는 설정
 */

const AWS_CONFIG = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};
module.exports = AWS_CONFIG;