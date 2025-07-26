import { PutObjectCommand } from '@aws-sdk/client-s3';
import { appendLog, commonHeaders, S3Client, generateS3Path, validateFileSize, validateImageFormat } from '../utils';

const s3Client = new S3Client({ region: process.env.S3_REGION || 'ap-northeast-2' });

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = JSON.parse(event.body || '{}');
  const { userId, fileName, fileContent, fileType } = req;
  
  try {
    // 파일 검증
    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '파일명과 파일 내용이 필요합니다.'
        })
      };
    }

    if (!validateImageFormat(fileName)) {
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '지원하지 않는 이미지 형식입니다.'
        })
      };
    }

    // Base64 디코딩
    const buffer = Buffer.from(fileContent, 'base64');
    
    if (!validateFileSize(buffer)) {
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '파일 크기가 10MB를 초과합니다.'
        })
      };
    }

    // S3 경로 생성
    const s3Path = generateS3Path(userId, fileName);
    
    // S3에 업로드
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'date-sense',
        Key: s3Path,
        Body: buffer,
        ContentType: fileType || 'image/jpeg',
        Metadata: {
          userId: userId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      })
    );

    const imageUrl = `https://${process.env.S3_BUCKET_NAME || 'date-sense'}.s3.${process.env.S3_REGION || 'ap-northeast-2'}.amazonaws.com/${s3Path}`;

    await appendLog({
      type: 'upload_image',
      userId,
      result: 'success',
      message: '이미지 업로드 성공',
      detail: { fileName, s3Path, imageUrl },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      requestBody: JSON.stringify({ ...req, fileContent: '[BASE64_DATA]' }),
      responseStatus: 200,
      responseBody: JSON.stringify({ success: true, imageUrl }),
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        imageUrl,
        message: '이미지가 업로드되었습니다.'
      })
    };
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    
    await appendLog({
      type: 'upload_image',
      userId,
      result: 'fail',
      message: error.message || '이미지 업로드 중 오류가 발생했습니다.',
      detail: { fileName, error: error.message },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      requestBody: JSON.stringify({ ...req, fileContent: '[BASE64_DATA]' }),
      responseStatus: 500,
      responseBody: JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      errorStack: error.stack,
      executionTime: Date.now() - startTime,
      logLevel: 'error'
    });

    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    };
  }
}; 