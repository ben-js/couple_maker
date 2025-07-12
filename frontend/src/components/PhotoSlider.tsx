import React, { useRef, useState } from 'react';
import { FlatList, View, Image, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants';

interface PhotoSliderProps {
  photoList: string[];
}

const screenWidth = Dimensions.get('window').width;
const containerWidth = screenWidth * 0.9;

const PhotoSlider: React.FC<PhotoSliderProps> = ({ photoList }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  });

  const handleDotPress = (idx: number) => {
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  // 사진이 비어있거나 없을 때 잠금 상태 표시
  if (!photoList || photoList.length === 0) {
    return (
      <View style={styles.photoSliderWrap}>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedImageContainer}>
            <Feather name="lock" size={48} color="#999" />
            <Text style={styles.lockedText}>소개팅 당일 오전 9시에 공개됩니다</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.photoSliderWrap}>
      <FlatList
        ref={flatListRef}
        style={{ width: containerWidth }}
        data={photoList}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: containerWidth, alignItems: 'center' }}>
            <Image
              source={{ uri: item }}
              style={{
                width: containerWidth,
                height: containerWidth,
                borderRadius: 24,
                backgroundColor: '#eee',
              }}
              resizeMode="cover"
            />
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        initialScrollIndex={currentIndex}
        getItemLayout={(_, index) => ({
          length: containerWidth,
          offset: containerWidth * index,
          index,
        })}
        snapToInterval={containerWidth}
        decelerationRate="fast"
      />
      <View style={styles.indicatorRow}>
        {photoList.map((_, idx) => (
          <TouchableOpacity key={idx} onPress={() => handleDotPress(idx)}>
            <View
              style={[
                styles.dot,
                idx === currentIndex && styles.dotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  photoSliderWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#333',
  },
  // 잠금 상태 스타일
  lockedContainer: {
    width: containerWidth,
    height: containerWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lockedImageContainer: {
    width: containerWidth,
    height: containerWidth,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  lockedText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PhotoSlider;
