import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, RefreshControl } from 'react-native';
import ProfileHeader from './ProfileHeader';

interface HeaderLayoutProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const onChargePress = () => {};

const HeaderLayout: React.FC<HeaderLayoutProps> = ({
  children,
  containerStyle,
  contentStyle,
  onRefresh,
  refreshing,
}) => (
  <View style={[styles.container, containerStyle]}>
    <ProfileHeader onChargePress={onChargePress} />
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
      ) : undefined}
    >
      {children}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, paddingBottom: 80 },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
  },
});

export default HeaderLayout; 