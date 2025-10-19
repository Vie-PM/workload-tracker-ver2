
import React from 'react';
import { Alert as AlertType } from '../types';
import { InfoIcon, CheckCircleIcon, ExclamationIcon, XCircleIcon } from './icons';

interface AlertProps extends AlertType {
    onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, onClose }) => {
    const baseClasses = 'fixed top-5 right-5 z-50 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg';
    
    const typeClasses = {
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
    };
    
    const icons = {
        success: <CheckCircleIcon className="w-5 h-5 mr-3" />,
        warning: <ExclamationIcon className="w-5 h-5 mr-3" />,
        error: <XCircleIcon className="w-5 h-5 mr-3" />,
    }

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            {icons[type]}
            <div>
                <span className="font-medium">{message}</span>
            </div>
            <button onClick={onClose} className="ml-4 -mr-2 p-1.5 rounded-full hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-white">
                <XCircleIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Alert;
