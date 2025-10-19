import { GoogleSheetSettings, Session, Project } from '../types';

const getSheetIdFromUrl = (url: string): string | null => {
    const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const getApiUrl = (spreadsheetId: string, range: string) => 
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

const getAuthHeaders = (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

export const testConnection = async (sheetUrl: string, token: string): Promise<boolean> => {
    const spreadsheetId = getSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId || !token) return false;

    try {
        const response = await fetch(getApiUrl(spreadsheetId, 'A1'), {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        console.error("Connection test failed:", error);
        return false;
    }
};

export const appendSession = async (sheetUrl: string, token: string, session: Session, projectName: string): Promise<boolean> => {
    const spreadsheetId = getSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId || !token) return false;

    // A: Project, B: Start Time, C: End Time, D: Duration (h), E: Note, F: Date
    const rowData = [
        projectName,
        new Date(session.startTime).toISOString(),
        new Date(session.endTime).toISOString(),
        (session.duration / 3600).toFixed(4),
        session.note,
        session.date
    ];
    
    const body = {
        values: [rowData],
    };

    try {
        const response = await fetch(
            `${getApiUrl(spreadsheetId, 'A1:F1')}:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify(body),
            }
        );
        return response.ok;
    } catch (error) {
        console.error("Failed to append session:", error);
        return false;
    }
};

export const fetchAllSessions = async (sheetUrl: string, token: string, projects: Project[]): Promise<Session[]> => {
    const spreadsheetId = getSheetIdFromUrl(sheetUrl);
    if (!spreadsheetId || !token) return [];

    try {
        const response = await fetch(getApiUrl(spreadsheetId, 'A:F'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data from Google Sheet. Status: ${response.status}`);
        }

        const data = await response.json();
        const values = data.values || [];
        
        const dataRows = (values.length > 0 && values[0][0]?.toLowerCase() === 'project') ? values.slice(1) : values;

        return dataRows.map((row: any[], index: number): Session | null => {
            const [projectName, startTimeStr, endTimeStr] = row;
            if (!projectName || !startTimeStr || !endTimeStr) return null;

            const project = projects.find(p => p.name === projectName);
            const startTime = new Date(startTimeStr).getTime();
            const endTime = new Date(endTimeStr).getTime();

            if (isNaN(startTime) || isNaN(endTime)) return null;
            
            return {
                id: `sheet-${index}-${startTime}`,
                projectId: project ? project.id : 'unknown',
                startTime,
                endTime,
                duration: Math.max(0, (endTime - startTime) / 1000),
                note: row[4] || '',
                date: new Date(startTime).toISOString().split('T')[0],
                synced: true,
            };
        }).filter((s: Session | null): s is Session => s !== null && s.projectId !== 'unknown');
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return [];
    }
};