import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Text, Avatar } from 'react-native-ui-lib';
import PrimaryButton from '../components/PrimaryButton';
import { colors, NAVIGATION_ROUTES } from '@/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiGet, apiPost } from '../utils/apiUtils';
import { useAuth } from '../store/AuthContext';
import PageLayout from '../components/PageLayout';
import PhotoSlider from '../components/PhotoSlider';

const ContactDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { matchId } = route.params || {};
  const [contact, setContact] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    // 연락처/프로필 정보 불러오기
    const fetchContact = async () => {
      try {
        setLoading(true);
        const res = await apiGet(`/contact-detail?matchId=${matchId}`, undefined, user?.userId);
        setContact(res.contact);
        setProfile(res.profile);
      } catch (e) {
        Alert.alert('오류', '연락처 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    if (matchId && user?.userId) fetchContact();
  }, [matchId, user?.userId]);

  const handleFinish = async () => {
    Alert.alert(
      '소개팅 종료',
      '소개팅 종료 하면 더이상 연락처를 알 수 없습니다.\n연락처는 개인정보 보호를 위해 삭제됩니다.',
      [
        {
          text: '아니오',
          style: 'cancel',
        },
        {
          text: '네',
          onPress: async () => {
            try {
              setFinishing(true);
              await apiPost('/meeting/finish', { match_id: matchId, user_id: user?.userId }, user?.userId);
              Alert.alert('소개팅 종료', '소개팅이 종료되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.navigate(NAVIGATION_ROUTES.MAIN)
                }
              ]);
            } catch (e) {
              Alert.alert('오류', '소개팅 종료에 실패했습니다.');
            } finally {
              setFinishing(false);
            }
          },
        },
      ]
    );
  };

  // 연락처 번호 포맷팅 함수
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '-';
    
    // 숫자만 추출
    const numbers = phoneNumber.replace(/\D/g, '');
    
    // 11자리 휴대폰 번호인 경우
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    
    // 10자리 번호인 경우 (010으로 시작하지 않는 경우)
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    
    // 그 외의 경우 원본 반환
    return phoneNumber;
  };

  // 프로필 사진 목록 (photos 배열이 있으면 사용, 없으면 photoUrl을 배열로 변환)
  const photoList = profile?.photos?.length > 0 
    ? profile.photos 
    : profile?.photoUrl 
      ? [profile.photoUrl] 
      : [];

  return (
    <PageLayout title={`${profile?.name || ''}`}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>연락처 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          {/* 프로필 사진 슬라이드 */}
          <PhotoSlider photoList={photoList} />

          {/* 매칭 완료 안내 박스 */}
          <View style={styles.matchingCompleteBox}>
            <Text style={styles.matchingCompleteText}>
              매칭 완료! 🎉
            </Text>
            <Text style={styles.matchingCompleteText}>
              두 분이 서로를 선택했어요!
            </Text>
            <Text style={styles.matchingCompleteText}>
              이제 직접 연락해볼 수 있어요.
            </Text>
            <Text style={styles.matchingCompleteText}>
              멋진 인연으로 이어지길 바랄게요 💖
            </Text>
          </View>

          {/* 소개팅 종료 안내 박스 */}
          <View style={styles.finishTipBox}>
            <View style={styles.finishTipHeader}>
              <Text style={styles.finishTipIcon}>💡</Text>
              <Text style={styles.finishTipTitle}>[소개팅 종료] 버튼을 누르면</Text>
            </View>
            <Text style={styles.finishTipText}>
              연락처는 바로 삭제되고, 다시 확인하실 수 없어요.
            </Text>
            <Text style={styles.finishTipText}>
              새로운 소개팅은
            </Text>
            <Text style={styles.finishTipText}>
            [소개팅 종료] 후 메인 화면에서 다시 해주세요. 😊
            </Text>
          </View>

          {/* 연락처 섹션 */}
          <View style={styles.contactSection}>
            <Text style={styles.contactLabel}>{profile?.name}님 연락처</Text>
            <Text style={styles.contactValue}>{formatPhoneNumber(contact || '')}</Text>
          </View>
          
          {/* 소개팅 종료 버튼 */}
          <PrimaryButton 
            title={finishing ? "종료 중..." : "소개팅 종료"} 
            onPress={handleFinish} 
            style={[styles.finishButton, finishing && styles.finishButtonDisabled]} 
            textColor="#FFFFFF" 
            disabled={finishing}
          />
        </>
      )}
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  profileImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  avatar: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  // 소개팅 종료 안내 박스 스타일
  finishTipBox: {
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 24,
    padding: 16,
    alignItems: 'center',
  },
  finishTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  finishTipIcon: {
    fontSize: 12,
    lineHeight: 22,
    marginRight: 5,
  },
  finishTipTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 22,
  },
  finishTipText: {
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text.primary,
    textAlign: 'center',
  },
  job: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  region: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  contactSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  contactLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  finishButton: {
    marginTop: 0,
    borderRadius: 12,
    width: '100%',
    height: 50,
    backgroundColor: '#000000',
  },
  // 매칭 완료 안내 박스 스타일
  matchingCompleteBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
  },
  matchingCompleteText: {
    color: '#2E7D32',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  finishButtonDisabled: {
    opacity: 0.7,
  },
});

export default ContactDetailScreen; 