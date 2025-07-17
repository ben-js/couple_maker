/**
 * S3Service - S3 업로드 URL 생성 및 파일 관련 서비스
 * @module services/s3Service
 */
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const s3Client = new S3Client({ region: config.dynamodb.region });

class S3Service {
  /**
   * S3 업로드 URL 생성
   * @param {string} fileName - 원본 파일명
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 업로드 URL 및 파일명 정보
   */
  async getUploadUrl(fileName, userId) {
    try {
      // 파일 확장자 체크
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      if (!allowedExtensions.includes(fileExtension)) {
        return {
          success: false,
          statusCode: 400,
          message: '지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp만 허용)'
        };
      }
      // 날짜 기반 경로 생성
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const uniqueFileName = `${config.s3.basePath}/${year}/${month}/${day}/${userId}/${Date.now()}-${uuidv4()}.${fileExtension}`;
      // S3 PutObject 명령
      const putObjectCommand = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: uniqueFileName,
        ContentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        Metadata: {
          'user-id': userId,
          'upload-time': new Date().toISOString(),
          'original-filename': fileName
        }
      });
      // 서명된 URL 생성
      const signedUrl = await getSignedUrl(s3Client, putObjectCommand, { 
        expiresIn: config.s3.urlExpire
      });
      return {
        success: true,
        statusCode: 200,
        message: '업로드 URL 생성 성공',
        data: {
          uploadUrl: signedUrl,
          fileKey: uniqueFileName,
          s3Url: `https://${config.s3.bucket}.s3.${config.dynamodb.region}.amazonaws.com/${uniqueFileName}`,
          expiresIn: config.s3.urlExpire
        }
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: '업로드 URL 생성 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

module.exports = new S3Service(); 