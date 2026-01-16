import React from 'react';
import { Home, LogOut, GraduationCap, X, Settings, FileText, Type, BookOpen, BookOpenText, Video, Heart } from 'lucide-react';
import '../pages/Dashboard.css';

const StudentSidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, onOpenProfile }) => {
    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>
                        <GraduationCap /> LMS Student
                    </h2>
                    <button className="close-sidebar-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="grade-list">
                    {[
                        { id: 'papers', label: 'Past Papers', icon: FileText, color: '#e94560' },
                        { id: 'grammar', label: 'Grammar Activities', icon: Type, color: '#0f3460' },
                        { id: 'words', label: 'New Words', icon: BookOpen, color: '#533483' },
                        { id: 'notices', label: 'Reading Articles', icon: BookOpenText, color: '#e94560' },
                        { id: 'video', label: 'Video Lessons', icon: Video, color: '#e94560' },
                        { id: 'favorites', label: 'Favorites', icon: Heart, color: '#e94560' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth <= 768) onClose();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px',
                                background: activeTab === item.id ? item.color : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: activeTab === item.id ? '#fff' : '#ccc',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                                marginBottom: '5px',
                                transition: '0.3s'
                            }}
                        >
                            <item.icon size={18} /> {item.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        onClick={onOpenProfile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        <Settings size={18} /> Profile
                    </button>

                    <button
                        onClick={onLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px',
                            background: '#16213e',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: '10px'
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default StudentSidebar;
