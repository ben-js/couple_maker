export interface PriorityOption {
  id: string;
  label: string;
  color: string;
}

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
  priority?: PriorityOption[];
  [key: string]: string[] | PriorityOption[] | undefined;
} 