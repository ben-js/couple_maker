import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Button, Avatar } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { getProfile } from '../db/user';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      const p = getProfile(user.id);
      setProfile(p);
    }
  }, [user]);

  return (
    <View style={styles.container}>
      {/* 프로필 이미지 */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {profile?.photoUri ? (
          <Image source={{ uri: profile.photoUri }} style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 12 }} />
        ) : (
          <Avatar size={80} label={user?.name?.[0] || '?'} backgroundColor="#e5e6fa" labelColor="#bbb" containerStyle={{ marginBottom: 12 }} />
        )}
      </View>
      {/* 버튼들 */}
      <Button label="프로필 수정" marginB-12 onPress={() => navigation.navigate('ProfileSetup')} style={{ width: 220 }} />
      <Button label="Q&A" marginB-12 outline outlineColor="#888" backgroundColor="#fff" style={{ width: 220 }} />
      <Button label="공지사항" outline outlineColor="#888" backgroundColor="#fff" style={{ width: 220 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#333' },
});

export default ProfileScreen; 