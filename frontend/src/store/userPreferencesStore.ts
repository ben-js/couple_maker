import create from 'zustand';
import { UserPreferences } from '../types';

type UserPreferencesStore = {
  preferences: UserPreferences | null;
  setPreferences: (prefs: UserPreferences) => void;
};

export const useUserPreferencesStore = create<UserPreferencesStore>((set) => ({
  preferences: null,
  setPreferences: (prefs) => set({ preferences: prefs }),
})); 