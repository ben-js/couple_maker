import React, { useRef, useState } from 'react';
import { FlatList, View, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

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

  if (!photoList || photoList.length === 0) return null;

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
});

export default PhotoSlider;
