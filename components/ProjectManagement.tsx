
import React, { useState } from 'react';
import { Project } from '../types';
import { AddIcon, DeleteIcon, CogIcon, EyeIcon, EyeOffIcon } from './icons';

interface ProjectManagementProps {
    projects: Project[];
    onAddProject: (name: string) => void;
    onDeleteProject: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    showAlert: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
    projects,
    onAddProject,
    onDeleteProject,
    onToggleVisibility,
    showAlert
}) => {
    const [newProjectName, setNewProjectName] = useState('');

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            showAlert('Project name cannot be empty.', 'warning');
            return;
        }
        onAddProject(newProjectName.trim());
        setNewProjectName('');
        showAlert('Project added successfully!');
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            onDeleteProject(id);
            showAlert('Project deleted successfully.', 'success');
        }
    };

    return (
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-xl shadow-lg">
             <div className="flex items-center space-x-2 mb-4">
                <CogIcon className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold text-gray-800">Manage Projects</h2>
            </div>
            
            <form onSubmit={handleAddProject} className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New project name..."
                    maxLength={50}
                    className="flex-grow bg-white border border-gray-300 rounded-lg shadow-sm py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    className="flex-shrink-0 bg-indigo-500 text-white p-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors transform hover:scale-105"
                >
                    <AddIcon className="w-5 h-5" />
                </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {projects.length > 0 ? projects.map(project => (
                    <div key={project.id} className="flex items-center bg-gray-50 p-2 rounded-lg">
                        <span className="flex-grow text-gray-700">{project.name}</span>
                        <button onClick={() => onToggleVisibility(project.id)} className="p-2 text-gray-500 hover:text-indigo-600">
                           {project.isHidden ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 text-gray-500 hover:text-red-600"
                        >
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-4">No projects yet. Add one to get started!</p>
                )}
            </div>
        </div>
    );
};

export default ProjectManagement;
