import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const slides = [
  { key: '1', title: '매칭 기반 소개팅', desc: 'AI가 추천하는 인연을 만나보세요.' },
  { key: '2', title: '간편한 프로필 작성', desc: '사진과 관심사만 입력하면 끝!' },
  { key: '3', title: '실시간 채팅', desc: '매칭된 상대와 바로 대화해보세요.' },
];

const OnboardingSlide = () => {
  // 실제 구현 시 react-native-snap-carousel 등으로 슬라이드 처리
  return (
    <View style={styles.slide}>
      {slides.map((slide) => (
        <View key={slide.key} style={styles.slideItem}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.desc}>{slide.desc}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  slide: { width: '100%', marginBottom: 32 },
  slideItem: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default OnboardingSlide; 