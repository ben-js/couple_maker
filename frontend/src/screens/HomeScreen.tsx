import React from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';

const sampleTickets = [
  {
    id: 1,
    name: '고윤정',
    age: 25,
    time: '10분 전',
    address: '서울시 강남구',
    image: Array(5).fill({ uri: 'https://i.pinimg.com/736x/40/9b/0e/409b0eed27e03ce966e3fe7ce0e5c79b.jpg' }),
    job: '배우',
    school: '서울대학교',
    mbti: 'INFP',
    intro: '밝고 긍정적인 에너지를 가진 사람을 만나고 싶어요!',
    interests: ['여행', '음악', '카페 탐방', '운동'],
    height: 167,
    religion: '무교',
    smoke: false,
    drink: '가끔',
    badges: [
      { label: '목소리', color: '#e94f6a' },
      { label: '학교 인증', color: '#3b82f6' },
    ],
  },
  {
    id: 2,
    name: '카리나',
    age: 21,
    time: '3분 전',
    address: '서울시 마포구',
    image: [
      { uri: 'https://www.chosun.com/resizer/v2/EAGA7A63NJLA3N6AONM5JVX4I4.jpg?auth=d7e8ef511b5b9e712f8dac9c59f7bb1b87c2f102695fd3b03446eae6dadf82e1&width=616' },
      { uri: 'https://cdn2.smentertainment.com/wp-content/uploads/2024/10/%EC%97%90%EC%8A%A4%ED%8C%8C-%EC%B9%B4%EB%A6%AC%EB%82%98-Up-%EB%AC%B4%EB%8C%80-%EC%9D%B4%EB%AF%B8%EC%A7%80-1.jpg' },
      { uri: 'https://thumbnews.nateimg.co.kr/view610///news.nateimg.co.kr/orgImg/nn/2023/07/02/202307020747075510_1.jpg' },
    ],
    job: '가수',
    school: '고려대학교',
    mbti: 'ENFP',
    intro: '새로운 인연을 기대해요 :)',
    interests: ['영화', '요리', '패션', '운동'],
    height: 165,
    religion: '기독교',
    smoke: false,
    drink: '안 함',
    badges: [
      { label: '목소리', color: '#e94f6a' },
    ],
  },
  {
    id: 3,
    name: '설윤',
    age: 21,
    time: '10분 전',
    address: '서울시 송파구',
    image: Array(5).fill({ uri: 'https://img.hankyung.com/photo/202503/AD.39849613.1.jpg' }),
    job: '아이돌',
    school: '연세대학교',
    mbti: 'ISFJ',
    intro: '함께 산책할 사람 구해요!',
    interests: ['산책', '사진', '음악', '여행'],
    height: 168,
    religion: '불교',
    smoke: false,
    drink: '가끔',
    badges: [
      { label: '목소리', color: '#e94f6a' },
    ],
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>오늘의 추천</Text>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {sampleTickets.map(ticket => (
          <TouchableOpacity key={ticket.id} activeOpacity={0.85} onPress={() => navigation.navigate('UserDetail', { user: ticket })}>
            <Card enableShadow containerStyle={styles.card}>
              <Image source={ticket.image[0]} style={styles.profileImg} resizeMode="cover" />
              <View style={styles.overlay}>
                <Text style={styles.name}>{ticket.name}, {ticket.age}</Text>
                <Text style={styles.sub}>{ticket.time}, {ticket.address}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 16, alignItems: 'center' },
  sectionTitle: { fontWeight: 'bold', fontSize: 17, color: '#222', marginBottom: 12, alignSelf: 'flex-start', marginLeft: 18, marginTop: 38 },
  card: {
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    padding: 0,
    marginBottom: 18,
    width: 340,
    height: 300,
    overflow: 'hidden',
    alignItems: 'flex-start',
    elevation: 3,
    position: 'relative',
  },
  profileImg: {
    width: '100%',
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  name: { fontWeight: 'bold', fontSize: 19, color: '#fff', marginBottom: 2 },
  sub: { color: '#eee', fontSize: 14 },
});

export default HomeScreen; 