import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    // 개발 중에는 기본 Admin 계정으로 처리
    const managerId = 'manager_1752927754902_jdt96co74';

    // 현재 매니저 정보 조회
    const getCommand = new GetCommand({
      TableName: 'Managers',
      Key: { id: managerId }
    });

    const managerResponse = await docClient.send(getCommand);
    
    if (!managerResponse.Item) {
      return res.status(404).json({ message: '매니저를 찾을 수 없습니다.' });
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, managerResponse.Item.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    const updateCommand = new UpdateCommand({
      TableName: 'Managers',
      Key: { id: managerId },
      UpdateExpression: 'SET password = :password, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':password': hashedNewPassword,
        ':updated_at': new Date().toISOString()
      }
    });

    await docClient.send(updateCommand);

    console.log('✅ 비밀번호 변경 성공:', managerResponse.Item.email);

    return res.status(200).json({ 
      message: '비밀번호가 성공적으로 변경되었습니다.' 
    });

  } catch (error) {
    console.error('❌ 비밀번호 변경 실패:', error);
    return res.status(500).json({ 
      message: '비밀번호 변경 중 오류가 발생했습니다.' 
    });
  }
} 