export interface Options {
  bodyTypes: string[];
  jobs: string[];
  educations: string[];
  religions: string[];
  mbtis: string[];
  interests: string[];
  genders?: string[];
  smoking?: string[];
  drinking?: string[];
  [key: string]: string[] | undefined;
} 