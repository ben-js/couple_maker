import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HeaderLayout from '../components/HeaderLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';

const useHistory = (userId?: string) =>
  useQuery({
    queryKey: ['history', userId],
    queryFn: () => apiGet(`/history/${userId}`),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });

const HistoryScreen = () => {
  const { user } = useAuth();
  const { data: historyData, refetch } = useHistory(user?.userId);
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
    <HeaderLayout onRefresh={handleRefresh} refreshing={refreshing}>
      {/* 기존 코드 ... */}
      <View>
        {/* historyData 등 기존 화면 내용 렌더링 */}
      </View>
    </HeaderLayout>
  );
}

export default HistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 12,
    color: '#888',
    fontSize: 16,
  },
}); 