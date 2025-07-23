import type { NextApiRequest, NextApiResponse } from 'next';
 
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: 실제 데이터 로직 구현
  res.status(200).json({ items: [] });
} 