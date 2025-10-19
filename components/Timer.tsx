import React from 'react';
import { Project, TimerState } from '../types';
import { PlayIcon, PauseIcon, StopIcon } from './icons';

interface TimerProps {
    projects: Project[];
    timerState: TimerState;
    onProjectChange: (projectId: string | null) => void;
    onNoteChange: (note: string) => void;
    onStart: () => void;
    onPause: () => void;
    onStop: () => void;
    timerDisplay: string;
    isConnected: boolean;
}

const Timer: React.FC<TimerProps> = ({
    projects,
    timerState,
    onProjectChange,
    onNoteChange,
    onStart,
    onPause,
    onStop,
    timerDisplay,
    isConnected
}) => {
    const visibleProjects = projects.filter(p => !p.isHidden);
    const canStart = !!timerState.currentProjectId && isConnected;
    const canStop = !!timerState.currentSessionStart && isConnected;

    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Project
                    </label>
                    <select
                        id="projectSelect"
                        value={timerState.currentProjectId || ''}
                        onChange={(e) => onProjectChange(e.target.value || null)}
                        disabled={timerState.isRunning}
                        className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">-- Choose a project --</option>
                        {visibleProjects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>
                 <div className="md:mt-8">
                     <input
                        type="text"
                        value={timerState.currentNote}
                        onChange={(e) => onNoteChange(e.target.value)}
                        placeholder="Note (optional)..."
                        maxLength={100}
                        className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="text-center my-6">
                <p className="text-gray-500 text-sm">Working Time</p>
                <div className="text-6xl font-bold font-mono text-indigo-600 tracking-wider my-2">
                    {timerDisplay}
                </div>
            </div>

            <div className="flex justify-center items-center space-x-4">
                {!timerState.isRunning ? (
                    <button
                        onClick={onStart}
                        disabled={!canStart}
                        title={!isConnected ? "Please connect to Google Sheets first" : !timerState.currentProjectId ? "Please select a project" : "Start timer"}
                        className="flex items-center justify-center w-32 h-12 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                    >
                        <PlayIcon className="w-6 h-6 mr-2" />
                        <span>Play</span>
                    </button>
                ) : (
                    <button
                        onClick={onPause}
                        className="flex items-center justify-center w-32 h-12 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105"
                    >
                        <PauseIcon className="w-6 h-6 mr-2" />
                        <span>Pause</span>
                    </button>
                )}
                <button
                    onClick={onStop}
                    disabled={!canStop}
                    title={!isConnected ? "Please connect to Google Sheets first" : !canStop ? "Timer not running" : "Stop timer"}
                    className="flex items-center justify-center w-32 h-12 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                    <StopIcon className="w-6 h-6 mr-2" />
                    <span>Stop</span>
                </button>
            </div>
             {!isConnected && <p className="text-center text-red-600 text-sm mt-4">Please connect to Google Sheets in the settings to start tracking time.</p>}
        </div>
    );
};

export default Timer;