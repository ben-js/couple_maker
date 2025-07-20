import { Profile } from './profile';
import { Preferences } from './preference';

export type ApiRequestData =
  | Profile
  | Preferences
  | { fileName: string; fileSize: number }
  | { id: string }
  | { [key: string]: string | number | boolean }
  | undefined;

export type ApiResponseData =
  | { success: boolean }
  | Profile
  | Preferences
  | undefined;

export interface ApiParams {
  [key: string]: string | number | boolean;
} 