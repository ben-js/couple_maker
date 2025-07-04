import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Button, Avatar, Card, Chip } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      // const p = getProfile(user.id); // 더 이상 사용하지 않으므로 삭제
      setProfile(null);
    }
  }, [user]);

  const pastelColors = [
    '#FFD6E0', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#FF9AA2', '#A0CED9',
    '#FFFACD', '#D1C4E9', '#F8BBD0', '#B2EBF2', '#DCEDC8', '#FFE0B2', '#F0F4C3', '#B2DFDB',
  ];

  return (
    <View style={styles.container}>
      {/* 프로필 카드 */}
      <Card enableShadow style={styles.card}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
        {profile?.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.profileImg} resizeMode="cover" />
        ) : (
          <Avatar size={80} label={user?.name?.[0] || '?'} backgroundColor="#e5e6fa" labelColor="#bbb" containerStyle={{ marginBottom: 12 }} />
        )}
      </View>
        <Text style={styles.name}>{user?.name}, <Text style={styles.age}>{profile?.age || ''}</Text></Text>
        <Text style={styles.sub}>{profile?.location?.city} {profile?.location?.district}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoItem}>{profile?.job}</Text>
          <Text style={styles.infoItem}>{profile?.school}</Text>
          <Text style={styles.infoItem}>{profile?.mbti}</Text>
        </View>
      </Card>
      {/* 자기소개 */}
      <Card enableShadow style={styles.card}>
        <Text style={styles.sectionTitle}>자기소개</Text>
        <Text style={styles.intro}>{profile?.bio || '아직 자기소개가 없습니다.'}</Text>
      </Card>
      {/* 관심사 */}
      <Card enableShadow style={styles.card}>
        <Text style={styles.sectionTitle}>관심사</Text>
        <View style={styles.chipRow}>
          {(profile?.interests || []).map((interest: string, idx: number) => (
            <Chip
              key={interest}
              label={interest}
              containerStyle={[styles.chip, { backgroundColor: pastelColors[idx % pastelColors.length] }]}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}
            />
          ))}
        </View>
      </Card>
      {/* 버튼들 */}
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Button label="프로필 수정" marginB-12 onPress={() => navigation.navigate('ProfileSetup', { user_id: user?.id, isFirst: false })} style={styles.actionBtn} />
        <Button label="Q&A" marginB-12 outline outlineColor="#888" backgroundColor="#fff" style={styles.actionBtn} />
        <Button label="공지사항" outline outlineColor="#888" backgroundColor="#fff" style={styles.actionBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 24 },
  card: { borderRadius: 18, marginBottom: 24, padding: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  profileImg: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  name: { fontWeight: 'bold', fontSize: 22, color: '#222', textAlign: 'center' },
  age: { color: '#3B82F6', fontWeight: 'bold' },
  sub: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  infoItem: { color: '#555', fontSize: 14, marginHorizontal: 8 },
  sectionTitle: { fontWeight: 'bold', color: '#3B82F6', marginBottom: 8, fontSize: 16 },
  intro: { color: '#333', fontSize: 15, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { margin: 4, borderRadius: 16, borderWidth: 0 },
  actionBtn: { width: 220, borderRadius: 16, marginBottom: 8 },
});

export default ProfileScreen; 