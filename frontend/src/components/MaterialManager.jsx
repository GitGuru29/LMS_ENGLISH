import React, { useState, useEffect } from 'react';
import { Upload, FileText, Type, NotebookPen, Bell, Trash2, BookOpenText, Video } from 'lucide-react';
import api from '../api';
import axios from 'axios';
import PDFViewer from './PDFViewer';

// --- CLOUDINARY CONFIG ---
const CLOUD_NAME = "dpndlzjec";
const UPLOAD_PRESET = "lms-uploads";

const MaterialManager = ({ grade, category, user }) => {
    // ... categories ...
    const categories = [
        { id: 'papers', label: 'Past Papers', icon: FileText },
        { id: 'grammar', label: 'Grammar Activities', icon: Type },
        { id: 'words', label: 'New Words', icon: NotebookPen },
        { id: 'notices', label: 'Reading Articles', icon: BookOpenText },
        { id: 'video', label: 'Video Lessons', icon: Video },
    ];

    const activeCategory = category; // Use prop
    const [materials, setMaterials] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // View Modal State
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        fetchMaterials();
    }, [grade, activeCategory]);

    const fetchMaterials = async () => {
        try {
            const res = await api.get(`/materials?grade=${grade}&category=${activeCategory}`);
            setMaterials(res.data);
        } catch (err) {
            console.error("Error fetching materials:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/materials/${id}`);
            fetchMaterials(); // Refresh list
        } catch (err) {
            console.error(err);
            alert("Failed to delete file.");
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        const file = e.target.file ? e.target.file.files[0] : null;
        const title = e.target.title.value;
        const videoUrl = e.target.url ? e.target.url.value : null;

        // Video URL Handling
        if (activeCategory === 'video') {
            if (!videoUrl) return alert("Please enter a video URL");

            try {
                setUploading(true);
                await api.post('/materials', {
                    title: title,
                    grade: grade,
                    category: activeCategory,
                    fileUrl: videoUrl
                });
                alert("Video Link added successfully!");
                e.target.reset();
                fetchMaterials();
                setIsUploadOpen(false);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 409) {
                    alert(err.response.data.error || "Duplicate file detected. This file has already been uploaded for this grade and category.");
                } else {
                    alert("Failed to add video link");
                }
            } finally {
                setUploading(false);
            }
            return;
        }

        if (!file) return;

        // 5MB Limit Check
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds 5MB limit.");
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // --- Cloudinary Upload (Unsigned) ---
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('resource_type', 'raw'); // CRITICAL: PDFs must use 'raw', not 'image'
        // NOTE: Removed 'folder' param - it causes 404 errors with raw uploads

        try {
            // Log for debugging
            console.log(`Uploading to Cloudinary: ${CLOUD_NAME} with preset ${UPLOAD_PRESET}`);

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            console.log("Cloudinary Response:", response.data);

            // Use the secure_url provided by Cloudinary directly
            const downloadURL = response.data.secure_url;
            console.log("Upload URL:", downloadURL);

            // Send to Backend
            await api.post('/materials', {
                title: title,
                grade: grade,
                category: activeCategory,
                fileUrl: downloadURL // Send the URL instead of file
            });

            alert("Uploaded successfully!");
            e.target.reset();
            fetchMaterials();
            setIsUploadOpen(false);
        } catch (err) {
            console.error("Upload Error:", err);
            if (err.response && err.response.status === 409) {
                alert(err.response.data.error || "Duplicate file detected. This file has already been uploaded for this grade and category.");
            } else {
                const errMsg = err.response?.data?.error?.message || err.message;
                alert(`Upload failed: ${errMsg}`);
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div>
            {/* Removed Category Tabs - Controlled by Sidebar */}

            <button
                className="upload-toggle-btn"
                onClick={() => setIsUploadOpen(!isUploadOpen)}
            >
                {isUploadOpen ? <><Upload size={18} style={{ transform: 'rotate(45deg)' }} /> Close Upload Form</> : <><Upload size={18} /> Upload New {categories.find(c => c.id === activeCategory).label}</>}
            </button>

            {isUploadOpen && (
                <div className="upload-section">
                    <form onSubmit={handleUpload} className="upload-form">
                        <input name="title" placeholder={activeCategory === 'video' ? "Video Title" : "Document Title / Description"} required className="upload-input-text" />

                        {activeCategory === 'video' ? (
                            <input type="url" name="url" placeholder="Paste YouTube/Video URL here" required className="upload-input-text" />
                        ) : (
                            <input type="file" name="file" required className="upload-input-file" accept=".pdf" />
                        )}

                        <button type="submit" disabled={uploading} className="upload-btn">
                            {uploading ? (activeCategory === 'video' ? 'Saving...' : 'Uploading...') : (activeCategory === 'video' ? 'Add Link' : 'Upload')}
                        </button>
                    </form>
                    {uploading && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ width: '100%', backgroundColor: '#ccc', borderRadius: '5px', height: '10px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${uploadProgress}%`,
                                        backgroundColor: '#e94560',
                                        height: '100%',
                                        borderRadius: '5px',
                                        transition: 'width 0.2s ease'
                                    }}
                                />
                            </div>
                            <p style={{ textAlign: 'center', margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                                {uploadProgress}% Uploaded
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* List Section */}
            <div className="material-grid">
                {materials.map(mat => (
                    <div key={mat.id} className="material-card">
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1a1a2e' }}>{mat.title}</h3>
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>Uploaded: {new Date(mat.uploaded_at).toLocaleDateString()}</p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            {activeCategory === 'video' ? (
                                <button
                                    onClick={() => window.open(mat.filename, '_blank')}
                                    className="view-btn"
                                    style={{ flex: 1, background: '#e94560', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                >
                                    <Video size={16} /> Watch Video
                                </button>
                            ) : (
                                <button
                                    onClick={() => setSelectedMaterial(mat)}
                                    className="view-btn"
                                    style={{ flex: 1, background: '#1a1a2e', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                >
                                    <Upload size={16} style={{ transform: 'rotate(90deg)' }} /> View
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(mat.id)}
                                className="delete-btn"
                                style={{ flex: 1, marginTop: 0 }} /* Override margin-top from class for side-by-side */
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
                {materials.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No materials in this category.</p>}
            </div>

            {/* View Modal */}
            {selectedMaterial && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ width: '95%', height: '95%', background: 'white', display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '15px 20px', background: '#1a1a2e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{selectedMaterial.title}</h3>
                            <button onClick={() => setSelectedMaterial(null)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                        </div>
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#333' }}>
                            {/* Pass user for watermark - fallback to empty obj if missing (though it shouldn't be) */}
                            <PDFViewer materialId={selectedMaterial.id} user={user || { full_name: 'Admin', username: 'admin' }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialManager;
