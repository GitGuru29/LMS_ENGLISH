import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MaterialManager from '../components/MaterialManager';
import StudentManager from '../components/StudentManager';
import ProfileModal from '../components/ProfileModal'; // Import
import { Menu } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
    const [activeGrade, setActiveGrade] = useState(6);
    const [activeCategory, setActiveCategory] = useState('papers');
    const [activeSection, setActiveSection] = useState('materials'); // 'materials' or 'students'
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false); // New State

    return (
        <div className="dashboard-container">
            {/* Sidebar Navigation */}
            <Sidebar
                activeGrade={activeGrade}
                setActiveGrade={setActiveGrade}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                activeSection={activeSection}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpenProfile={() => setProfileOpen(true)} // Pass handler
            />

            {/* Main Content */}
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div className="header-top-row">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="header-title">
                            <h1>Grade {activeGrade} Classroom</h1>
                            <p>Manage materials and students for this class.</p>
                        </div>
                    </div>

                    {/* Toggle View */}
                    <div className="view-toggle">
                        <button
                            onClick={() => setActiveSection('materials')}
                            className={`toggle - btn ${activeSection === 'materials' ? 'active' : 'inactive'} `}
                        >
                            Materials
                        </button>
                        <button
                            onClick={() => setActiveSection('students')}
                            className={`toggle - btn ${activeSection === 'students' ? 'active' : 'inactive'} `}
                        >
                            Students
                        </button>
                    </div>
                </header>

                {activeSection === 'materials' ? (
                    <MaterialManager grade={activeGrade} category={activeCategory} user={user} />
                ) : (
                    <StudentManager grade={activeGrade} />
                )}
            </div>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    user={user}
                    onClose={() => setProfileOpen(false)}
                    onLogout={onLogout}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
