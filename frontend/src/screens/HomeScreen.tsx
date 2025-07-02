import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Image,
} from 'react-native';
import { Text, Button, Colors, Card } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

type HomeNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

// 임시 사용자 데이터
const mockUsers: User[] = [
  {
    id: '1',
    email: 'user1@example.com',
    name: '김민수',
    gender: 'male',
    birthDate: '1995-03-15',
    age: 28,
    location: { city: '서울', district: '강남구' },
    height: 175,
    bodyType: 'athletic',
    job: '회사원',
    education: 'bachelor',
    religion: 'none',
    smoking: 'no',
    drinking: 'sometimes',
    mbti: 'ENFP',
    bio: '여행과 음악을 좋아하는 활발한 사람입니다. 새로운 사람들과의 만남을 즐깁니다.',
    photos: ['https://via.placeholder.com/400x600'],
    interests: ['여행', '음악', '영화', '운동'],
    maritalStatus: 'single',
    hasChildren: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isProfileComplete: true,
    isVerified: true,
    lastActive: '2024-01-01',
  },
  {
    id: '2',
    email: 'user2@example.com',
    name: '이지영',
    gender: 'female',
    birthDate: '1993-07-22',
    age: 30,
    location: { city: '서울', district: '서초구' },
    height: 162,
    bodyType: 'slim',
    job: '디자이너',
    education: 'bachelor',
    religion: 'none',
    smoking: 'no',
    drinking: 'no',
    mbti: 'INFJ',
    bio: '창작 활동을 좋아하고 조용한 카페에서 시간을 보내는 것을 즐깁니다.',
    photos: ['https://via.placeholder.com/400x600'],
    interests: ['미술', '독서', '카페', '요리'],
    maritalStatus: 'single',
    hasChildren: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isProfileComplete: true,
    isVerified: true,
    lastActive: '2024-01-01',
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [users, setUsers] = useState(mockUsers);
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight(gesture);
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft(gesture);
      } else {
        resetPosition();
      }
    },
  });

  const swipeRight = (gesture: { dx: number; dy: number }) => {
    Animated.timing(position, {
      toValue: { x: width + 100, y: gesture.dy },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handleLike();
    });
  };

  const swipeLeft = (gesture: { dx: number; dy: number }) => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: gesture.dy },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      handlePass();
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleLike = () => {
    // TODO: 좋아요 API 호출
    console.log('좋아요:', users[currentIndex].name);
    nextCard();
  };

  const handlePass = () => {
    // TODO: 패스 API 호출
    console.log('패스:', users[currentIndex].name);
    nextCard();
  };

  const handleSuperLike = () => {
    // TODO: 슈퍼 좋아요 API 호출
    console.log('슈퍼 좋아요:', users[currentIndex].name);
    nextCard();
  };

  const nextCard = () => {
    setCurrentIndex(currentIndex + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-width * 1.5, 0, width * 1.5],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const renderCard = (user: User, index: number) => {
    if (index < currentIndex) return null;

    if (index === currentIndex) {
      return (
        <Animated.View
          key={user.id}
          style={[styles.card, getCardStyle()]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: user.photos[0] }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardOverlay}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>
                {user.name}, {user.age}
              </Text>
              <Text style={styles.cardLocation}>
                {user.location.city} {user.location.district}
              </Text>
              <Text style={styles.cardBio} numberOfLines={3}>
                {user.bio}
              </Text>
              <View style={styles.cardInterests}>
                {user.interests.slice(0, 3).map((interest, idx) => (
                  <View key={idx} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <View key={user.id} style={[styles.card, styles.cardBehind]}>
        <Image
          source={{ uri: user.photos[0] }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  if (currentIndex >= users.length) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="favorite-border" size={80} color={Colors.lightGray} />
        <Text style={styles.emptyTitle}>더 이상 추천할 상대가 없어요</Text>
        <Text style={styles.emptySubtitle}>
          잠시 후 다시 시도해보거나 필터를 조정해보세요
        </Text>
        <Button
          label="필터 설정"
          style={styles.filterButton}
          onPress={() => navigation.navigate('Filter' as any)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Couple Maker</Text>
        <Button
          iconSource={() => <MaterialIcons name="tune" size={24} color={Colors.text} />}
          link
          onPress={() => navigation.navigate('Filter' as any)}
        />
      </View>

      {/* 카드 스택 */}
      <View style={styles.cardContainer}>
        {users.map((user, index) => renderCard(user, index))}
      </View>

      {/* 하단 액션 버튼 */}
      <View style={styles.actionContainer}>
        <Button
          iconSource={() => <MaterialIcons name="close" size={30} color={Colors.red} />}
          style={[styles.actionButton, styles.passButton]}
          onPress={handlePass}
        />
        <Button
          iconSource={() => <MaterialIcons name="star" size={30} color={Colors.blue} />}
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={handleSuperLike}
        />
        <Button
          iconSource={() => <MaterialIcons name="favorite" size={30} color={Colors.green} />}
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLike}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    position: 'absolute',
    width: width - 40,
    height: height * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBehind: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 10,
  },
  cardBio: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: 15,
    lineHeight: 20,
  },
  cardInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5,
  },
  interestText: {
    fontSize: 12,
    color: Colors.white,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passButton: {
    borderWidth: 2,
    borderColor: Colors.red,
  },
  superLikeButton: {
    borderWidth: 2,
    borderColor: Colors.blue,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: Colors.green,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
});

export default HomeScreen; 