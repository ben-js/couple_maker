import { NextApiRequest, NextApiResponse } from 'next';
import DataService from '../../../lib/dataService';

const dataService = new DataService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { period } = req.query;
    
    // 임시로 토큰 검증 우회 (개발 중)
    // if (process.env.NODE_ENV === 'production') {
    //   const token = req.headers.authorization?.replace('Bearer ', '');
    //   if (!token) {
    //     return res.status(401).json({ message: 'Unauthorized' });
    //   }
    // }

    console.log('차트 데이터 조회 시작');

    let chartData = [];

    if (period === '7d') {
      // 주간 데이터 - DataService를 사용하여 가져오기
      const weekData = await getWeeklyData();
      chartData = weekData;
    } else if (period === '30d') {
      // 월간 데이터 - DataService를 사용하여 가져오기
      const monthData = await getMonthlyData();
      chartData = monthData;
    } else {
      // 기본값은 주간 데이터
      const weekData = await getWeeklyData();
      chartData = weekData;
    }

    console.log('Chart data generated:', chartData);
    res.status(200).json(chartData);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ 
      message: '차트 데이터 생성 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getWeeklyData() {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const chartData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
    
    // 해당 날짜의 시작과 끝
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 사용자 가입수
    const usersCount = await getUsersCount(startOfDay, endOfDay);
    
    // 매칭 요청수
    const matchRequestsCount = await getMatchRequestsCount(startOfDay, endOfDay);
    
    // 매칭 성사수
    const matchesCount = await getMatchesCount(startOfDay, endOfDay);

    chartData.push({
      name: dayName,
      가입수: usersCount,
      매칭요청수: matchRequestsCount,
      매칭수: matchesCount
    });
  }

  return chartData;
}

async function getMonthlyData() {
  const weeks = ['1주차', '2주차', '3주차', '4주차'];
  const chartData = [];

  for (let i = 3; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const weekName = weeks[3 - i];
    
    // 해당 주의 시작과 끝
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 사용자 가입수
    const usersCount = await getUsersCount(startOfWeek, endOfWeek);
    
    // 매칭 요청수
    const matchRequestsCount = await getMatchRequestsCount(startOfWeek, endOfWeek);
    
    // 매칭 성사수
    const matchesCount = await getMatchesCount(startOfWeek, endOfWeek);

    chartData.push({
      name: weekName,
      가입수: usersCount,
      매칭요청수: matchRequestsCount,
      매칭수: matchesCount
    });
  }

  return chartData;
}

async function getUsersCount(startDate: Date, endDate: Date) {
  try {
    const users = await dataService.getUsers();
    const filteredUsers = users.filter(user => {
      const userDate = new Date(user.created_at);
      return userDate >= startDate && userDate <= endDate;
    });
    console.log(`Users count for ${startDate.toDateString()}: ${filteredUsers.length}`);
    return filteredUsers.length;
  } catch (error) {
    console.error('Error getting users count:', error);
    return 0;
  }
}

async function getMatchRequestsCount(startDate: Date, endDate: Date) {
  try {
    const matchRequests = await dataService.getMatchingRequests();
    const filteredRequests = matchRequests.filter(request => {
      const requestDate = new Date(request.created_at);
      return requestDate >= startDate && requestDate <= endDate;
    });
    console.log(`Match requests count for ${startDate.toDateString()}: ${filteredRequests.length}`);
    return filteredRequests.length;
  } catch (error) {
    console.error('Error getting match requests count:', error);
    return 0;
  }
}

async function getMatchesCount(startDate: Date, endDate: Date) {
  try {
    const matches = await dataService.getMatchPairs();
    const filteredMatches = matches.filter(match => {
      const matchDate = new Date(match.created_at);
      return matchDate >= startDate && matchDate <= endDate;
    });
    console.log(`Matches count for ${startDate.toDateString()}: ${filteredMatches.length}`);
    return filteredMatches.length;
  } catch (error) {
    console.error('Error getting matches count:', error);
    return 0;
  }
} 