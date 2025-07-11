import React from 'react';
import { View, Text } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';

export interface LockedCardProps {
  icon: string;
  title: string;
  description: string;
  sample?: string;
}

const LockedCard: React.FC<LockedCardProps> = ({ icon, title, description, sample }) => (
  <View padding-16 bg-surface br40 marginB-16 style={{ opacity: 0.5 }}>
    <View row centerV marginB-8>
      <Feather name={icon as any} size={20} color="#8E8E8E" />
      <Text text70 marginL-8>{title}</Text>
      <Feather name="lock" size={16} color="#8E8E8E" style={{ marginLeft: 8 }} />
    </View>
    <Text text80 color="#8E8E8E">{description}</Text>
    {sample && <Text text90 color="#DBDBDB" marginT-4>{sample}</Text>}
  </View>
);

export default LockedCard; 