import React, { useState, useEffect } from 'react';
import { FileText, Video, Folder, BookOpen, User, Type, Bell, BookOpenText, Menu, Heart } from 'lucide-react';
import api from '../api';
import PDFViewer from '../components/PDFViewer';
import StudentSidebar from '../components/StudentSidebar';
import ProfileModal from '../components/ProfileModal';
import './Dashboard.css';

const StudentDashboard = ({ user, onLogout }) => {
    const [materials, setMaterials] = useState([]);
    const [activeTab, setActiveTab] = useState('favorites');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [favorites, setFavorites] = useState([]); // Array of favorite IDs

    const fetchFavorites = async () => {
        try {
            const res = await api.get('/favorites');
            setFavorites(res.data);
        } catch (err) {
            console.error("Failed to fetch favorites");
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                if (activeTab === 'favorites') {
                    // Fetch ALL materials first, then filter client-side (simplest for now)
                    // Or backend could support /materials?favorites=true
                    const res = await api.get('/materials');
                    // Filter by favorites
                    const favMaterials = res.data.filter(mat => favorites.includes(mat.id));
                    setMaterials(favMaterials);
                } else {
                    const res = await api.get('/materials', { params: { category: activeTab } });
                    setMaterials(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch materials");
            }
        };
        fetchMaterials();
    }, [activeTab, favorites]); // Re-run when favorites change to update list

    const toggleFavorite = async (materialId) => {
        try {
            await api.post('/favorites', { material_id: materialId });
            // Optimistic Update or Refetch
            if (favorites.includes(materialId)) {
                setFavorites(prev => prev.filter(id => id !== materialId));
            } else {
                setFavorites(prev => [...prev, materialId]);
            }
        } catch (err) {
            console.error("Failed to toggle favorite");
        }
    };

    const getIcon = (category) => {
        switch (category) {
            case 'papers': return <FileText size={40} color="#e94560" />;
            case 'grammar': return <Type size={40} color="#0f3460" />;
            case 'words': return <BookOpen size={40} color="#533483" />;
            case 'notices': return <BookOpenText size={40} color="#e94560" />;
            case 'video': return <Video size={40} color="#e94560" />;
            case 'favorites': return <Heart size={40} color="#e94560" />;
            default: return <FileText size={40} />;
        }
    };

    return (
        <div className="dashboard-container">
            <StudentSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenProfile={() => setIsProfileOpen(true)}
            />

            <div className="dashboard-content">


                <div className="content-area">
                    <div className="header-top-row">
                        <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <h1 style={{ color: '#333' }}>Welcome, {user.full_name}</h1>
                    </div>

                    {/* Dynamic Header */}
                    <div style={{ marginBottom: '20px', borderBottom: '2px solid #e94560', paddingBottom: '10px' }}>
                        <h2 style={{ color: '#1a1a2e', margin: 0 }}>
                            {activeTab === 'papers' && 'Past Papers'}
                            {activeTab === 'grammar' && 'Grammar Activities'}
                            {activeTab === 'words' && 'New Words'}
                            {activeTab === 'notices' && 'Reading Articles'}
                            {activeTab === 'video' && 'Video Lessons'}
                            {activeTab === 'favorites' && 'My Favorites'}
                        </h2>
                    </div>



                    {/* Material Grid */}
                    <div className="material-grid">
                        {materials.map(mat => (
                            <div key={mat.id} className="material-card">
                                <div className="card-icon">
                                    {getIcon(mat.category)}
                                </div>
                                <div className="card-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <h4>{mat.title}</h4>
                                        <button
                                            onClick={() => toggleFavorite(mat.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <Heart
                                                size={20}
                                                color="#e94560"
                                                fill={favorites.includes(mat.id) ? "#e94560" : "none"}
                                            />
                                        </button>
                                    </div>
                                    <p>Grade {mat.grade}</p>
                                    {activeTab === 'video' ? (
                                        <button
                                            className="view-btn"
                                            onClick={() => window.open(mat.filename, '_blank')}
                                            style={{ background: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                        >
                                            <Video size={16} /> Watch Video
                                        </button>
                                    ) : (
                                        <button
                                            className="view-btn"
                                            onClick={() => setSelectedMaterial(mat)}
                                        >
                                            View
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {materials.length === 0 && (
                        <div className="empty-state">
                            <p>No materials found in this category.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PDF/Video Viewer Modal */}
            {selectedMaterial && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '95%', height: '95%', maxWidth: 'none', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '15px 20px', background: '#1a1a2e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{selectedMaterial.title}</h3>
                            <button onClick={() => setSelectedMaterial(null)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <PDFViewer materialId={selectedMaterial.id} user={user} />
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal
                    user={user}
                    onClose={() => setIsProfileOpen(false)}
                    onLogout={onLogout}
                />
            )}
        </div>
    );
};

export default StudentDashboard;
