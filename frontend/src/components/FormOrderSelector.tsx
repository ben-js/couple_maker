import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { Button } from 'react-native-ui-lib';
import { colors, typography } from '@/constants';
import { Feather } from '@expo/vector-icons';

interface OrderOption {
  id: string;
  label: string;
  color: string;
}

interface FormOrderSelectorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  options?: OrderOption[];
}

const FormOrderSelector: React.FC<FormOrderSelectorProps> = ({
  label,
  value = [],
  onChange,
  error,
  placeholder = '우선순위를 선택하세요',
  required = false,
  options = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>(value);

  const handleOrderToggle = (orderId: string) => {
    setSelectedOrders(prev => {
      const isSelected = prev.includes(orderId);
      if (isSelected) {
        // 이미 선택된 경우 제거
        return prev.filter(id => id !== orderId);
      } else {
        // 선택되지 않은 경우 추가 (순서대로)
        return [...prev, orderId];
      }
    });
  };

  const handleConfirm = () => {
    onChange(selectedOrders);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setSelectedOrders(value);
    setIsModalVisible(false);
  };

  const getOrderBadge = (orderId: string) => {
    const index = selectedOrders.indexOf(orderId);
    if (index === -1) return null;
    
    const option = options.find((opt: OrderOption) => opt.id === orderId);
    if (!option) return null;

    return (
      <View style={[styles.badge, { backgroundColor: option.color }]}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
    );
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    return value.join(' > ');
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {error && <Text style={{ color: colors.error, marginLeft: 8, fontSize: 13 }}>{error}</Text>}
      </View>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, value.length === 0 && styles.placeholderText]}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>우선순위 아래에 순서대로 선택해주세요.</Text>
            
            <View style={styles.optionsContainer}>
              {options.map((option: OrderOption) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionItem}
                  onPress={() => handleOrderToggle(option.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {getOrderBadge(option.id)}
                </TouchableOpacity>
              ))}
            </View>
            {/* 하단 고정 확인 버튼 */}
            <View style={styles.bottomButtonWrapper}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  selectedOrders.length !== options.length && styles.confirmButtonDisabled
                ]}
                onPress={selectedOrders.length === options.length ? handleConfirm : undefined}
                activeOpacity={selectedOrders.length === options.length ? 0.8 : 1}
                disabled={selectedOrders.length !== options.length}
              >
                <Text style={[
                  styles.confirmButtonText,
                  selectedOrders.length !== options.length && styles.confirmButtonTextDisabled
                ]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  required: {
    color: colors.error,
  },
  selector: {
    minHeight: 40, justifyContent: 'center', paddingHorizontal: 0, marginBottom: 1
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: colors.text.disabled,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    paddingTop: 20,
    paddingBottom: 40,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    // 배경색 제거
  },
  optionLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    height: 48,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#B0B8C1',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButtonTextDisabled: {
    color: '#eee',
  },
  bottomButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default FormOrderSelector; 