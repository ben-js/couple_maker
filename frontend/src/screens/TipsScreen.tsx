import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Card, Text, Icon } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';

const TipsScreen = () => {
  const tips = [
    {
      id: 1,
      title: '첫 만남 데이트룩',
      content: '깔끔하고 편안한 스타일을 추천합니다. 과도한 화장보다는 자연스러운 메이크업이 좋아요.',
      icon: 'star',
      category: '패션'
    },
    {
      id: 2,
      title: '편안한 대화 주제',
      content: '직업, 취미, 여행 경험 등 서로의 관심사를 자연스럽게 나누어보세요.',
      icon: 'message-circle',
      category: '대화'
    },
    {
      id: 3,
      title: '좋은 만남 장소',
      content: '카페, 공원, 박물관 등 대화하기 좋은 장소를 선택하는 것이 좋습니다.',
      icon: 'map-pin',
      category: '장소'
    },
    {
      id: 4,
      title: '기념품 아이디어',
      content: '작은 꽃다발이나 디저트 등 간단한 선물로 좋은 인상을 남겨보세요.',
      icon: 'gift',
      category: '선물'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>소개팅 팁</Text>
      <Text style={styles.headerSubtitle}>성공적인 소개팅을 위한 꿀팁들</Text>
      
      {tips.map(tip => (
        <Card key={tip.id} enableShadow style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Icon name={tip.icon} size={24} color={colors.primary} />
            <View style={styles.tipInfo}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipCategory}>{tip.category}</Text>
            </View>
          </View>
          <Text style={styles.tipContent}>{tip.content}</Text>
        </Card>
      ))}
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  headerTitle: {
    ...typography.h1,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.disabled,
    marginBottom: 24,
  },
  tipCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipInfo: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  tipCategory: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '500',
  },
  tipContent: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
});

export default TipsScreen; 