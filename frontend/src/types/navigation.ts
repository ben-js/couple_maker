// 네비게이션 스택 파라미터 타입 정의
import { HistoryItem } from './history';

export type RootStackParamList = {
  Main: undefined;
  ProfileEdit: { isEditMode?: boolean } | undefined;
  PreferenceEdit: { isEditMode?: boolean } | undefined;
  UserDetail: { user_id: string; match_id?: string };
  Chat: { user_id: string };
  Filter: undefined;
  Settings: undefined;
  Loading: undefined;
  Signup: undefined;
  Login: undefined;
  Onboarding: undefined;
  Terms: { type?: 'terms' | 'privacy' | 'customer' } | undefined;
  Auth?: undefined;
  PointCharge: undefined;
  ReviewWrite: { userId: string; matchId: string };
  ContactDetail: { matchId: string };
  HistoryDetail: { history: HistoryItem };
}; 