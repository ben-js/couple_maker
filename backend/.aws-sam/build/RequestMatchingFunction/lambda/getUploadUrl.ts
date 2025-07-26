import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { appendLog, commonHeaders, S3Client, generateS3Path } from '../utils';

const s3Client = new S3Client({ region: process.env.S3_REGION || 'ap-northeast-2' });

export const handler = async (event: any) => {
  const startTime = Date.now();
  const req = JSON.parse(event.body || '{}');
  const { userId, fileName, fileType } = req;
  
  try {
    if (!userId || !fileName) {
      return {
        statusCode: 400,
        headers: commonHeaders,
        body: JSON.stringify({
          success: false,
          message: '사용자 ID와 파일명이 필요합니다.'
        })
      };
    }

    // S3 경로 생성
    const s3Path = generateS3Path(userId, fileName);
    
    // Presigned URL 생성
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'date-sense',
      Key: s3Path,
      ContentType: fileType || 'image/jpeg'
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1시간 유효

    await appendLog({
      type: 'get_upload_url',
      userId,
      result: 'success',
      message: '업로드 URL 생성 성공',
      detail: { fileName, s3Path },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      requestBody: JSON.stringify(req),
      responseStatus: 200,
      responseBody: JSON.stringify({ success: true, uploadUrl }),
      executionTime: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({
        success: true,
        uploadUrl,
        s3Path
      })
    };
  } catch (error: any) {
    console.error('업로드 URL 생성 오류:', error);
    
    await appendLog({
      type: 'get_upload_url',
      userId,
      result: 'fail',
      message: error.message || '업로드 URL 생성 중 오류가 발생했습니다.',
      detail: { fileName, error: error.message },
      requestMethod: event.httpMethod,
      requestPath: event.path,
      requestBody: JSON.stringify(req),
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