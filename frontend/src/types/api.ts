import { UserProfile } from './profile';
import { UserPreferences } from './preference';

export type ApiRequestData =
  | UserProfile
  | UserPreferences
  | { fileName: string; fileSize: number }
  | { id: string }
  | { [key: string]: string | number | boolean }
  | undefined;

export type ApiResponseData =
  | { success: boolean }
  | UserProfile
  | UserPreferences
  | undefined;

export interface ApiParams {
  [key: string]: string | number | boolean;
} 