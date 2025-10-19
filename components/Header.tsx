import React, { useState, useEffect } from 'react';
import { ClockIcon } from './icons';

const Header: React.FC = () => {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = today.getFullYear();
        setCurrentDate(`${day}/${month}/${year}`);
    }, []);

    return (
        <header className="bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-5">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg text-white">
                        <ClockIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Time Tracker</h1>
                        <p className="text-sm text-gray-500">{currentDate}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;