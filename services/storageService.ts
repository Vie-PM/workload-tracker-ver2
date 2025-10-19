import { Project, Session, GoogleSheetSettings } from '../types';

const PROJECTS_KEY = 'timeTrackerProjects';
const OFFLINE_SESSIONS_KEY = 'timeTrackerOfflineSessions';
const GOOGLE_SHEETS_SETTINGS_KEY = 'googleSheetSettings_v2'; // New key for new structure

export const loadProjects = (): Project[] => {
    try {
        const savedData = localStorage.getItem(PROJECTS_KEY);
        return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error("Failed to parse projects from localStorage", error);
        return [];
    }
};

export const saveProjects = (projects: Project[]): void => {
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save projects to localStorage", error);
    }
};

export const loadOfflineSessions = (): Session[] => {
    try {
        const savedData = localStorage.getItem(OFFLINE_SESSIONS_KEY);
        return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error("Failed to parse offline sessions from localStorage", error);
        return [];
    }
};

export const saveOfflineSessions = (sessions: Session[]): void => {
    try {
        localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error("Failed to save offline sessions to localStorage", error);
    }
};


export const loadGoogleSheetSettings = (): GoogleSheetSettings => {
    try {
        const savedData = localStorage.getItem(GOOGLE_SHEETS_SETTINGS_KEY);
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (error) {
        console.error("Failed to parse Google Sheet settings from localStorage", error);
    }
    return { clientId: '', sheetUrl: '' };
};

export const saveGoogleSheetSettings = (settings: GoogleSheetSettings): void => {
    try {
        localStorage.setItem(GOOGLE_SHEETS_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save Google Sheet settings to localStorage", error);
    }
};