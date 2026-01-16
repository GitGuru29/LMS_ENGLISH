import React from 'react';
import { Book, Users, LogOut, GraduationCap, X, Settings, FileText, Type, NotebookPen, BookOpenText, Video } from 'lucide-react';
import '../pages/Dashboard.css';

const Sidebar = ({ activeGrade, setActiveGrade, activeCategory, setActiveCategory, activeSection, onLogout, isOpen, onClose, onOpenProfile }) => {
    const grades = [6, 7, 8, 9, 10, 11];

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
                        <GraduationCap /> LMS Admin
                    </h2>
                    <button className="close-sidebar-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="grade-list">
                    <p style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold' }}>Classes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                        {grades.map(grade => (
                            <button
                                key={grade}
                                onClick={() => {
                                    setActiveGrade(grade);
                                    if (window.innerWidth <= 768) onClose(); // Close on selection on mobile
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px',
                                    background: activeGrade === grade ? '#e94560' : 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: '0.3s'
                                }}
                            >
                                <Book size={18} /> Grade {grade}
                            </button>
                        ))}
                    </div>
                </div>

                {activeSection === 'materials' && (
                    <div className="grade-list" style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                        <p style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold' }}>Categories</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                            {[
                                { id: 'papers', label: 'Past Papers', icon: FileText, color: '#e94560' },
                                { id: 'grammar', label: 'Grammar Activities', icon: Type, color: '#0f3460' },
                                { id: 'words', label: 'New Words', icon: NotebookPen, color: '#533483' },
                                { id: 'notices', label: 'Reading Articles', icon: BookOpenText, color: '#e94560' },
                                { id: 'video', label: 'Video Lessons', icon: Video, color: '#e94560' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveCategory(item.id);
                                        if (window.innerWidth <= 768) onClose();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px',
                                        background: activeCategory === item.id ? item.color : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: activeCategory === item.id ? '#fff' : '#ccc',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: '0.3s'
                                    }}
                                >
                                    <item.icon size={18} /> {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                        marginTop: 'auto'
                    }}
                >
                    <Settings size={18} /> Settings
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
                        marginTop: 'auto'
                    }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </>
    );
};

export default Sidebar;
