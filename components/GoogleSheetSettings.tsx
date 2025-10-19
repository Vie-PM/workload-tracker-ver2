import React, { useState, useEffect } from 'react';
import { GoogleSheetSettings as Settings, AuthState, UserProfile } from '../types';
import { CogIcon, InfoIcon, GoogleSheetIcon } from './icons';

interface GoogleSheetSettingsProps {
    settings: Settings;
    onSaveSettings: (settings: Settings) => void;
    onSignIn: () => void;
    onSignOut: () => void;
    authState: AuthState;
    userProfile: UserProfile | null;
}

const GoogleSheetSettings: React.FC<GoogleSheetSettingsProps> = ({
    settings,
    onSaveSettings,
    onSignIn,
    onSignOut,
    authState,
    userProfile
}) => {
    const [clientId, setClientId] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');

    useEffect(() => {
        setClientId(settings.clientId || '');
        setSheetUrl(settings.sheetUrl || '');
    }, [settings]);

    const handleSave = () => {
        onSaveSettings({ clientId, sheetUrl });
    };
    
    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
                <CogIcon className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-800">Google Sheets Sync</h2>
            </div>
            
            {authState === 'signedIn' && userProfile ? (
                <div className="text-center space-y-4">
                    <img src={userProfile.picture} alt="User profile" className="w-16 h-16 rounded-full mx-auto shadow-md" />
                    <div>
                        <p className="font-semibold text-gray-800">{userProfile.name}</p>
                        <p className="text-sm text-gray-500">{userProfile.email}</p>
                    </div>
                    <p className="text-green-600 font-semibold">✅ Connected</p>
                    <button
                        onClick={onSignOut}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                            Google Client ID
                        </label>
                        <input
                            type="text"
                            id="clientId"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Enter your Google Client ID"
                            className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            Google Sheet URL
                        </label>
                        <input
                            type="url"
                            id="sheetUrl"
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                     <div className="bg-indigo-50 p-3 rounded-lg flex items-start space-x-2 text-sm text-indigo-700">
                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                        <span>Save settings, then sign in. Your Sheet headers must be: `Project`, `Start Time`, `End Time`, `Duration (h)`, `Note`, `Date`.</span>
                    </div>
                    <button
                        onClick={handleSave}
                        className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition-colors"
                    >
                        Save Settings
                    </button>
                    <button
                        onClick={onSignIn}
                        disabled={!settings.clientId || !settings.sheetUrl}
                        className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.53-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        Sign in with Google
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleSheetSettings;