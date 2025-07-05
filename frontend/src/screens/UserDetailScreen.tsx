import React, { useRef, useState } from 'react';
import { Image, StyleSheet, FlatList, Dimensions, ScrollView } from 'react-native';
import { View, Text, Card, Chip } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';

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

const pastelColors = [
  '#FFD6E0', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FF9AA2', '#A0CED9',
  '#FFFACD', '#D1C4E9', '#F8BBD0', '#B2EBF2', '#DCEDC8', '#FFE0B2', '#F0F4C3', '#B2DFDB',
];

const UserDetailScreen = ({ route }) => {
  const { user } = route.params;
  const images = Array.isArray(user.image) ? user.image : [user.image];
  const [index, setIndex] = useState(0);
  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setIndex(viewableItems[0].index);
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ alignItems: 'center', paddingTop: 40, paddingBottom: 40 }}>
      {/* 이미지 캐러셀 */}
      <Card enableShadow style={styles.imgCard}>
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
          {images.map((_: any, i: number) => (
            <View
              key={i}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </Card>
      {/* 이름/나이/주소/시간 */}
      <Card enableShadow style={styles.card}>
        <Text style={styles.name}>{user.name}, <Text style={styles.age}>{user.age}</Text></Text>
        <Text style={styles.address}>{user.address}</Text>
        <Text style={styles.subInfo}>{user.time}</Text>
      </Card>
      {/* 주요 정보+소개 패널 */}
      <Card enableShadow style={styles.card}>
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
      </Card>
      {/* 관심사 */}
      <Card enableShadow style={styles.card}>
        <Text style={styles.sectionTitle}>관심사</Text>
        <View style={styles.chipRow}>
          {(user.interests || []).map((interest: string, idx: number) => (
            <Chip
              key={interest}
              label={interest}
              containerStyle={[styles.chip, { backgroundColor: pastelColors[idx % pastelColors.length] }]}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileImg: { width: 320, height: 320, borderRadius: 18, marginBottom: 0 },
  imgCard: { borderRadius: 18, marginBottom: 24, padding: 0, backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  card: { borderRadius: 18, marginBottom: 24, padding: 20, backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2, width: 340, alignSelf: 'center' },
  name: { ...typography.h1, textAlign: 'center' },
  age: { color: colors.primary, fontWeight: 'bold' },
  address: { ...typography.body, textAlign: 'center', marginBottom: 2 },
  subInfo: { ...typography.small, textAlign: 'center', marginBottom: 8 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 },
  infoItemBox: { alignItems: 'center', marginHorizontal: 10, marginBottom: 8 },
  infoLabel: { ...typography.small, color: colors.primary, fontWeight: 'bold' },
  infoValue: { ...typography.body, fontWeight: 'bold' },
  sectionTitle: { ...typography.h3, color: colors.primary, marginBottom: 8 },
  intro: { ...typography.body, lineHeight: 22, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { margin: 4, borderRadius: 16, borderWidth: 0 },
  indicatorRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.primary },
  dotInactive: { backgroundColor: colors.border },
});

export default UserDetailScreen; 