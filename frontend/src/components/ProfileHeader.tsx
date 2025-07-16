import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../store/AuthContext';
import { colors, spacing, typography } from '@/constants';
import PrimaryButton from './PrimaryButton';

interface ProfileHeaderProps {
  onChargePress?: (() => void) | undefined;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onChargePress }) => {
  const { user } = useAuth();
  const { getProfilePhoto, getUserDisplayName, getUserInitial, userProfile } = useUserProfile();

  const profilePhotoUrl = getProfilePhoto();
  
  console.log('ProfileHeader 렌더링:', {
    profilePhotoUrl,
    userProfilePhotos: userProfile?.photos,
    userPhotos: user?.photos,
    hasProfilePhoto: !!profilePhotoUrl
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {profilePhotoUrl ? (
          <Image
            source={{ uri: profilePhotoUrl }}
            style={styles.profileImage}
            resizeMode="cover"
            key={`profile-${user?.userId}-${profilePhotoUrl}`} // 더 안정적인 key
            onLoad={() => console.log('프로필 이미지 로드 성공:', profilePhotoUrl)}
            onError={(error) => console.log('프로필 이미지 로드 실패:', error.nativeEvent.error, 'URL:', profilePhotoUrl)}
          />
        ) : (
          <Avatar
            size={44}
            label={getUserInitial()}
            backgroundColor={colors.primary}
            labelColor={colors.surface}
          />
        )}
        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>{getUserDisplayName()}</Text>
          <Text style={styles.pointsText}>
            보유 포인트: {user?.points || 0}P
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        {onChargePress && (
          <PrimaryButton
            title="충전하기"
            onPress={onChargePress}
            style={{ minWidth: 80, height: 36, marginRight: 8, paddingHorizontal: 16, paddingVertical: 0 }}
          />
        )}
        <View style={styles.notificationButton}>
          <Feather name="bell" size={28} color={colors.text.primary} style={{ opacity: 0.9 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: spacing.md,
  },
  welcomeTitle: {
    ...typography.title,
    marginBottom: 2,
  },
  pointsText: {
    ...typography.caption,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
});

export default ProfileHeader; 