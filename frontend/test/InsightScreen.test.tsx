import React from 'react';
import { render } from '@testing-library/react-native';
import InsightScreen from '../src/screens/InsightScreen';

describe('InsightScreen(오픈 전)', () => {
  it('잠금 카드와 안내문구가 정상적으로 렌더링된다', () => {
    const { getByText } = render(<InsightScreen />);
    expect(getByText('당신을 위한 AI 인사이트')).toBeTruthy();
    expect(getByText('아직 충분한 소개팅 데이터가 없어요. 매칭을 시작하면 아래 정보를 AI가 분석해드릴게요.')).toBeTruthy();
    expect(getByText('당신의 성향 분석 카드')).toBeTruthy();
    expect(getByText('매칭 성공률 추이 그래프')).toBeTruthy();
    expect(getByText('대화 스타일 요약')).toBeTruthy();
    expect(getByText('맞춤 피드백 예시')).toBeTruthy();
    expect(getByText('소개팅 1회 완료 시 해금!')).toBeTruthy();
  });
}); 