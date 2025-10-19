import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Session, TimerState, GoogleSheetSettings, AuthState, UserProfile } from '../types';
import * as storage from '../services/storageService';
import * as sheetService from '../services/googleSheetService';

// To make TypeScript aware of the google object from the GSI script
declare global {
    const google: any;
}

export const useTimeTracker = (showAlert: (message: string, type?: 'success' | 'warning' | 'error') => void) => {
    // App Data State
    const [projects, setProjects] = useState<Project[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [offlineSessions, setOfflineSessions] = useState<Session[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Settings & Auth State
    const [settings, setSettings] = useState<GoogleSheetSettings>({ clientId: '', sheetUrl: '' });
    const [authState, setAuthState] = useState<AuthState>('pending');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const tokenClient = useRef<any>(null);

    // Timer State
    const [timerState, setTimerState] = useState<TimerState>({
        isRunning: false,
        currentProjectId: null,
        currentSessionStart: null,
        currentNote: '',
    });
    
    // --- AUTH & INITIALIZATION ---

    const initialize = useCallback(async () => {
        setIsLoading(true);
        const loadedSettings = storage.loadGoogleSheetSettings();
        const loadedProjects = storage.loadProjects();
        const loadedOffline = storage.loadOfflineSessions();
        
        setSettings(loadedSettings);
        setProjects(loadedProjects);
        setOfflineSessions(loadedOffline);

        if (loadedSettings.clientId) {
            setAuthState('signedOut'); // Assume signed out until token is confirmed
        } else {
            setAuthState('pending'); // No client ID, needs setup
        }
        setIsLoading(false);
    }, []);
    
    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        storage.saveProjects(projects);
    }, [projects]);
    
    const signIn = useCallback(() => {
        if (!settings.clientId) {
            showAlert('Please provide a Google Client ID in the settings.', 'error');
            return;
        }
        if (!settings.sheetUrl) {
            showAlert('Please provide your Google Sheet URL in the settings.', 'error');
            return;
        }

        // SAFETY CHECK: Ensure Google GSI script is loaded
        if (typeof google === 'undefined' || !google.accounts) {
            showAlert('Google Sign-In is not ready. Please wait a moment and try again.', 'error');
            console.error("Google GSI script has not been loaded or initialized yet.");
            return;
        }

        try {
            tokenClient.current = google.accounts.oauth2.initTokenClient({
                client_id: settings.clientId,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                callback: async (tokenResponse: any) => {
                    if (tokenResponse.error) {
                         showAlert(`Sign-in error: ${tokenResponse.error}`, 'error');
                         setAuthState('error');
                         return;
                    }
                    setAuthState('signedIn');
                    await fetchUserProfile(tokenResponse.access_token);
                    await fetchData(tokenResponse.access_token);
                },
            });
            tokenClient.current.requestAccessToken();
        } catch(e) {
            console.error(e);
            showAlert('An unexpected error occurred during Google Sign-In.', 'error');
            setAuthState('error');
        }

    }, [settings.clientId, settings.sheetUrl, showAlert]);

    const signOut = useCallback(() => {
        // No explicit token revocation needed for this flow
        setAuthState('signedOut');
        setUserProfile(null);
        setSessions([]);
        showAlert('You have been signed out.', 'success');
    }, [showAlert]);
    
    const saveSettings = (newSettings: GoogleSheetSettings) => {
        storage.saveGoogleSheetSettings(newSettings);
        setSettings(newSettings);
        showAlert('Settings saved! Please sign in to connect.', 'success');
        if (authState === 'signedIn') {
            signOut(); // Force sign out if settings change
        } else {
            setAuthState('signedOut');
        }
    };
    
    // --- DATA FETCHING & SYNCING ---

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const profile = await response.json();
            setUserProfile({ email: profile.email, name: profile.name, picture: profile.picture });
        } catch (error) {
            console.error('Could not fetch user profile:', error);
        }
    };

    const fetchData = useCallback(async (token: string) => {
        setIsLoading(true);
        const isConnected = await sheetService.testConnection(settings.sheetUrl, token);
        if (isConnected) {
            const allSessions = await sheetService.fetchAllSessions(settings.sheetUrl, token, projects);
            setSessions(allSessions);
            await syncOfflineSessions(token);
        } else {
            setAuthState('error');
            showAlert('Could not connect to Google Sheets. Check Sheet URL and share settings.', 'error');
        }
        setIsLoading(false);
    }, [settings.sheetUrl, projects, showAlert]);

    const syncOfflineSessions = useCallback(async (token: string) => {
        const pendingSessions = storage.loadOfflineSessions();
        if (pendingSessions.length === 0) return;

        setIsSyncing(true);
        showAlert(`Attempting to sync ${pendingSessions.length} offline session(s)...`, 'warning');
        
        let successfullySyncedCount = 0;
        const stillPending: Session[] = [];

        for (const session of pendingSessions) {
            const project = projects.find(p => p.id === session.projectId);
            if (project) {
                const success = await sheetService.appendSession(settings.sheetUrl, token, session, project.name);
                if (success) {
                    successfullySyncedCount++;
                } else {
                    stillPending.push(session);
                }
            }
        }
        
        storage.saveOfflineSessions(stillPending);
        setOfflineSessions(stillPending);

        if (successfullySyncedCount > 0) {
            showAlert(`${successfullySyncedCount} session(s) synced successfully!`, 'success');
            // Refetch all data to get the latest state
            const allSessions = await sheetService.fetchAllSessions(settings.sheetUrl, token, projects);
            setSessions(allSessions);
        }
        if (stillPending.length > 0) {
            showAlert(`Failed to sync ${stillPending.length} session(s). They remain saved locally.`, 'error');
        }
        setIsSyncing(false);
    }, [showAlert, projects, settings.sheetUrl]);


    // --- CORE APP LOGIC ---

    const addProject = useCallback((name: string) => {
        const newProject: Project = { id: Date.now().toString(), name, isHidden: false };
        setProjects(prev => [...prev, newProject]);
    }, []);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (timerState.currentProjectId === id) {
            setTimerState({ isRunning: false, currentProjectId: null, currentSessionStart: null, currentNote: '' });
        }
    }, [timerState.currentProjectId]);

    const toggleProjectVisibility = useCallback((id: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, isHidden: !p.isHidden } : p));
    }, []);

    const saveSession = useCallback(async () => {
        if (!timerState.currentSessionStart || !timerState.currentProjectId) return;
        
        const endTime = Date.now();
        const duration = Math.floor((endTime - timerState.currentSessionStart) / 1000);
        if (duration < 1) return;

        const newSession: Session = {
            id: Date.now().toString(),
            startTime: timerState.currentSessionStart,
            endTime,
            duration,
            note: timerState.currentNote,
            date: new Date(timerState.currentSessionStart).toISOString().split('T')[0],
            projectId: timerState.currentProjectId,
        };

        const project = projects.find(p => p.id === newSession.projectId);
        if (!project) return;
        
        if (authState !== 'signedIn') {
             showAlert('Offline. Session saved locally.', 'warning');
             const newOffline = [...offlineSessions, newSession];
             storage.saveOfflineSessions(newOffline);
             setOfflineSessions(newOffline);
             return;
        }

        // Need to get a fresh token to ensure it's not expired
        tokenClient.current.requestAccessToken({ prompt: '' });
        // The callback of initTokenClient will handle the append logic after getting a token
        // This is a bit of a workaround for GSI's callback nature. Let's append directly.
        // A better approach is to wrap the GSI client in a promise. For now, let's assume the token is fresh enough.
        
        // This part is tricky with GSI. For simplicity, we assume the token is valid.
        // In a real app, you'd wrap the token client in a promise-based service.
        // Let's just try to append and if it fails, save offline.
        
        // Let's implement a quick-and-dirty token grab
        const getTokenAndAppend = () => new Promise<void>((resolve) => {
            if (typeof google === 'undefined' || !google.accounts) {
                showAlert('Google Sign-In is not ready. Session saved locally.', 'warning');
                const newOffline = [...offlineSessions, newSession];
                storage.saveOfflineSessions(newOffline);
                setOfflineSessions(newOffline);
                resolve();
                return;
            }
            tokenClient.current = google.accounts.oauth2.initTokenClient({
                client_id: settings.clientId,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                callback: async (tokenResponse: any) => {
                    if (tokenResponse.access_token) {
                       const success = await sheetService.appendSession(settings.sheetUrl, tokenResponse.access_token, newSession, project.name);
                       if (success) {
                            setSessions(prev => [...prev, { ...newSession, synced: true }]);
                            showAlert('Session saved to Google Sheets!', 'success');
                       } else {
                           setAuthState('error');
                           showAlert('Connection lost. Session saved locally.', 'warning');
                           const newOffline = [...offlineSessions, newSession];
                           storage.saveOfflineSessions(newOffline);
                           setOfflineSessions(newOffline);
                       }
                    } else {
                         showAlert('Could not get authorization. Session saved locally.', 'warning');
                         const newOffline = [...offlineSessions, newSession];
                         storage.saveOfflineSessions(newOffline);
                         setOfflineSessions(newOffline);
                    }
                    resolve();
                },
            });
            tokenClient.current.requestAccessToken({ prompt: '' }); // An empty prompt attempts a silent refresh
        });

        await getTokenAndAppend();
        
    }, [timerState, projects, authState, offlineSessions, showAlert, settings.clientId, settings.sheetUrl]);

    return {
        projects,
        sessions,
        offlineSessions,
        timerState,
        setTimerState,
        settings,
        authState,
        userProfile,
        isLoading,
        isSyncing,
        addProject,
        deleteProject,
        toggleProjectVisibility,
        saveSession,
        saveSettings,
        signIn,
        signOut,
    };
};
