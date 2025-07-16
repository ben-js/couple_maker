import React, { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { colors } from '@/constants';
import { useRoute } from '@react-navigation/native';
import PageLayout from '../components/PageLayout';
import { apiGet } from '@/utils/apiUtils';

const API_PATHS: Record<string, string> = {
  terms: '/terms',
  privacy: '/privacy',
  customer: '/customer-service',
};

const DEFAULT_TITLE: Record<string, string> = {
  terms: '이용약관',
  privacy: '개인정보처리방침',
  customer: '고객센터 안내',
};

const TermsScreen = () => {
  const route = useRoute<any>();
  const type = route.params?.type || 'terms';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const json = await apiGet(API_PATHS[type]);
        setData(json);
      } catch (e: any) {
        setError('정책 문서를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  return (
    <PageLayout title={data?.title || DEFAULT_TITLE[type]}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text color={colors.error}>{error}</Text>
      ) : (
        <ScrollView>
          <Text>{data?.content}</Text>
        </ScrollView>
      )}
    </PageLayout>
  );
};

export default TermsScreen; 