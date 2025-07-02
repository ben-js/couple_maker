import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

const infoList = [
  { key: 'job', label: '직업' },
  { key: 'school', label: '학교' },
  { key: 'mbti', label: 'MBTI' },
  { key: 'height', label: '키', suffix: 'cm' },
  { key: 'religion', label: '종교' },
  { key: 'drink', label: '음주' },
  { key: 'smoke', label: '흡연', valueMap: { true: '함', false: '안 함' } },
];

const chipColors = ['#FFB6B9', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FF9AA2', '#A0CED9'];

const UserDetailScreen = ({ route }) => {
  const { user } = route.params;
  const images = Array.isArray(user.image) ? user.image : [user.image];
  const [index, setIndex] = useState(0);
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setIndex(viewableItems[0].index);
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingBottom: 40 }}>
      {/* 이미지 캐러셀 */}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image source={item} style={styles.profileImg} resizeMode="cover" />
        )}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={{ maxHeight: 350 }}
      />
      <View style={styles.indicatorRow}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
      {/* 이름/나이/거리 */}
      <Text style={styles.name}>{user.name}, <Text style={styles.age}>{user.age}</Text></Text>
      <Text style={styles.address}>{user.address}</Text>
      <Text style={styles.subInfo}>{user.time}</Text>
      {/* 주요 정보+소개 패널 */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          {infoList.map((info, idx) => (
            <View key={info.key} style={styles.infoItemBox}>
              <Text style={styles.infoLabel}>{info.label}</Text>
              <Text style={styles.infoValue}>
                {info.valueMap
                  ? info.valueMap[String(user[info.key])]
                  : user[info.key] + (info.suffix ? info.suffix : '')}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>소개</Text>
        <Text style={styles.intro}>{user.intro}</Text>
      </View>
      {/* 관심사 */}
      <Text style={styles.sectionTitle}>관심사</Text>
      <View style={styles.chipRow}>
        {user.interests.map((interest, idx) => (
          <View key={idx} style={[styles.chip, { backgroundColor: chipColors[idx % chipColors.length] }] }>
            <Text style={styles.chipText}>{interest}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    width: width - 32,
    height: 350,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  indicatorRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, margin: 4 },
  dotActive: { backgroundColor: '#333' },
  dotInactive: { backgroundColor: '#ccc' },
  name: { fontSize: 30, fontWeight: 'bold', color: '#222', marginBottom: 2, marginTop: 8 },
  age: { fontSize: 28, color: '#FF5A5F', fontWeight: 'bold' },
  address: { color: '#666', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  subInfo: { color: '#888', fontSize: 15, marginBottom: 18 },
  infoCard: {
    backgroundColor: '#f4f6fa',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    width: width - 32,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  infoItemBox: {
    width: '45%',
    marginBottom: 12,
    marginRight: '5%',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 15,
    marginBottom: 2,
  },
  infoValue: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  sectionTitle: { fontWeight: 'bold', fontSize: 17, color: '#222', marginBottom: 6 },
  intro: { fontSize: 15, color: '#333', marginBottom: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: 8, marginRight: 8, marginBottom: 24 },
  chip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7, margin: 4 },
  chipText: { color: '#333', fontSize: 14, fontWeight: 'bold' },
});

export default UserDetailScreen; 