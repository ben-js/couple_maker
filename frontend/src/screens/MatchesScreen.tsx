import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { ProgressBar } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';

const MatchesScreen = ({ navigation }) => {
  // 목업 데이터
  const getRandomPercent = () => Math.floor(Math.random() * 20) + 80;

  const renderCard = ({ item }: { item: any }) => {
    const images = item.photos ? (Array.isArray(item.photos) ? item.photos : [item.photos]) : [];
    const matchPercent = item.matchPercent || getRandomPercent();
    const matchStatus = item.matchStatus || 'liked'; // liked, chatting, matched, none
    const getStatusInfo = (status: string) => {
      switch(status) {
        case 'liked': return { text: '좋아요', color: '#E94F4F', icon: 'heart' };
        case 'chatting': return { text: '대화중', color: '#4CAF50', icon: 'message-circle' };
        case 'matched': return { text: '매칭완료', color: '#2196F3', icon: 'check-circle' };
        default: return { text: '새로운', color: '#FF9800', icon: 'star' };
      }
    };
    const statusInfo = getStatusInfo(matchStatus);
    return (
      <TouchableOpacity style={styles.cardWrap} onPress={() => navigation.navigate('UserDetail', { userId: item.userId })}>
        <View style={styles.cardImageWrap}>
          {images[0] ? (
            <Image source={{ uri: images[0] }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, { backgroundColor: '#f5f6fa', justifyContent: 'center', alignItems: 'center' }] }>
              <Feather name="user" size={40} color={'#bbb'} />
            </View>
          )}
          {/* 매칭 상태 배지 */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Feather name={statusInfo.icon as any} size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.cardInfoWrap}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardAge}>{item.age}세</Text>
            <Text style={styles.cardRegion}>{item.region && typeof item.region === 'object' ? `${item.region.region || ''} ${item.region.district || ''}`.trim() : item.region || ''}</Text>
          </View>
          <Text style={styles.cardJob}>{item.job}</Text>
          <View style={styles.cardStatusRow}>
            <View style={[styles.statusChip, { backgroundColor: statusInfo.color + '20' }]}>
              <Feather name={statusInfo.icon as any} size={12} color={statusInfo.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>
          </View>
          <View style={styles.cardPercentRow}>
            <View style={styles.cardPercentCircleWrap}>
              <View style={styles.cardPercentCircleBg} />
              <Text style={styles.cardPercentText}>{matchPercent}%</Text>
            </View>
            <ProgressBar progress={matchPercent/100} style={styles.cardPercentBar} progressColor={'#E94F4F'} />
          </View>
          <View style={styles.cardTagsWrap}>
            {(item.tags || []).map((tag: string, i: number) => (
              <View key={i} style={styles.cardTagChip}>
                <Text style={styles.cardTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>매칭된 상대 화면 (MatchesScreen)</Text>
    </View>
  );
};

const styles = {
  cardWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    marginHorizontal: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden' as const,
    marginRight: 16,
    backgroundColor: '#f5f6fa',
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  cardInfoWrap: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#222',
    marginRight: 6,
  },
  cardAge: {
    fontSize: 16,
    color: '#E94F4F',
    fontWeight: '600' as const,
    marginRight: 6,
  },
  cardRegion: {
    fontSize: 14,
    color: '#888',
  },
  cardJob: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardPercentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  cardPercentCircleWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
    position: 'relative' as const,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPercentCircleBg: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#E94F4F',
    opacity: 0.18,
  },
  cardPercentText: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: '#E94F4F',
  },
  cardPercentBar: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#f5f6fa',
  },
  cardTagsWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    marginTop: 2,
  },
  cardTagChip: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  cardTagText: {
    fontSize: 12,
    color: '#333',
  },
  statusBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cardStatusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  statusChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
};

export default MatchesScreen; 