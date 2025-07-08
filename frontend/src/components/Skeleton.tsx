import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  return (
    <ShimmerPlaceHolder
      style={[
        { width, height, borderRadius, marginVertical: 4, backgroundColor: '#F8F8F8' },
        style,
      ]}
      shimmerStyle={{ borderRadius }}
    />
  );
};

export default Skeleton; 