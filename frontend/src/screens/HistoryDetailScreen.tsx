import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import PageLayout from '../components/PageLayout';
import { RouteProp, useRoute } from '@react-navigation/native';
import { HistoryItem } from '../types/history';
import { apiGet } from '../utils/apiUtils';
import { useAuth } from '../store/AuthContext';

// 확장 타입 예시 (실제 데이터 구조에 맞게 조정)
interface HistoryDetailItem extends HistoryItem {
  matchTimeline?: Array<{ label: string; date: string }>;
  review?: {
    appearance?: number;
    conversation?: number;
    manners?: number;
    honesty?: number;
    wantToMeetAgain?: boolean;
    tags?: string[];
    comment?: string;
    overallSatisfaction?: number;
    dateDuration?: string;
    locationSatisfaction?: number;
    conversationInitiative?: string;
    firstImpressionVsReality?: string;
    successFailureFactors?: string[];
    rating?: {
      appearance?: number;
      conversation?: number;
      manners?: number;
      honesty?: number;
    };
  };
  partnerName?: string;
  partnerGender?: string;
  partnerAge?: string;
  partnerJob?: string;
  partnerMbti?: string;
  contact?: string;
  partner?: any;
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '소개팅 완료';
    case 'exchanged': return '연락처 교환';
    case 'finished': return '소개팅 종료';
    case 'failed': return '매칭 실패';
    default: return status;
  }
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const HistoryDetailScreen = () => {
  const route = useRoute<RouteProp<any, 'HistoryDetail'>>();
  const { matchPairId, history: initialHistory } = route.params as { matchPairId: string, history?: HistoryItem };
  const { user } = useAuth();

  const [history, setHistory] = useState<HistoryDetailItem | null>(initialHistory || null);
  const [loading, setLoading] = useState(!initialHistory);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchPairId) return;
    setLoading(true);
    setError(null);
    apiGet(`/history/detail/${matchPairId}`)
      .then((data) => {
        // 내 userId와 일치하는 reviewA/reviewB를 review로 가공
        let review = undefined;
        if (data.reviewA && data.reviewA.reviewerId === user?.userId) review = data.reviewA;
        if (data.reviewB && data.reviewB.reviewerId === user?.userId) review = data.reviewB;
        setHistory({ ...data, review, status: data.finalStatus });
        setLoading(false);
      })
      .catch((err) => {
        setError('상세 정보를 불러올 수 없습니다.');
        setLoading(false);
      });
  }, [matchPairId, user?.userId]);

  if (loading) {
    return (
      <PageLayout title="히스토리 상세">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>상세 정보를 불러오는 중...</Text>
        </View>
      </PageLayout>
    );
  }
  if (error || !history) {
    return (
      <PageLayout title="히스토리 상세">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red' }}>{error || '상세 정보가 없습니다.'}</Text>
        </View>
      </PageLayout>
    );
  }

  // 매칭 타임라인 예시
  const timeline = history.matchTimeline || [
    { label: '신청일', date: history.createdAt },
    // ... 필요시 추가 (매칭일, 확정일, 후기 작성일, 연락처 교환일 등)
  ];

  // 나이 계산 함수
  const calculateAge = (birthDate?: { year: number; month: number; day: number }) => {
    if (!birthDate) return undefined;
    const today = new Date();
    const birth = new Date(birthDate.year, birthDate.month - 1, birthDate.day);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <PageLayout title="히스토리 상세">
      <View style={{ marginTop: 10}}>
        <Section title="상대방 정보">
          <InfoRow label="이름" value={history.partner?.name || '-'} />
          <InfoRow label="나이" value={history.partner?.birthDate ? `${calculateAge(history.partner.birthDate)}세` : '-'} />
          <InfoRow label="직업" value={history.partner?.job || '-'} />
          <InfoRow label="MBTI" value={history.partner?.mbti || '-'} />
        </Section>
      </View>
      <Section title="매칭 정보">
        <InfoRow label="매칭 일시" value={history.createdAt ? new Date(history.createdAt).toLocaleString() : '-'} />
        <InfoRow label="진행 단계" value={getStatusText(history.status) || '-'} />
      </Section>
      <Section title="내가 남긴 후기/평점">
        <InfoRow label="외모" value={history.review?.rating?.appearance?.toString() || '-'} />
        <InfoRow label="대화력" value={history.review?.rating?.conversation?.toString() || '-'} />
        <InfoRow label="매너" value={history.review?.rating?.manners?.toString() || '-'} />
        <InfoRow label="진정성" value={history.review?.rating?.honesty?.toString() || '-'} />
        <InfoRow label="재만남 의사" value={history.review?.wantToMeetAgain === true ? '예' : history.review?.wantToMeetAgain === false ? '아니오' : '-'} />
        <InfoRow label="태그" value={history.review?.tags?.join(', ') || '-'} />
        <InfoRow label="코멘트" value={history.review?.comment || '-'} />
        <InfoRow label="전체 만족도" value={history.review?.overallSatisfaction?.toString() || '-'} />
        <InfoRow label="소개팅 지속 시간" value={history.review?.dateDuration || '-'} />
        <InfoRow label="장소 만족도" value={history.review?.locationSatisfaction?.toString() || '-'} />
        <InfoRow label="대화 주도성" value={history.review?.conversationInitiative || '-'} />
        <InfoRow label="첫인상 vs 실제인상" value={history.review?.firstImpressionVsReality || '-'} />
        <InfoRow label="성공/실패 요인" value={Array.isArray(history.review?.successFailureFactors) ? history.review.successFailureFactors.join(', ') : (history.review?.successFailureFactors || '-')} />
      </Section>
      <Section title="매칭 과정 타임라인">
        {timeline.map((t, idx) => (
          <InfoRow key={idx} label={t.label} value={t.date ? new Date(t.date).toLocaleString() : '-'} />
        ))}
      </Section>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  sectionTitle: { fontWeight: 'bold', fontSize: 17, marginBottom: 8, color: '#222' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontWeight: '500', color: '#666', fontSize: 15 },
  infoValue: { fontSize: 15, color: '#222', flexShrink: 1, textAlign: 'right' },
});

export default HistoryDetailScreen; 