export interface Session {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  note: string;
  date: string; // YYYY-MM-DD
  projectId: string;
  synced?: boolean;
}

export interface Project {
  id: string;
  name: string;
  isHidden: boolean;
}

export interface TimerState {
    isRunning: boolean;
    currentProjectId: string | null;
    currentSessionStart: number | null;
    currentNote: string;
}

export interface ProjectStat {
    projectId: string;
    projectName: string;
    hours: number;
}

export type ReportType = 'day' | 'week' | 'month';

export interface Alert {
  message: string;
  type: 'success' | 'warning' | 'error';
}

export interface GoogleSheetSettings {
    clientId: string;
    sheetUrl: string;
}

export type AuthState = 'signedOut' | 'signedIn' | 'pending' | 'expired' | 'error';

export interface UserProfile {
    email: string;
    name: string;
    picture: string;
}