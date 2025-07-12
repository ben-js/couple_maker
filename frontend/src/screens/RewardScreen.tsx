import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import MainLayout from '../components/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';

const useReward = (userId?: string) =>
  useQuery({
    queryKey: ['reward', userId],
    queryFn: () => apiGet(`/reward/${userId}`),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });

const RewardScreen = () => {
  const { user } = useAuth();
  const { data: rewardData, refetch } = useReward(user?.userId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <MainLayout onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>리워드</Text>
        <Text style={{ marginTop: 12, color: '#888', fontSize: 16 }}>출석 보상, 후기 참여 포인트, VIP 조건 등</Text>
              </View>
    </MainLayout>
  );
};

export default RewardScreen; 