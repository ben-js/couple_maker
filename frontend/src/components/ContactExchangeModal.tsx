import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, TextInput, Alert, Keyboard } from 'react-native';
import { Text } from 'react-native-ui-lib';
import { Feather } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, typography } from '@/constants';

interface ContactExchangeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (contact: string) => void;
}

// 010으로 시작하고 총 11자리인 휴대폰 번호 검증
const phoneRegex = /^010\d{8}$/;

const ContactExchangeModal: React.FC<ContactExchangeModalProps> = ({ visible, onClose, onSubmit }) => {
  const [contact, setContact] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = phoneRegex.test(contact);

  const handleClose = () => {
    Keyboard.dismiss();
      onClose();
  };

  const handleOkPress = () => {
    if (!isValid) return;
    
    Alert.alert(
      '연락처 확인',
      `${contact} 번호가 맞습니다`,
      [
        {
          text: '아니오',
          style: 'cancel',
          onPress: () => {
            setContact('');
            setTouched(false);
          }
        },
        {
          text: '네',
          onPress: () => onSubmit(contact)
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>연락처 교환</Text>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeBtn} 
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <Text style={styles.label}>연락처</Text>
              <TextInput
                style={styles.input}
                placeholder="연락처를 작성해주세요"
                placeholderTextColor={colors.text.secondary}
                value={contact}
                onChangeText={text => {
                  setContact(text);
                  setTouched(true);
                }}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus
                onBlur={() => setTouched(true)}
              />
            </View>
            <View style={styles.errorTextContainer}>
            {touched && !isValid && contact.length > 0 && (
              <Text style={styles.errorText}>휴대폰 번호가 맞지 않습니다</Text>
            )}
            </View>
          </View>
          <PrimaryButton
            title="OK"
            onPress={handleOkPress}
            disabled={!isValid}
            style={styles.okButton}
            textColor={isValid ? '#FFFFFF' : colors.text.secondary}
            backgroundColor={isValid ? '#000000' : colors.border}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeBtn: {
    padding: 2,
  },
  inputSection: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginRight: 12,
    minWidth: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: '#fff',
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  errorTextContainer: {
    minHeight: 20,
  },
  okButton: {
    marginTop: 0,
    borderRadius: 12,
    width: '100%',
    alignSelf: 'center',
  },
});

export default ContactExchangeModal; 