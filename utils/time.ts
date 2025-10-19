import { Project, ProjectStat, ReportType, Session } from '../types';

/**
 * Formats a duration in total hours into a "Xh Ym" string.
 */
export const formatTime = (hours: number): string => {
    if (isNaN(hours) || hours < 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
};

/**
 * Get the ISO week number for a given date.
 */
function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Checks if a session date matches a given date and report type (day, week, month).
 */
function matchDateRange(sessionDateStr: string, reportDateStr: string, type: ReportType): boolean {
    if (!sessionDateStr || !reportDateStr) return false;
    const sessionD = new Date(sessionDateStr);
    const reportD = new Date(reportDateStr);

    if (isNaN(sessionD.getTime()) || isNaN(reportD.getTime())) return false;

    if (type === 'day') {
        return sessionDateStr === reportDateStr;
    }
    
    if (type === 'week') {
        return getWeekNumber(sessionD) === getWeekNumber(reportD) && sessionD.getFullYear() === reportD.getFullYear();
    }
    
    if (type === 'month') {
        return sessionD.getMonth() === reportD.getMonth() && sessionD.getFullYear() === reportD.getFullYear();
    }
    
    return false;
}

/**
 * Calculates project statistics from a flat list of sessions for a given date and report type.
 */
export const calculateStatsFromSessions = (
    sessions: Session[], 
    projects: Project[], 
    date: string, 
    type: ReportType
): ProjectStat[] => {
    const projectHours: { [key: string]: number } = {};

    sessions.forEach(session => {
        if (matchDateRange(session.date, date, type)) {
            if (!projectHours[session.projectId]) {
                projectHours[session.projectId] = 0;
            }
            projectHours[session.projectId] += session.duration / 3600;
        }
    });

    return Object.entries(projectHours)
        .map(([projectId, hours]) => {
            const project = projects.find(p => p.id === projectId);
            return {
                projectId,
                projectName: project ? project.name : 'Unknown Project',
                hours,
            };
        })
        .filter(stat => stat.projectName !== 'Unknown Project')
        .sort((a, b) => b.hours - a.hours);
};
