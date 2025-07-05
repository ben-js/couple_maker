import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Card, Text, Icon, Avatar, TouchableOpacity } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';

const CardsScreen = () => {
  const cards = [
    {
      id: 1,
      name: '김소영',
      age: 28,
      job: '디자이너',
      location: '서울시 강남구',
      date: '2024.01.15',
      status: 'pending', // pending, revealed, expired
      photoUrl: null
    },
    {
      id: 2,
      name: '이미나',
      age: 26,
      job: '회계사',
      location: '서울시 마포구',
      date: '2024.01.10',
      status: 'revealed',
      photoUrl: 'https://example.com/photo1.jpg'
    },
    {
      id: 3,
      name: '박지민',
      age: 29,
      job: '교사',
      location: '서울시 송파구',
      date: '2024.01.05',
      status: 'expired',
      photoUrl: null
    }
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기 중';
      case 'revealed': return '공개됨';
      case 'expired': return '만료됨';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.primary;
      case 'revealed': return colors.success;
      case 'expired': return colors.text.disabled;
      default: return colors.text.disabled;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>카드함</Text>
      <Text style={styles.headerSubtitle}>소개팅 상대의 프로필 카드</Text>
      
      {cards.map(card => (
        <TouchableOpacity key={card.id} style={styles.cardContainer}>
          <Card enableShadow style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{card.name}, {card.age}</Text>
                <Text style={styles.cardJob}>{card.job}</Text>
                <Text style={styles.cardLocation}>{card.location}</Text>
              </View>
              <View style={styles.cardPhoto}>
                {card.photoUrl ? (
                  <Avatar size={60} source={{ uri: card.photoUrl }} />
                ) : (
                  <View style={styles.blurredPhoto}>
                    <Icon name="user" size={30} color={colors.text.disabled} />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardDate}>소개팅: {card.date}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(card.status) }]}>
                <Text style={styles.statusText}>{getStatusText(card.status)}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
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
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...typography.h3,
    marginBottom: 4,
  },
  cardJob: {
    ...typography.bodySmall,
    marginBottom: 2,
  },
  cardLocation: {
    ...typography.small,
  },
  cardPhoto: {
    marginLeft: 16,
  },
  blurredPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...typography.small,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.small,
    color: colors.surface,
    fontWeight: '500',
  },
});

export default CardsScreen; 