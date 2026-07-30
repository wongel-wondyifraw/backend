export type LeaderType = 'member' | 'minister';

export interface LeaderSummary {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  type: LeaderType;
}
