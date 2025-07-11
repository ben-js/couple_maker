import React from 'react';
import { View, Text, TouchableOpacity, Card } from 'react-native-ui-lib';
import DateTimePicker from '@react-native-community/datetimepicker';
import FormRegionChoiceModal from './FormRegionChoiceModal';
import { StyleProp, ViewStyle, TextStyle, StyleSheet } from 'react-native';
import { colors } from '@/constants';

interface CardScheduleChoiceProps {
  otherChoices: { dates: string[]; locations: string[] } | null;
  dateSelections: (string | null)[];
  setDateSelections: (dates: (string | null)[]) => void;
  showDatePickerIdx: number | null;
  setShowDatePickerIdx: (idx: number | null) => void;
  locationSelection: string[];
  setLocationSelection: (locs: string[]) => void;
  regionData: any;
  showDateDuplicateModal: boolean;
  setShowDateDuplicateModal: (show: boolean) => void;
  onConfirm: () => void;
}

const CardScheduleChoice: React.FC<CardScheduleChoiceProps> = ({
  otherChoices,
  dateSelections,
  setDateSelections,
  showDatePickerIdx,
  setShowDatePickerIdx,
  locationSelection,
  setLocationSelection,
  regionData,
  showDateDuplicateModal,
  setShowDateDuplicateModal,
  onConfirm,
}) => {
  const containerStyle: ViewStyle = cardScheduleChoiceStyles.container;
  const confirmButtonStyle = {
    backgroundColor: dateSelections.every(d => d) && locationSelection.length > 0 ? colors.primary : '#eee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  };
  const confirmButtonTextStyle = {
    color: dateSelections.every(d => d) && locationSelection.length > 0 ? '#fff' : '#bbb',
    fontWeight: 'bold' as const,
    fontSize: 16,
  };
  return (
    <Card enableShadow style={cardScheduleChoiceStyles.card}>
      <Text style={cardScheduleChoiceStyles.title}>일정/장소를 선택 하세요!</Text>
      {otherChoices && (
        <View style={cardScheduleChoiceStyles.otherChoicesBox}>
          <Text style={cardScheduleChoiceStyles.desc}>상대방이 선택한 일정</Text>
          <Text style={cardScheduleChoiceStyles.desc}>날짜: {otherChoices.dates.join(', ')}</Text>
          <Text style={cardScheduleChoiceStyles.desc}>장소: {otherChoices.locations.join(', ')}</Text>
        </View>
      )}
      <View style={cardScheduleChoiceStyles.spacer24} />
      <View style={containerStyle}>
        {[0,1,2].map(i => (
          <View key={i} style={cardScheduleChoiceStyles.dateRow}>
            <Text style={cardScheduleChoiceStyles.dateLabel}>{i+1}. 날짜 선택</Text>
            <TouchableOpacity
              onPress={() => setShowDatePickerIdx(i)}
              activeOpacity={0.8}
              style={cardScheduleChoiceStyles.dateButton}
            >
              <Text style={dateSelections[i] ? cardScheduleChoiceStyles.dateText : cardScheduleChoiceStyles.dateTextPlaceholder}>
                {dateSelections[i] || '날짜를 선택해 주세요'}
              </Text>
            </TouchableOpacity>
            {showDatePickerIdx === i && (
              <DateTimePicker
                value={dateSelections[i] ? new Date(dateSelections[i]!) : new Date()}
                mode="date"
                display="default"
                minimumDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                onChange={(event, date) => {
                  if ((event && event.type === 'dismissed') || !date) {
                    setShowDatePickerIdx(null);
                    return;
                  }
                  const d = date;
                  const formatted = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                  if (dateSelections.includes(formatted)) {
                    setShowDateDuplicateModal(true);
                  } else {
                    const newDates = [...dateSelections];
                    newDates[i] = formatted;
                    setDateSelections(newDates);
                  }
                  setShowDatePickerIdx(null);
                }}
              />
            )}
          </View>
        ))}
        <FormRegionChoiceModal
          label="장소 선택"
          value={locationSelection.map(loc => {
            const [region, district] = loc.split(' ');
            return { region, district: district || '' };
          })}
          onChange={val => {
            setLocationSelection(
              Array.from(new Set(val.map(v => v.region + (v.district ? ' ' + v.district : ''))))
            );
          }}
          regionData={regionData}
          placeholder="장소를 선택해 주세요"
          minSelect={1}
          maxSelect={3}
          error={undefined}
          type="same-line"
        />
      </View>
      <View>
        <TouchableOpacity
          style={confirmButtonStyle}
          disabled={!dateSelections.every(d => d) || locationSelection.length === 0}
          onPress={onConfirm}
        >
          <Text style={confirmButtonTextStyle}>확인</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const cardScheduleChoiceStyles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.background,
    height: 420,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  otherChoicesBox: {
    marginBottom: 12,
  },
  spacer24: {
    marginBottom: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
    width: 90,
  },
  dateButton: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
    minHeight: 44,
  },
  dateText: {
    color: '#222',
    fontSize: 16,
  },
  dateTextPlaceholder: {
    color: '#bbb',
    fontSize: 16,
  },
});

export default CardScheduleChoice; 