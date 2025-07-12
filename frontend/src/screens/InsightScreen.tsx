import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import LockedCard from '../components/LockedCard';
import MainLayout from '../components/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/apiUtils';
import { useAuth } from '../store/AuthContext';

const useInsight = (userId?: string) =>
  useQuery({
    queryKey: ['insight', userId],
    queryFn: () => apiGet(`/insight/${userId}`),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });

const InsightScreen: React.FC = () => {
  const { user } = useAuth();
  const { data: insightData, refetch } = useInsight(user?.userId);
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
      <ScrollView>
        <View>
          <Text text60B marginB-8>AI 인사이트</Text>
          <Text text80 color="#8E8E8E" marginB-16>
            아직 충분한 소개팅 데이터가 없습니다. 매칭을 시작하면 아래 정보를 AI가 분석해드립니다.
          </Text>

          <LockedCard
            icon="user"
            title="성향 분석 카드"
            description="곧 당신의 대화 스타일, 감정 점수, 맞춤 피드백이 여기에 표시됩니다."
          />
          <LockedCard
            icon="bar-chart-2"
            title="매칭 성공률 추이 그래프"
            description="3건 이상의 소개팅이 완료되면 확인할 수 있습니다."
          />
          <LockedCard
            icon="message-circle"
            title="대화 스타일 요약"
            description="첫 소개팅 이후 분석이 시작됩니다."
            sample="침착한 톤이 강점입니다."
          />
          <LockedCard
            icon="star"
            title="맞춤 피드백 예시"
            description="곧 당신만을 위한 맞춤 분석이 열립니다."
            sample="예시: 침착한 톤이 강점입니다."
          />
          <View padding-16 bg-surface br40 marginT-16 style={styles.lockedInfoBox}>
            <Text text70 color="#3897F0" marginB-4>소개팅 1회 완료 시 해금</Text>
            <Text text90 color="#8E8E8E">3문항만 답하면 AI가 당신의 연애 성향을 예측해드립니다</Text>
          </View>
        </View>
              </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  lockedInfoBox: {
    opacity: 0.8,
  },
});

export default InsightScreen; 