import React, { useState } from 'react';
import { UserPlus, X, Save } from 'lucide-react';
import api from '../api';

const AddStudentModal = ({ grade, onClose, onAdd }) => {
    const [formData, setFormData] = useState({ username: '', password: '', full_name: '', email: '' });

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', { ...formData, grade });
            alert("Student added successfully!");
            onAdd(); // Refresh list
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Error adding student");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <UserPlus size={24} color="#e94560" />
                        Register Student (Grade {grade})
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleAddStudent} className="modal-form">
                    <input
                        placeholder="Full Name"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        className="modal-input"
                    />
                    <input
                        placeholder="Student ID / Username"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="modal-input"
                    />
                    <input
                        placeholder="Google Email (Optional)"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="modal-input"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="modal-input"
                        autoComplete="new-password"
                    />
                    <div className="modal-actions">
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={18} /> Add Student
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
