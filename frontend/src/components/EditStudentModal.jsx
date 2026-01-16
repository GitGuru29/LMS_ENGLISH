import React, { useState } from 'react';
import { Lock, Save, X, User } from 'lucide-react';
import api from '../api';

const EditStudentModal = ({ student, onClose, onUpdate }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password) {
            alert("Please enter a new password");
            return;
        }

        try {
            await api.put(`/admin/users/${student.id}`, { password });
            alert(`Password for ${student.full_name} updated successfully!`);
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data || "Update failed");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Reset Password</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', color: '#333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <User size={16} color="#666" />
                        <span style={{ fontWeight: 'bold' }}>{student.full_name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginLeft: '24px' }}>
                        ID: {student.username}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>New Password</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginTop: '5px', background: 'white' }}>
                            <Lock size={18} color="#666" />
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: 'black' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        <Save size={18} /> Save Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;
