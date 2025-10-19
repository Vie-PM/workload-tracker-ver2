import React from 'react';
import { ProjectStat } from '../types';
import { formatTime } from '../utils/time.ts';
import { ChartBarIcon, ClockIcon } from './icons';

interface TodayStatsProps {
    stats: ProjectStat[];
    totalHours: number;
}

const StatCard: React.FC<{ stat: ProjectStat; totalHours: number }> = ({ stat, totalHours }) => {
    const percentage = totalHours > 0 ? (stat.hours / totalHours) * 100 : 0;
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <strong className="text-gray-800">{stat.projectName}</strong>
                <span className="text-indigo-600 font-semibold">{formatTime(stat.hours)}</span>
            </div>
            <div className="mt-2">
                 <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};


const TodayStats: React.FC<TodayStatsProps> = ({ stats, totalHours }) => {
    const status = totalHours > 8 ? "Overtime" : "Normal";
    const statusColor = totalHours > 8 ? "text-red-500" : "text-green-500";
    
    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center space-x-2">
                    <ChartBarIcon className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-xl font-bold text-gray-800">Today's Stats</h2>
                 </div>
                 <div className="text-right">
                    <p className="font-semibold text-indigo-600 text-lg">{formatTime(totalHours)}</p>
                    <p className={`text-sm font-medium ${statusColor}`}>{status}</p>
                 </div>
            </div>

            {stats.length > 0 ? (
                <div className="space-y-3">
                    {stats.map(stat => (
                       <StatCard key={stat.projectId} stat={stat} totalHours={totalHours}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <ClockIcon className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="mt-4 text-gray-500">No time tracked today.</p>
                    <p className="text-sm text-gray-400">Start the timer to see your stats here.</p>
                </div>
            )}
        </div>
    );
};

export default TodayStats;
