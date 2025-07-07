import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Image } from 'react-native';
import { ProgressBar } from 'react-native-ui-lib';
import { colors } from '../styles/colors';
import { styles } from '../styles/styles';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  // 목업 데이터
  const getRandomPercent = () => Math.floor(Math.random() * 20) + 80;

  const handleSearch = () => {
    // 목업 검색 결과
    setResults([
      { userId: '1', name: '홍길동', age: 29, region: '서울', job: '개발자', photos: [], matchPercent: getRandomPercent(), tags: ['유쾌', '자유'] },
      { userId: '2', name: '김영희', age: 27, region: '경기', job: '디자이너', photos: [], matchPercent: getRandomPercent(), tags: ['안정', '내향'] },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.searchBarWrap}>
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="이름, 직업, 태그 등 검색" />
        <Button label="검색" onPress={handleSearch} backgroundColor={'#E94F4F'} color={'#fff'} style={{ marginLeft: 8 }} />
      </View>
      {/* chips/필터 */}
      <View style={styles.chipsWrap}>
        <ChipsInput value={[]} onChange={()=>{}} chips={['남성','여성','20대','30대','서울','경기']} multi />
      </View>
      {/* 결과 리스트 */}
      {results.map((item, idx) => (
        <View key={item.userId} style={styles.resultCardWrap}>
          <View style={styles.resultImageWrap}>
            <Image source={{ uri: item.photos[0] || undefined }} style={styles.resultImage} resizeMode="cover" />
          </View>
          <View style={styles.resultInfoWrap}>
            <Text style={styles.resultName}>{item.name}</Text>
            <Text style={styles.resultAge}>{item.age}세</Text>
            <Text style={styles.resultRegion}>{item.region}</Text>
            <Text style={styles.resultJob}>{item.job}</Text>
            <View style={styles.resultPercentRow}>
              <View style={styles.resultPercentCircleWrap}>
                <View style={styles.resultPercentCircleBg} />
                <Text style={styles.resultPercentText}>{item.matchPercent}%</Text>
              </View>
              <ProgressBar progress={item.matchPercent/100} style={styles.resultPercentBar} progressColor={'#E94F4F'} />
            </View>
            <View style={styles.resultTagsWrap}>
              {(item.tags || []).map((tag: string, i: number) => (
                <View key={i} style={styles.resultTagChip}>
                  <Text style={styles.resultTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default SearchScreen; 