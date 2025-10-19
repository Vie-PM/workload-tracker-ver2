import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import TodayStats from './components/TodayStats';
import ProjectManagement from './components/ProjectManagement';
import ReportGenerator from './components/ReportGenerator';
import Alert from './components/Alert';
import GoogleSheetSettings from './components/GoogleSheetSettings';
import { useTimeTracker } from './hooks/useTimeTracker';
import { calculateStatsFromSessions } from './utils/time.ts';
import { Alert as AlertType } from './types';

const App: React.FC = () => {
    const [alert, setAlert] = useState<AlertType | null>(null);
    const [timerDisplay, setTimerDisplay] = useState('00:00:00');

    const showAlert = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    }, []);

    const {
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
    } = useTimeTracker(showAlert);

    const handleProjectChange = (newProjectId: string | null) => {
        if (timerState.isRunning) {
            showAlert('Please stop the current timer before switching projects.', 'warning');
            return;
        }
        setTimerState(p => ({ ...p, currentProjectId: newProjectId }));
    };

    const handleStartTimer = () => {
        if (!timerState.currentProjectId) {
            showAlert('Please select a project first.', 'warning');
            return;
        }
        if (timerState.isRunning) return;
        setTimerState(prev => ({ ...prev, isRunning: true, currentSessionStart: Date.now() }));
    };

    const handlePauseTimer = () => {
        if (!timerState.isRunning) return;
        setTimerState(prev => ({ ...prev, isRunning: false }));
    };

    const handleStopTimer = async () => {
        if (!timerState.currentSessionStart) return;
        
        await saveSession();

        setTimerState({
            isRunning: false,
            currentProjectId: null,
            currentSessionStart: null,
            currentNote: '',
        });
    };

    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    const todayStats = useMemo(() => calculateStatsFromSessions(sessions, projects, today, 'day'), [sessions, projects, today]);
    const totalTodayHours = useMemo(() => todayStats.reduce((sum, s) => sum + s.hours, 0), [todayStats]);

    useEffect(() => {
        let interval: number | undefined;
        if (timerState.isRunning && timerState.currentSessionStart) {
            interval = window.setInterval(() => {
                const elapsed = Math.floor((Date.now() - timerState.currentSessionStart!) / 1000);
                const hours = Math.floor(elapsed / 3600);
                const minutes = Math.floor((elapsed % 3600) / 60);
                const seconds = elapsed % 60;
                setTimerDisplay(
                    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                );
            }, 1000);
        } else if (!timerState.isRunning && timerState.currentProjectId === null) {
            setTimerDisplay('00:00:00');
        }
        return () => window.clearInterval(interval);
    }, [timerState.isRunning, timerState.currentSessionStart, timerState.currentProjectId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg text-gray-700 font-semibold">Initializing Application...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                <Header />
                {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
                <main className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Timer
                                projects={projects}
                                timerState={timerState}
                                onProjectChange={handleProjectChange}
                                onNoteChange={(note) => setTimerState(p => ({ ...p, currentNote: note }))}
                                onStart={handleStartTimer}
                                onPause={handlePauseTimer}
                                onStop={handleStopTimer}
                                timerDisplay={timerDisplay}
                                isConnected={authState === 'signedIn'}
                            />
                            <TodayStats stats={todayStats} totalHours={totalTodayHours} />
                        </div>
                        <div className="space-y-6">
                           <GoogleSheetSettings
                                settings={settings}
                                onSaveSettings={saveSettings}
                                onSignIn={signIn}
                                onSignOut={signOut}
                                authState={authState}
                                userProfile={userProfile}
                           />
                           <ProjectManagement
                                projects={projects}
                                onAddProject={addProject}
                                onDeleteProject={deleteProject}
                                onToggleVisibility={toggleProjectVisibility}
                                showAlert={showAlert}
                            />
                            <ReportGenerator 
                                projects={projects}
                                sessions={sessions}
                                showAlert={showAlert} 
                                isConnected={authState === 'signedIn'}
                            />
                        </div>
                    </div>
                     {(offlineSessions.length > 0 || isSyncing) && (
                        <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
                            {isSyncing 
                                ? <p><b>Syncing...</b> Attempting to sync {offlineSessions.length} saved session(s).</p>
                                : <p><b>Offline Mode:</b> You have {offlineSessions.length} session(s) saved locally. They will be synced automatically when you sign in.</p>
                            }
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;