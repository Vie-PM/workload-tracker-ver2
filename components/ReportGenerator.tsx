import React, { useState, useEffect } from 'react';
import { Project, ProjectStat, ReportType, Session } from '../types';
import { calculateStatsFromSessions, formatTime } from '../utils/time.ts';
import { DocumentReportIcon, DownloadIcon, RefreshIcon, ExcelIcon } from './icons';

interface ReportGeneratorProps {
    projects: Project[];
    sessions: Session[];
    showAlert: (message: string, type?: 'success' | 'warning' | 'error') => void;
    isConnected: boolean;
}

// Helper to format YYYY-MM-DD to DD/MM/YYYY
const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

// Helper to parse DD/MM/YYYY to YYYY-MM-DD
const parseDateFromDisplay = (displayDate: string): string | null => {
    const parts = displayDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) {
        const [, day, month, year] = parts;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);
        
        if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900 && y < 3000) {
             const dateObj = new Date(y, m - 1, d);
             if (dateObj.getFullYear() === y && dateObj.getMonth() === m - 1 && dateObj.getDate() === d) {
                return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
             }
        }
    }
    return null;
};

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ projects, sessions, showAlert, isConnected }) => {
    const [reportType, setReportType] = useState<ReportType>('day');
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [displayDateValue, setDisplayDateValue] = useState(formatDateForDisplay(reportDate));
    const [isDateInvalid, setIsDateInvalid] = useState(false);
    
    const [reportData, setReportData] = useState<ProjectStat[]>([]);
    const [totalHours, setTotalHours] = useState(0);

    useEffect(() => {
        setDisplayDateValue(formatDateForDisplay(reportDate));
        if (reportDate) {
            setIsDateInvalid(false);
        }
    }, [reportDate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayDateValue(inputValue);
        
        if (inputValue.trim() === '') {
            setReportDate('');
            setIsDateInvalid(false);
            return;
        }
    
        const isoDate = parseDateFromDisplay(inputValue);
        if (isoDate) {
            setReportDate(isoDate);
            setIsDateInvalid(false);
        } else {
            setIsDateInvalid(true);
        }
    };

    const handleGenerateReport = () => {
        if (!isConnected) {
            showAlert('Please sign in with Google to generate reports.', 'warning');
            return;
        }
        if (isDateInvalid) {
            showAlert('Please enter a valid date in DD/MM/YYYY format.', 'warning');
            return;
        }
        if (!reportDate) {
            showAlert('Please select a date for the report.', 'warning');
            return;
        }
        const stats = calculateStatsFromSessions(sessions, projects, reportDate, reportType);
        setReportData(stats);
        setTotalHours(stats.reduce((sum, s) => sum + s.hours, 0));
    };

    const handleExport = (format: 'csv' | 'excel') => {
        if (reportData.length === 0) {
            showAlert('No data to export. Generate a report first.', 'warning');
            return;
        }
        
        const formattedDate = formatDateForDisplay(reportDate).replace(/\//g, '-');
        const filename = `time_tracker_report_${reportType}_${formattedDate}`;

        if (format === 'csv') {
            exportToCsv(filename);
        } else {
            exportToExcel(filename);
        }
    };

    const exportToCsv = (filename: string) => {
        let csvContent = 'data:text/csv;charset=utf-8,Project,Time (Hours),Formatted Time,Percentage (%)\n';
        reportData.forEach(stat => {
            const percentage = totalHours > 0 ? (stat.hours / totalHours) * 100 : 0;
            csvContent += `"${stat.projectName.replace(/"/g, '""')}",${stat.hours.toFixed(4)},"${formatTime(stat.hours)}",${percentage.toFixed(2)}\n`;
        });
        csvContent += `Total,${totalHours.toFixed(4)},"${formatTime(totalHours)}",100.00`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert('CSV report exported successfully!');
    }

    const exportToExcel = (filename: string) => {
        const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => `&#${c.charCodeAt(0)};`);
        
        const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Time Report">
    <Table>
      <Row ss:StyleID="s1"><Cell><Data ss:Type="String">Project</Data></Cell><Cell><Data ss:Type="String">Time (Hours)</Data></Cell><Cell><Data ss:Type="String">Formatted Time</Data></Cell><Cell><Data ss:Type="String">Percentage (%)</Data></Cell></Row>
      ${reportData.map(stat => {
          const percentage = totalHours > 0 ? (stat.hours / totalHours) * 100 : 0;
          return `<Row><Cell><Data ss:Type="String">${escapeXml(stat.projectName)}</Data></Cell><Cell><Data ss:Type="Number">${stat.hours.toFixed(4)}</Data></Cell><Cell><Data ss:Type="String">${formatTime(stat.hours)}</Data></Cell><Cell><Data ss:Type="Number">${percentage.toFixed(2)}</Data></Cell></Row>`;
      }).join('')}
      <Row ss:StyleID="s1"><Cell><Data ss:Type="String">Total</Data></Cell><Cell><Data ss:Type="Number">${totalHours.toFixed(4)}</Data></Cell><Cell><Data ss:Type="String">${formatTime(totalHours)}</Data></Cell><Cell><Data ss:Type="Number">100</Data></Cell></Row>
    </Table>
  </Worksheet>
</Workbook>`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showAlert('Excel report exported successfully!');
    };
    
    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
             <div className="flex items-center space-x-2 mb-4">
                <DocumentReportIcon className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-800">Reports</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="day">By Day</option>
                    <option value="week">By Week</option>
                    <option value="month">By Month</option>
                </select>
                <input
                    type="text"
                    value={displayDateValue}
                    onChange={handleDateChange}
                    placeholder="DD/MM/YYYY"
                    className={`w-full bg-white border rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 ${isDateInvalid ? 'border-red-500 ring-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <button onClick={handleGenerateReport} className="flex items-center justify-center bg-indigo-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition-colors">
                   <RefreshIcon className="w-5 h-5 mr-2"/> View
                </button>
                <button onClick={() => handleExport('csv')} className="flex items-center justify-center bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                    <DownloadIcon className="w-5 h-5 mr-2"/> CSV
                </button>
                <button onClick={() => handleExport('excel')} className="flex items-center justify-center bg-teal-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                    <ExcelIcon className="w-5 h-5 mr-2"/> Excel
                </button>
            </div>

            {reportData.length > 0 && (
                <div className="text-center my-2">
                    <p className="text-sm text-gray-600">
                        Showing report for {reportType} of: <span className="font-semibold text-indigo-600">{formatDateForDisplay(reportDate)}</span>
                    </p>
                </div>
            )}

            <div className="max-h-60 overflow-y-auto">
                 <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-2">Project</th>
                            <th scope="col" className="px-4 py-2 text-right">Time</th>
                            <th scope="col" className="px-4 py-2 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.length > 0 ? (
                            <>
                                {reportData.map(stat => {
                                    const percentage = totalHours > 0 ? (stat.hours / totalHours) * 100 : 0;
                                    return (
                                        <tr key={stat.projectId} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{stat.projectName}</td>
                                            <td className="px-4 py-2 text-right">{formatTime(stat.hours)}</td>
                                            <td className="px-4 py-2 text-right">{percentage.toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="px-4 py-2">Total</td>
                                    <td className="px-4 py-2 text-right">{formatTime(totalHours)}</td>
                                    <td className="px-4 py-2 text-right">{totalHours > 0 ? '100.0%' : '0.0%'}</td>
                                </tr>
                            </>
                        ) : (
                           <tr>
                                <td colSpan={3} className="text-center py-6 text-gray-500">
                                  {isConnected ? "Generate a report to see data." : "Please sign in to Google to view reports."}
                                </td>
                           </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportGenerator;