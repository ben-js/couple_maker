import React from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-ui-lib';
import { useNavigation } from '@react-navigation/native';
import optionsRaw from '../data/options.json';
import { Options } from '../types/options';
const options = optionsRaw as unknown as Options;

interface Ticket {
  id: number;
  name: string;
  age: number;
  time: string;
  address: string;
  image: { uri: string }[];
  job: string;
  school: string;
  mbti: string;
  intro: string;
  interests: string[];
  height: number;
  religion: string;
  smoke: boolean;
  drink: string;
  badges: { label: string; color: string }[];
}

const sampleTickets: Ticket[] = [
  {
    id: 1,
    name: '고윤정',
    age: 25,
    time: '10분 전',
    address: '서울시 강남구',
    image: Array(5).fill({ uri: 'https://i.pinimg.com/736x/40/9b/0e/409b0eed27e03ce966e3fe7ce0e5c79b.jpg' }),
    job: options.jobs[0],
    school: '서울대학교',
    mbti: options.mbtis[2],
    intro: '밝고 긍정적인 에너지를 가진 사람을 만나고 싶어요!',
    interests: [0, 1, 10, 2].map(i => options.interests[i]),
    height: 167,
    religion: options.religions[0],
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
    job: options.jobs[1],
    school: '고려대학교',
    mbti: options.mbtis[10],
    intro: '새로운 인연을 기대해요 :)',
    interests: [4, 5, 22, 2].map(i => options.interests[i]),
    height: 165,
    religion: options.religions[1],
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
    job: options.jobs[2],
    school: '연세대학교',
    mbti: options.mbtis[1],
    intro: '함께 산책할 사람 구해요!',
    interests: [12, 7, 1, 0].map(i => options.interests[i]),
    height: 168,
    religion: options.religions[2],
    smoke: false,
    drink: '가끔',
    badges: [
      { label: '목소리', color: '#e94f6a' },
    ],
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const overlayStyle = {
    ...styles.overlay,
    backgroundColor: 'rgba(0,0,0,0.28)',
  };
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>오늘의 추천</Text>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {sampleTickets.map(ticket => (
          <TouchableOpacity key={ticket.id} activeOpacity={0.85} onPress={() => navigation.navigate('UserDetail', { user: ticket } as any)}>
            <Card enableShadow style={styles.card}>
              <Image source={ticket.image[0]} style={styles.profileImg} resizeMode="cover" />
              <View style={overlayStyle}>
                <Text style={styles.name}>{ticket.name}, <Text style={styles.age}>{ticket.age}</Text></Text>
                <Text style={styles.sub}>{ticket.time} · {ticket.address}</Text>
     </View>
        </Card>
          </TouchableOpacity>
     ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 24 },
  sectionTitle: { fontWeight: 'bold', color: '#3B82F6', fontSize: 22, marginBottom: 18, marginLeft: 24 },
  card: { width: 340, height: 420, borderRadius: 22, marginBottom: 28, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  profileImg: { width: 340, height: 420, borderRadius: 22, position: 'absolute', top: 0, left: 0 },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 24, marginBottom: 2 },
  age: { color: '#FFD6E0', fontWeight: 'bold', fontSize: 22 },
  sub: { color: '#eee', fontSize: 15, fontWeight: '400' },
});

export default HomeScreen; 