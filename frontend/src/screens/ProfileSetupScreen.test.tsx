import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileSetupScreen from './ProfileSetupScreen';

// Mock navigation, AuthContext 등 필요한 부분
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));
jest.mock('../store/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } })
}));

// regionData, options 등도 필요시 mock
jest.mock('../data/regions.json', () => ({
  서울: ['강남구', '서초구'],
  부산: ['해운대구', '수영구']
}));
jest.mock('../data/options.json', () => ({
  genders: ['남', '여'],
  interests: ['여행', '음악', '운동'],
  foods: ['한식', '중식', '일식']
}));


describe('ProfileSetupScreen', () => {
  it('chips(취미) 선택 모달이 정상 동작한다', async () => {
    const { getByText, queryByText } = render(<ProfileSetupScreen />);
    // chips modal 열기
    fireEvent.press(getByText('취미를 3개 이상 선택하세요'));
    expect(getByText('취미를 3개 선택하세요')).toBeTruthy();
    // chips 선택
    fireEvent.press(getByText('여행'));
    fireEvent.press(getByText('음악'));
    fireEvent.press(getByText('운동'));
    // chips 3개 선택 후 확인 버튼 활성화
    expect(getByText('확인').props.disabled).toBe(false);
    // 모달 닫기
    fireEvent.press(getByText('확인'));
    await waitFor(() => expect(queryByText('취미를 3개 선택하세요')).toBeNull());
  });

  it('region(사는 곳) 모달이 정상 동작한다', () => {
    const { getByText } = render(<ProfileSetupScreen />);
    fireEvent.press(getByText('사는 곳 선택'));
    expect(getByText('사는 곳 선택')).toBeTruthy();
    fireEvent.press(getByText('서울'));
    fireEvent.press(getByText('강남구'));
    // 선택 후 모달 닫힘
    expect(getByText('서울 강남구')).toBeTruthy();
  });

  it('저장 버튼이 스타일과 함께 렌더링된다', () => {
    const { getByText } = render(<ProfileSetupScreen />);
    const saveBtn = getByText('저장');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.props.style).toEqual(
      expect.objectContaining({ minWidth: 120, paddingVertical: 12 })
    );
  });
}); 